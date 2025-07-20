const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const Script = require('../models/Script');
const twilio = require('../routes/twilio');

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('scriptId', 'name type content')
      .populate('contacts', 'firstName lastName phone')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('scriptId')
      .populate('contacts');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new campaign
router.post('/', async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute campaign for a single contact
async function executeForContact(campaign, contact, script, publicUrl) {
  try {
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log(`📤 Executing ${campaign.type} for contact:`, {
      campaignId: campaign._id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      phone: contact.phone,
      type: campaign.type
    });

    let response;
    switch (campaign.type) {
      case 'call':
        response = await client.calls.create({
          url: `${publicUrl}/api/twilio/voice-response?type=info&campaignId=${campaign._id}`,
          to: contact.phone,
          from: process.env.TWILIO_PHONE_NUMBER,
          statusCallback: `${publicUrl}/api/twilio/call-status`,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
          method: 'POST'
        });
        console.log('📞 Call initiated:', {
          sid: response.sid,
          status: response.status,
          to: contact.phone
        });
        break;

      case 'sms':
        response = await client.messages.create({
          body: script.content,
          to: contact.phone,
          from: process.env.TWILIO_PHONE_NUMBER,
          statusCallback: `${publicUrl}/api/twilio/message-status`
        });
        console.log('💬 SMS sent:', {
          sid: response.sid,
          status: response.status,
          to: contact.phone,
          body: script.content.substring(0, 50) + (script.content.length > 50 ? '...' : '')
        });
        break;

      case 'whatsapp':
        response = await client.messages.create({
          body: script.content,
          to: `whatsapp:${contact.phone}`,
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          statusCallback: `${publicUrl}/api/twilio/message-status`
        });
        console.log('📱 WhatsApp sent:', {
          sid: response.sid,
          status: response.status,
          to: contact.phone
        });
        break;
    }

    // Update campaign stats
    const updatedCampaign = await Campaign.findById(campaign._id);
    updatedCampaign.stats.sent += 1;
    await updatedCampaign.save();
    
    console.log('✅ Campaign stats updated:', {
      campaignId: campaign._id,
      totalSent: updatedCampaign.stats.sent,
      totalContacts: updatedCampaign.stats.total,
      remainingContacts: updatedCampaign.stats.total - (updatedCampaign.stats.sent + updatedCampaign.stats.failed)
    });

  } catch (error) {
    console.error('❌ Error executing campaign:', {
      campaignId: campaign._id,
      contactId: contact._id,
      error: {
        code: error.code,
        message: error.message,
        moreInfo: error.moreInfo
      }
    });
    const updatedCampaign = await Campaign.findById(campaign._id);
    updatedCampaign.stats.failed += 1;
    await updatedCampaign.save();
  }
}

// Start campaign
router.post('/:id/start', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('contacts')
      .populate('scriptId');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get public URL for webhooks
    const publicUrl = req.app.get('getPublicUrl')();
    if (!publicUrl) {
      throw new Error('No public URL available. Cannot execute campaign without webhook URL.');
    }

    // Update campaign status
    campaign.status = 'running';
    campaign.startedAt = new Date();
    await campaign.save();

    // Execute campaign for each contact
    console.log(`Starting campaign ${campaign._id} for ${campaign.contacts.length} contacts`);
    
    // Process contacts in batches to avoid overwhelming the system
    const batchSize = 5;
    const delay = 2000; // 2 seconds between contacts

    for (let i = 0; i < campaign.contacts.length; i += batchSize) {
      // Check if campaign was paused
      const updatedCampaign = await Campaign.findById(campaign._id);
      if (updatedCampaign.status === 'paused') {
        console.log(`Campaign ${campaign._id} was paused. Stopping execution.`);
        return;
      }

      const batch = campaign.contacts.slice(i, i + batchSize);
      
      // Process each contact in the batch
      await Promise.all(batch.map(contact => 
        executeForContact(campaign, contact, campaign.scriptId, publicUrl)
      ));

      // Wait before processing next batch
      if (i + batchSize < campaign.contacts.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Check if all contacts have been processed
      if (i + batchSize >= campaign.contacts.length) {
        // Refresh campaign data to get latest stats
        const finalCampaign = await Campaign.findById(campaign._id);
        if (finalCampaign.stats.sent + finalCampaign.stats.failed >= finalCampaign.stats.total) {
          finalCampaign.status = 'completed';
          finalCampaign.completedAt = new Date();
          await finalCampaign.save();
          console.log(`✅ Campaign ${campaign._id} completed. Final stats:`, finalCampaign.stats);
        }
      }
    }

    res.json({ 
      message: 'Campaign started successfully', 
      campaign: {
        id: campaign._id,
        status: campaign.status,
        totalContacts: campaign.contacts.length
      }
    });

  } catch (error) {
    console.error('Error starting campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pause campaign
router.post('/:id/pause', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    campaign.status = 'paused';
    await campaign.save();
    
    res.json({ message: 'Campaign paused successfully', campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({
      id: campaign._id,
      stats: campaign.stats,
      status: campaign.status,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;