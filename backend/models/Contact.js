const mongoose = require('mongoose');

// Helper function to format phone number to E.164
function formatToE164(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If number doesn't start with +, add it
  if (!phone.startsWith('+')) {
    // If the number starts with 0, remove it and add country code
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // Add the + and country code (995 for Georgia)
    cleaned = '+995' + cleaned;
  }
  
  return cleaned;
}

const contactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Must start with + and contain 10-15 digits
        return /^\+\d{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number! Must be in E.164 format (e.g., +995555123456)`
    }
  },
  whatsappNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Optional field, but if provided must be valid E.164
        return !v || /^\+\d{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid WhatsApp number! Must be in E.164 format (e.g., +995555123456)`
    }
  },
  tags: [String],
  customFields: {
    type: Map,
    of: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastContactedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to format phone numbers
contactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Format phone numbers to E.164
  if (this.phone) {
    try {
      this.phone = formatToE164(this.phone);
    } catch (error) {
      next(new Error('Invalid phone number format'));
      return;
    }
  }
  
  if (this.whatsappNumber) {
    try {
      this.whatsappNumber = formatToE164(this.whatsappNumber);
    } catch (error) {
      next(new Error('Invalid WhatsApp number format'));
      return;
    }
  }
  
  next();
});

module.exports = mongoose.model('Contact', contactSchema);