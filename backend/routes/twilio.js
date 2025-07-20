const express = require('express');
const router = express.Router();
const OptOut = require('../models/OptOut');

// Check if Twilio credentials are properly configured
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const agentNumber = process.env.AGENT_NUMBER;

let client = null;

// Enhanced Twilio configuration check
function validateTwilioConfig() {
  const configErrors = [];
  
  if (!accountSid) configErrors.push('TWILIO_ACCOUNT_SID is missing');
  else if (!accountSid.startsWith('AC')) configErrors.push('TWILIO_ACCOUNT_SID must start with AC');
  
  if (!authToken) configErrors.push('TWILIO_AUTH_TOKEN is missing');
  if (!twilioPhoneNumber) configErrors.push('TWILIO_PHONE_NUMBER is missing');
  if (!twilioWhatsAppNumber) configErrors.push('TWILIO_WHATSAPP_NUMBER is missing');
  if (!agentNumber) configErrors.push('AGENT_NUMBER is missing');

  return configErrors;
}

// Initialize Twilio client with enhanced error handling
try {
  const configErrors = validateTwilioConfig();
  
  if (configErrors.length > 0) {
    console.error('❌ Twilio Configuration Errors:');
    configErrors.forEach(error => console.error(`  - ${error}`));
  } else {
    const twilio = require('twilio');
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully');
    console.log(`📞 Using phone number: ${twilioPhoneNumber}`);
    console.log(`💬 Using WhatsApp number: ${twilioWhatsAppNumber}`);
  }
} catch (error) {
  console.error('❌ Error initializing Twilio client:', error.message);
}

// Enhanced error handling middleware
const handleTwilioError = (error, req, res) => {
  console.error('❌ Twilio Error:', {
    code: error.code,
    message: error.message,
    moreInfo: error.moreInfo,
    status: error.status,
    details: error.details
  });

  // Common Twilio error codes and friendly messages
  const errorMessages = {
    20404: 'The requested resource was not found.',
    20003: 'Authentication error - please check your Twilio credentials.',
    21211: 'Invalid phone number format.',
    21214: 'Phone number is not a valid mobile number.',
    21608: 'Phone number is not in a valid region.',
    21610: 'Message queue is full.',
    21612: 'The maximum number of queued messages has been reached.',
    21614: 'Invalid callback URL.',
    30001: 'Queue overflow.',
    30002: 'Account suspended.',
    30003: 'Unreachable destination handset.',
    30004: 'Message blocked.',
    30005: 'Unknown destination handset.',
    30006: 'Landline or unreachable carrier.',
    30007: 'Carrier violation.',
    30008: 'Unknown error.',
  };

  const userMessage = errorMessages[error.code] || 'An unexpected error occurred.';
  
  res.status(error.status || 500).json({
    error: true,
    message: userMessage,
    code: error.code,
    reference: error.moreInfo
  });
};

// Enhanced middleware to check Twilio configuration
const checkTwilioConfig = (req, res, next) => {
  if (!client) {
    console.error('❌ Twilio service not configured');
    return res.status(503).json({ 
      error: true,
      message: 'Twilio service not configured. Please check server logs for details.' 
    });
  }
  next();
};

// Test endpoint to verify Twilio configuration
router.get('/test-config', async (req, res) => {
  try {
    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    // Test account access
    const account = await client.api.accounts(accountSid).fetch();
    
    // Test phone number validation
    const phoneNumberDetails = await client.lookups.v2
      .phoneNumbers(twilioPhoneNumber)
      .fetch();

    res.json({
      success: true,
      status: 'Twilio configuration is valid',
      account: {
        sid: account.sid,
        status: account.status,
        type: account.type
      },
      phoneNumber: {
        number: phoneNumberDetails.phoneNumber,
        valid: true
      }
    });

  } catch (error) {
    handleTwilioError(error, req, res);
  }
});

