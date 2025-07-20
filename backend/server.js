const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Store the public URL
let publicUrl = process.env.PUBLIC_URL || null;

// Middleware
app.use(cors());
app.use(express.json());

// Function to get the public URL
const getPublicUrl = () => publicUrl;

// Make getPublicUrl available to routes
app.set('getPublicUrl', getPublicUrl);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-caller-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Routes
app.use('/api/scripts', require('./routes/scripts'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/twilio', require('./routes/twilio'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../dist')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Setup ngrok when in development
if (process.env.NODE_ENV !== 'production') {
  const ngrok = require('ngrok');
  (async function() {
    try {
      const url = await ngrok.connect({
        addr: PORT,
        // Add your ngrok auth token if you have one
        authtoken: process.env.NGROK_AUTH_TOKEN
      });
      publicUrl = url;
      console.log(`🌍 Public URL: ${url}`);
    } catch (err) {
      console.error('Ngrok Error:', err);
      console.log('❌ Failed to create public URL. Twilio voice features will not work.');
    }
  })();
}

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    if (process.env.NODE_ENV !== 'production') {
      ngrok.kill();
    }
    process.exit(0);
  });
});