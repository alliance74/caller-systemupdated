# AI Caller System

A full-stack application for managing AI-powered calling campaigns with Twilio integration.

## 🚀 Deployment Guide

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Twilio account (for calling features)

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Server
PORT=5000
NODE_ENV=production

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# JWT Secret
JWT_SECRET=your_secure_jwt_secret

# Public URL (for Twilio webhooks)
PUBLIC_URL=https://your-domain.com
```

## 🏗️ Hosting Options

### Option 1: Railway (Recommended)

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect your GitHub repository**
3. **Create a new project** and select your repo
4. **Add MongoDB service** from Railway's marketplace
5. **Set environment variables** in Railway dashboard
6. **Deploy** - Railway will automatically build and deploy both frontend and backend

### Option 2: Render

#### Backend Deployment:
1. **Sign up** at [render.com](https://render.com)
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure:**
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment: Node
5. **Add environment variables**
6. **Deploy**

#### Frontend Deployment:
1. **Create a new Static Site**
2. **Connect your GitHub repository**
3. **Configure:**
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. **Add environment variables**
5. **Deploy**

### Option 3: Vercel + Railway

#### Frontend (Vercel):
1. **Sign up** at [vercel.com](https://vercel.com)
2. **Import your GitHub repository**
3. **Configure build settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy**

#### Backend (Railway):
Follow the Railway deployment steps above.

### Option 4: Heroku

#### Backend:
1. **Install Heroku CLI**
2. **Login to Heroku:**
   ```bash
   heroku login
   ```
3. **Create Heroku app:**
   ```bash
   cd backend
   heroku create your-app-name
   ```
4. **Add MongoDB addon:**
   ```bash
   heroku addons:create mongolab
   ```
5. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set TWILIO_ACCOUNT_SID=your_sid
   heroku config:set TWILIO_AUTH_TOKEN=your_token
   heroku config:set TWILIO_PHONE_NUMBER=your_number
   heroku config:set JWT_SECRET=your_secret
   heroku config:set PUBLIC_URL=https://your-app-name.herokuapp.com
   ```
6. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

#### Frontend:
1. **Create a new Heroku app for frontend**
2. **Set buildpack to static:**
   ```bash
   heroku buildpacks:set https://github.com/heroku/heroku-buildpack-static.git
   ```
3. **Create `static.json` in root:**
   ```json
   {
     "root": "dist",
     "routes": {
       "/**": "index.html"
     }
   }
   ```
4. **Build and deploy:**
   ```bash
   npm run build
   git add dist
   git commit -m "Add build files"
   git push heroku main
   ```

## 📝 Post-Deployment Checklist

1. **Test all features** - Make sure calling, SMS, and WhatsApp work
2. **Configure Twilio webhooks** - Point to your new domain
3. **Set up custom domain** (optional)
4. **Configure SSL certificates** (usually automatic)
5. **Set up monitoring** and error tracking
6. **Test CSV import/export** functionality

## 🔧 Troubleshooting

### Common Issues:

1. **CORS errors**: Make sure your frontend URL is allowed in backend CORS settings
2. **MongoDB connection**: Verify your MongoDB URI is correct
3. **Twilio webhooks**: Update webhook URLs to your new domain
4. **Environment variables**: Double-check all variables are set correctly

### Support:
- Check the platform's documentation for specific issues
- Review logs in your hosting platform's dashboard
- Test locally first to isolate issues

## 📊 Performance Tips

1. **Enable caching** for static assets
2. **Use CDN** for better global performance
3. **Optimize images** and assets
4. **Monitor database performance**
5. **Set up proper logging** and monitoring

---

**Need help?** Check the platform-specific documentation or create an issue in this repository.
#   c a l l e r - s y s t e m u p d a t e d  
 