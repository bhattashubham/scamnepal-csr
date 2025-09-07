# 🚀 ScamNepal CSR - Deployment Guide

## 📋 **Deployment Overview**

This guide covers deploying the ScamNepal Community Scam Registry to:
- **Backend**: Render (Node.js API)
- **Frontend**: Vercel (Next.js App)
- **Database**: Render PostgreSQL

---

## 🎯 **Prerequisites**

- GitHub repository with your code
- Render account (free tier available)
- Vercel account (free tier available)
- Domain name (optional, for custom domains)

---

## 🗄️ **Step 1: Deploy Backend to Render**

### 1.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### 1.2 Create PostgreSQL Database
1. In Render dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Configure:
   - **Name**: `scamnepal-db`
   - **Database**: `scamnepal_csr`
   - **User**: `postgres`
   - **Plan**: Free
4. Click **"Create Database"**
5. **Save the connection details** (you'll need them later)

### 1.3 Deploy Backend Service
1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `scamnepal-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free
5. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-secure-jwt-secret-here
   DB_HOST=your-db-host-from-step-1.2
   DB_PORT=5432
   DB_NAME=scamnepal_csr
   DB_USER=postgres
   DB_PASSWORD=your-db-password-from-step-1.2
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```
6. Click **"Create Web Service"**

### 1.4 Database Setup
1. Once backend is deployed, go to your database dashboard
2. Click **"Connect"** → **"External Connection"**
3. Use the connection string to run the schema:
   ```bash
   psql "your-connection-string" -f backend/database/schema.sql
   ```

---

## 🎨 **Step 2: Deploy Frontend to Vercel**

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Import your GitHub repository

### 2.2 Configure Frontend Deployment
1. In Vercel dashboard, click **"New Project"**
2. Select your repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.onrender.com/api
   NEXT_PUBLIC_APP_NAME=Community Scam Registry
   NEXT_PUBLIC_APP_VERSION=1.0.0
   NEXT_PUBLIC_APP_ENVIRONMENT=production
   ```
5. Click **"Deploy"**

### 2.3 Update Backend CORS
1. Go back to your Render backend service
2. Update the `CORS_ORIGIN` environment variable with your Vercel domain
3. Redeploy the backend service

---

## 🔧 **Step 3: Configuration & Testing**

### 3.1 Test Backend API
```bash
# Health check
curl https://your-backend-domain.onrender.com/health

# Test authentication
curl -X POST https://your-backend-domain.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bhattashubham@gmail.com","password":"121212"}'
```

### 3.2 Test Frontend
1. Visit your Vercel domain
2. Try logging in with test credentials:
   - **Email**: `bhattashubham@gmail.com`
   - **Password**: `121212`
3. Test all major features:
   - User registration
   - Report creation
   - File uploads
   - Search functionality

---

## 🛠️ **Step 4: Production Optimizations**

### 4.1 Backend Optimizations
- Enable **Auto-Deploy** from main branch
- Set up **Health Checks** (already configured)
- Configure **Logging** and **Monitoring**
- Set up **Backup** for database

### 4.2 Frontend Optimizations
- Enable **Analytics** (Google Analytics)
- Set up **Error Monitoring** (Sentry)
- Configure **Custom Domain** (optional)
- Enable **Performance Monitoring**

### 4.3 Security Enhancements
- Update **JWT_SECRET** to a strong, random value
- Configure **Rate Limiting** (already implemented)
- Set up **CORS** properly
- Enable **HTTPS** (automatic on both platforms)

---

## 📊 **Step 5: Monitoring & Maintenance**

### 5.1 Render Monitoring
- Monitor **CPU** and **Memory** usage
- Check **Logs** for errors
- Monitor **Database** performance
- Set up **Alerts** for downtime

### 5.2 Vercel Monitoring
- Monitor **Build** status
- Check **Analytics** and **Performance**
- Monitor **Error** rates
- Set up **Webhooks** for notifications

---

## 🔄 **Step 6: CI/CD Setup**

### 6.1 Automatic Deployments
Both platforms support automatic deployments:
- **Render**: Deploys on push to main branch
- **Vercel**: Deploys on push to main branch

### 6.2 Environment Management
- **Development**: Local development
- **Staging**: Preview deployments (Vercel)
- **Production**: Main branch deployments

---

## 🚨 **Troubleshooting**

### Common Issues

#### Backend Issues
- **Database Connection**: Check environment variables
- **Build Failures**: Check Node.js version compatibility
- **CORS Errors**: Verify CORS_ORIGIN setting
- **File Uploads**: Check upload directory permissions

#### Frontend Issues
- **API Connection**: Verify NEXT_PUBLIC_API_URL
- **Build Failures**: Check for TypeScript errors
- **Environment Variables**: Ensure all required vars are set
- **Routing Issues**: Check Next.js configuration

### Debug Commands
```bash
# Check backend logs
# (Available in Render dashboard)

# Check frontend build logs
# (Available in Vercel dashboard)

# Test API endpoints
curl -v https://your-backend-domain.onrender.com/health
```

---

## 📈 **Performance Optimization**

### Backend Performance
- **Database Indexing**: Add indexes for frequently queried fields
- **Caching**: Implement Redis for session storage
- **CDN**: Use CloudFlare for static assets
- **Load Balancing**: Upgrade to paid plan for multiple instances

### Frontend Performance
- **Image Optimization**: Use Next.js Image component
- **Code Splitting**: Implement dynamic imports
- **Caching**: Configure proper cache headers
- **Bundle Analysis**: Use `npm run build:analyze`

---

## 🔒 **Security Checklist**

- [ ] Strong JWT secret configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] File upload restrictions in place
- [ ] HTTPS enabled (automatic)
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] Error messages don't leak sensitive info
- [ ] Regular security updates

---

## 📞 **Support & Resources**

### Documentation
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)

### Community
- [Render Community](https://community.render.com/)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Next.js Discord](https://discord.gg/nextjs)

---

## 🎉 **Deployment Complete!**

Your ScamNepal Community Scam Registry is now live and ready to help protect users from scams in Nepal!

### Live URLs
- **Frontend**: `https://your-app-name.vercel.app`
- **Backend API**: `https://your-backend-name.onrender.com`
- **API Documentation**: `https://your-backend-name.onrender.com/api`

### Next Steps
1. **Test all functionality** thoroughly
2. **Set up monitoring** and alerts
3. **Configure custom domain** (optional)
4. **Add analytics** and error tracking
5. **Plan for scaling** as user base grows

---

*Last Updated: January 2025*
*Version: 1.0.0*