// Test call endpoint
router.post('/test-call', checkTwilioConfig, async (req, res) => {
  try {
    console.log('📞 Initiating test call...');
    
    const publicUrl = req.app.get('getPublicUrl')();
    if (!publicUrl) {
      throw new Error('No public URL available. Cannot make calls without a public webhook URL.');
    }

    const call = await client.calls.create({
      url: `${publicUrl}/api/twilio/voice-response?type=${req.body.type || 'info'}`,
      to: req.body.to,
      from: twilioPhoneNumber,
      statusCallback: `${publicUrl}/api/twilio/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      method: 'POST'
    });

    console.log('✅ Test call initiated:', {
      callSid: call.sid,
      status: call.status,
      direction: call.direction,
      webhookUrl: `${publicUrl}/api/twilio/voice-response?type=${req.body.type || 'info'}`
    });

    res.json({
      success: true,
      message: 'Test call initiated',
      callId: call.sid,
      status: call.status
    });

  } catch (error) {
    console.error('❌ Error making test call:', error);
    handleTwilioError(error, req, res);
  }
});

// Test SMS endpoint
router.post('/test-sms', checkTwilioConfig, async (req, res) => {
  try {
    console.log('💬 Sending test SMS...');
    
    const message = await client.messages.create({
      body: 'This is a test message from your NEXERATM system.',
      from: twilioPhoneNumber,
      to: agentNumber // Using agent number for test
    });

    console.log('✅ Test SMS sent:', {
      messageSid: message.sid,
      status: message.status
    });

    res.json({
      success: true,
      message: 'Test SMS sent',
      messageId: message.sid,
      status: message.status
    });

  } catch (error) {
    console.error('❌ Error sending test SMS:', error);
    handleTwilioError(error, req, res);
  }
});

// Store missed calls to handle callbacks
const missedCalls = new Map();

// Voice response for outbound calls
router.post('/voice-response', (req, res) => {
  if (!client) {
    return res.status(503).send('Twilio service not configured');
  }

  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const response = new VoiceResponse();
  const callType = req.query.type || 'info'; // Default to info call if not specified
  
  // Check if this is a callback number
  const from = req.body.From;
  if (missedCalls.has(from)) {
    handleCallBack(response);
    return res.type('text/xml').send(response.toString());
  }

  switch(callType) {
    case 'info':
      handleInfoCall(response);
      break;
    case 'sms':
      handleSmsInfoCall(response);
      break;
    case 'agent':
      handleAgentTransferCall(response);
      break;
    default:
      handleInfoCall(response);
  }

  res.type('text/xml');
  res.send(response.toString());
});

// Handle informational call flow
function handleInfoCall(response) {
  const gather = response.gather({
    numDigits: 1,
    action: '/api/twilio/handle-info-input',
    method: 'POST',
    timeout: 10
  });

  gather.say({
    voice: 'alice',
    language: 'en-US'
  }, 'You can visit our website at company.ge. If you do not want future calls like this, press 9.');

  // If no input received
  response.say('We didn\'t receive any input. Goodbye.');
  response.hangup();
}

// Handle SMS info call flow
function handleSmsInfoCall(response) {
  const gather = response.gather({
    numDigits: 1,
    action: '/api/twilio/handle-sms-input',
    method: 'POST',
    timeout: 10
  });

  gather.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Press 1 to get info by SMS.');

  // If no input received
  response.say('We didn\'t receive any input. Goodbye.');
  response.hangup();
}

// Handle agent transfer call flow
function handleAgentTransferCall(response) {
  const gather = response.gather({
    numDigits: 1,
    action: '/api/twilio/handle-agent-input',
    method: 'POST',
    timeout: 10
  });

  gather.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Press 5 to speak to an agent. This call may be recorded.');

  // If no input received
  response.say('We didn\'t receive any input. Goodbye.');
  response.hangup();
}

// Handle callback flow
function handleCallBack(response) {
  const gather = response.gather({
    numDigits: 1,
    action: '/api/twilio/handle-callback-input',
    method: 'POST',
    timeout: 10
  });

  gather.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Press 1 to receive info. Press 9 to opt out.');

  // If no input received
  response.say('We didn\'t receive any input. Goodbye.');
  response.hangup();
}

// Handle info call input
router.post('/handle-info-input', async (req, res) => {
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const response = new VoiceResponse();
  const digits = req.body.Digits;
  const from = req.body.From;

  if (digits === '9') {
    // Handle opt-out
    await OptOut.create({
      phoneNumber: from,
      optOutCode: 'CALL'
    });
    response.say('You have been opted out from future calls. Goodbye.');
  } else {
    response.say('Thank you for your interest. Goodbye.');
  }

  response.hangup();
  res.type('text/xml').send(response.toString());
});

// Handle SMS info input
router.post('/handle-sms-input', async (req, res) => {
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const response = new VoiceResponse();
  const digits = req.body.Digits;
  const from = req.body.From;

  if (digits === '1') {
    // Send SMS with info
    await client.messages.create({
      body: 'Would you like more info about NEXERATM?',
      from: twilioPhoneNumber,
      to: from
    });
    response.say('Information has been sent to your phone. Goodbye.');
  } else {
    response.say('Invalid input received. Goodbye.');
  }

  response.hangup();
  res.type('text/xml').send(response.toString());
});

// Handle agent transfer input
router.post('/handle-agent-input', (req, res) => {
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const response = new VoiceResponse();
  const digits = req.body.Digits;

  if (digits === '5') {
    response.say('Transferring you to an agent. Please hold.');
    // Add your agent transfer logic here
    // For example:
    // response.dial('YOUR_AGENT_NUMBER');
  } else {
    response.say('Invalid input received. Goodbye.');
    response.hangup();
  }

  res.type('text/xml').send(response.toString());
});

// Handle callback input
router.post('/handle-callback-input', async (req, res) => {
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const response = new VoiceResponse();
  const digits = req.body.Digits;
  const from = req.body.From;

  if (digits === '1') {
    // Send info via SMS
    await client.messages.create({
      body: 'Hi! Join NEXERATM — a next-gen platform. WhatsApp us. STOP 111 to opt out.',
      from: twilioPhoneNumber,
      to: from
    });
    response.say('Information has been sent to your phone. Goodbye.');
  } else if (digits === '9') {
    // Handle opt-out
    await OptOut.create({
      phoneNumber: from,
      optOutCode: 'CALL'
    });
    response.say('You have been opted out from future calls. Goodbye.');
  } else {
    response.say('Invalid input received. Goodbye.');
  }

  response.hangup();
  res.type('text/xml').send(response.toString());
});

// Handle missed calls
router.post('/call-status', (req, res) => {
  const callStatus = req.body.CallStatus;
  const from = req.body.From;

  if (callStatus === 'no-answer' || callStatus === 'busy' || callStatus === 'failed') {
    missedCalls.set(from, {
      timestamp: new Date(),
      status: callStatus
    });
  }

  res.sendStatus(200);
});

// Handle inbound SMS/WhatsApp
router.post('/inbound-message', async (req, res) => {
  try {
    const { From, Body } = req.body;
    
    if (Body.trim().toUpperCase() === 'YES') {
      // Send direct SMS with platform info
      await client.messages.create({
        body: 'Hi! Join NEXERATM — a next-gen platform. WhatsApp us. STOP 111 to opt out.',
        from: twilioPhoneNumber,
        to: From
      });
    } else if (Body.trim().toUpperCase() === 'STOP 111') {
      // Handle opt-out
      await OptOut.create({
        phoneNumber: From,
        optOutCode: '111'
      });
      
      await client.messages.create({
        body: 'You have been opted out from future messages.',
        from: twilioPhoneNumber,
        to: From
      });
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling inbound message:', error);
    res.sendStatus(500);
  }
});

// Handle message status updates
router.post('/message-status', (req, res) => {
  const messageStatus = req.body.MessageStatus;
  const messageSid = req.body.MessageSid;
  const to = req.body.To;
  const errorCode = req.body.ErrorCode;

  console.log('📬 Message Status Update:', {
    sid: messageSid,
    to: to,
    status: messageStatus,
    errorCode: errorCode || 'none'
  });

  // Log specific status details
  switch (messageStatus) {
    case 'delivered':
      console.log('✅ Message delivered successfully');
      break;
    case 'failed':
      console.error('❌ Message delivery failed:', {
        errorCode,
        to
      });
      break;
    case 'undelivered':
      console.error('⚠️ Message undelivered:', {
        errorCode,
        to
      });
      break;
  }

  res.sendStatus(200);
});

module.exports = router;