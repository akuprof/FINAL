# 🚀 Netlify Deployment Guide for PLS Travels

## **Quick Deploy (Recommended)**

### **Option 1: Deploy from GitHub (Easiest)**

1. **Go to [Netlify](https://netlify.com)**
2. **Click "New site from Git"**
3. **Choose GitHub and authorize**
4. **Select your repository: `akuprof/FINAL`**
5. **Configure build settings:**
   - **Build command:** `npm run build:client`
   - **Publish directory:** `dist/public`
6. **Click "Deploy site"**

### **Option 2: Manual Deploy**

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=dist/public
   ```

## **🔧 Configuration**

### **Build Settings**
- **Build Command:** `npm run build:client`
- **Publish Directory:** `dist/public`
- **Node Version:** 18.19.0

### **Environment Variables**
Add these in Netlify dashboard → Site settings → Environment variables:

```
NODE_ENV=production
VITE_SUPABASE_URL=https://lcmxoxiafeeqjxbnwlic.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjbXhveGlhZmVlcWp4Ym53bGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNjEzNzYsImV4cCI6MjA3MTYzNzM3Nn0.jbT_JYQxEaWQRz5QyLKkfQ_IoTwRjPCzxB7CuSySF08
```

### **API Proxy Configuration**
The `netlify.toml` file is configured to proxy `/api/*` requests to your Railway backend:
- **Backend URL:** `https://final-production-8f03.up.railway.app`

## **📁 Project Structure**

```
dist/
├── public/           # Frontend build (Netlify deploy)
│   ├── index.html
│   └── assets/
└── production.js     # Backend build (Railway deploy)
```

## **🌐 URLs**

- **Frontend (Netlify):** `https://your-site-name.netlify.app`
- **Backend (Railway):** `https://final-production-8f03.up.railway.app`
- **Database (Supabase):** `https://lcmxoxiafeeqjxbnwlic.supabase.co`

## **✅ Verification Steps**

1. **Check Build Status:**
   - Go to Netlify dashboard
   - Verify build completed successfully

2. **Test Frontend:**
   - Visit your Netlify URL
   - Should show PLS Travels login page

3. **Test API Connection:**
   - Try to sign up/login
   - Check browser dev tools for API calls

4. **Test Backend Health:**
   - Visit: `https://final-production-8f03.up.railway.app/api/health`

## **🔧 Troubleshooting**

### **Build Fails**
- Check Node.js version (should be 18.19.0)
- Verify all dependencies are installed
- Check build logs in Netlify dashboard

### **API Calls Fail**
- Verify Railway backend is running
- Check CORS settings
- Ensure environment variables are set

### **Authentication Issues**
- Verify Supabase credentials
- Check browser console for errors
- Ensure cookies are being set properly

## **🚀 Custom Domain (Optional)**

1. **Go to Netlify dashboard**
2. **Site settings → Domain management**
3. **Add custom domain**
4. **Configure DNS records**

## **📊 Monitoring**

- **Netlify Analytics:** Built-in performance monitoring
- **Railway Logs:** Backend monitoring
- **Supabase Dashboard:** Database monitoring

## **🔄 Continuous Deployment**

Once connected to GitHub:
- **Automatic deploys** on every push to `main`
- **Preview deploys** on pull requests
- **Rollback** to previous versions if needed

---

**🎉 Your PLS Travels Fleet Management System is now deployed on Netlify!**
