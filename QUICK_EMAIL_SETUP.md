# 🚀 Quick Email Setup (Manual)

## Current Issue
Your email service is not configured, so emails are being skipped. Here's how to fix it:

## ✅ Manual Setup (3 Steps)

### Step 1: Create .env File
Create a file named `.env` in the `server` directory with this content:

```env
# Email Configuration
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
FRONTEND_URL=http://localhost:3000
```

### Step 2: Get Gmail App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click "Security" → "2-Step Verification" → "App passwords"
3. Select "Mail" and generate a password
4. Copy the 16-character password (like: `abcd efgh ijkl mnop`)

### Step 3: Update .env File
Replace the placeholders in your `.env` file:
- `your_gmail@gmail.com` → Your actual Gmail address
- `your_16_character_app_password` → The 16-character app password from Step 2

### Step 4: Restart Server
```bash
# Stop server (Ctrl+C)
# Then restart
npm start
```

## 🧪 Test It
After setup, make a test purchase and check if emails are sent!

## 🔧 Alternative: Use Setup Script
Run this command for interactive setup:
```bash
node setup-email.js
```

## ❓ Still Not Working?
- Check that `.env` file is in the `server` directory
- Verify you're using app password, not regular password
- Make sure 2-Factor Authentication is enabled on Gmail
- Restart the server after making changes
