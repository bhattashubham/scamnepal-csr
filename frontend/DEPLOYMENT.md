# 🚀 Community Scam Registry - Frontend Deployment Guide

## 📋 Prerequisites

- Node.js 20+ 
- Docker (for containerized deployment)
- Backend API running and accessible

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env.local` file (for local development) or set these in your deployment platform:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Application Configuration
NEXT_PUBLIC_APP_NAME="Community Scam Registry"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
```

### Production Environment Variables

```bash
# Backend API Configuration
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api

# Application Configuration
NEXT_PUBLIC_APP_NAME="Community Scam Registry"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Production Configuration
NODE_ENV=production
NEXT_PUBLIC_ENABLE_DEVTOOLS=false
```

## 🏗️ Deployment Options

### Option 1: Vercel (Recommended)

1. **Push to GitHub/GitLab/Bitbucket**
2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Configure environment variables
   - Deploy automatically

3. **Environment Variables in Vercel:**
   ```
   NEXT_PUBLIC_API_URL → https://api.your-domain.com/api
   NEXT_PUBLIC_APP_NAME → Community Scam Registry
   NEXT_PUBLIC_APP_VERSION → 1.0.0
   ```

### Option 2: Docker Deployment

1. **Build Docker Image:**
   ```bash
   docker build -t scamnepal-frontend .
   ```

2. **Run Container:**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_API_URL=https://api.your-domain.com/api \
     -e NODE_ENV=production \
     scamnepal-frontend
   ```

3. **Using Docker Compose:**
   ```bash
   docker-compose up -d
   ```

### Option 3: Traditional Server Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

### Option 4: Static Export (for CDN deployment)

1. **Configure for static export in `next.config.ts`:**
   ```typescript
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   }
   ```

2. **Build and export:**
   ```bash
   npm run build
   ```

3. **Deploy the `out/` folder to your CDN**

## 🌐 Platform-Specific Deployment

### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

### AWS Amplify
1. Connect repository to AWS Amplify
2. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
   ```

### Railway
1. Connect repository to Railway
2. Railway will auto-detect Next.js
3. Add environment variables in Railway dashboard

### DigitalOcean App Platform
1. Create new app from repository
2. Configure build and run commands:
   - Build: `npm run build`
   - Run: `npm start`
3. Add environment variables

## 🔍 Health Checks & Monitoring

### Health Endpoint
- **URL:** `/api/health`
- **Method:** GET
- **Response:** JSON with application status and API connectivity

### Example Health Check Response
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "memory": {
    "rss": 67108864,
    "heapTotal": 33554432,
    "heapUsed": 28311552,
    "external": 1048576
  },
  "api": {
    "status": "ok",
    "latency": 120
  }
}
```

## 🛡️ Security Considerations

### Content Security Policy
Add to `next.config.ts`:
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

### HTTPS Configuration
- Always use HTTPS in production
- Configure proper SSL certificates
- Use secure cookies and HSTS headers

## ⚡ Performance Optimization

### Image Optimization
- Next.js Image component is already configured
- Images are automatically optimized
- Use WebP format when possible

### Caching Strategy
- Static assets cached for 1 year
- API responses cached appropriately
- Use CDN for static assets

### Bundle Analysis
```bash
npm run build
npx @next/bundle-analyzer
```

## 🔧 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `NEXT_PUBLIC_API_URL` is correct
   - Verify backend is running and accessible
   - Check CORS configuration on backend

2. **Build Errors**
   - Ensure all environment variables are set
   - Check for TypeScript errors: `npm run type-check`
   - Clear Next.js cache: `rm -rf .next`

3. **Runtime Errors**
   - Check browser console for client-side errors
   - Review server logs for SSR errors
   - Verify all required environment variables

### Debug Mode
Set `NODE_ENV=development` to enable:
- Detailed error messages
- React Query DevTools
- Hot reloading
- Source maps

## 📈 Monitoring & Analytics

### Recommended Tools
- **Error Tracking:** Sentry
- **Performance:** Vercel Analytics or Google Analytics
- **Uptime:** Pingdom or UptimeRobot
- **User Behavior:** Hotjar or LogRocket

### Metrics to Monitor
- Page load times
- API response times
- Error rates
- User engagement
- Search performance

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # Deploy steps here
```

## 🆘 Support

### Getting Help
- **Documentation:** Check this deployment guide
- **Health Check:** Visit `/api/health` endpoint
- **Logs:** Check application and server logs
- **Community:** Contact development team

### Emergency Procedures
1. Check health endpoint
2. Review recent deployments
3. Check backend API status
4. Rollback if necessary
5. Contact support team

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Backend API accessible
- [ ] SSL certificate installed
- [ ] Health checks passing
- [ ] Error monitoring setup
- [ ] Performance monitoring setup
- [ ] Backup and rollback plan ready
- [ ] Team notified of deployment

**🎉 Your Community Scam Registry frontend is ready for production!**
