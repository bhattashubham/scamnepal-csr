# ScamNepal - Community Scam Registry

A comprehensive platform for tracking, reporting, and verifying scams with community-driven verification. Built to protect users from fraud and create a safer digital environment in Nepal.

## 🚀 Features

- **Scam Reporting**: Submit detailed reports with evidence files
- **Community Verification**: Crowdsourced verification system
- **Search & Verification**: Check suspicious entities before engaging
- **Moderation Dashboard**: Admin tools for content management
- **Real-time Analytics**: Track scam patterns and trends
- **File Upload Support**: Images, videos, PDFs, and documents
- **Mobile Responsive**: Works on all devices

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with comprehensive schema
- **Authentication**: JWT-based auth system
- **File Storage**: Local file system with multer
- **State Management**: Zustand for client state

## 📁 Project Structure

```
Scamnepal/
├── backend/                 # Backend API server
│   ├── config/             # Database configuration
│   ├── database/           # Database schema and migrations
│   ├── repositories/       # Data access layer
│   ├── server.ts           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities and API clients
│   │   ├── stores/        # State management
│   │   └── types/         # TypeScript type definitions
│   └── package.json       # Frontend dependencies
├── shared/                 # Shared types and utilities
└── docker-compose.yml      # Docker setup
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **ORM**: Custom repository pattern
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Scamnepal
```

### 2. Backend Setup
```bash
cd backend
cp env.example .env
# Edit .env with your database credentials
npm install
npm run build
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your API URL
npm install
npm run dev
```

### 4. Database Setup
```bash
cd backend
# Create database
psql -U your_username -c "CREATE DATABASE scamnepal_csr;"

# Run schema
psql -U your_username -d scamnepal_csr -f database/schema.sql
```

## ⚙️ Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scamnepal_csr
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Community Scam Registry
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/verify-otp` - Verify OTP

### Reports
- `POST /api/reports` - Create new report
- `GET /api/reports` - Get reports with filters
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Search & Analytics
- `GET /api/search` - Search entities and reports
- `GET /api/entities/stats` - Get entity statistics
- `GET /api/analytics/dashboard` - Dashboard analytics

## 🔐 Authentication

The system uses JWT tokens for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## 📁 File Upload

Supported file types:
- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Videos**: MP4, AVI, MOV, WMV, FLV, WebM
- **Documents**: PDF, DOC, DOCX, TXT, CSV

Maximum file size: 15MB per file, up to 10 files per request.

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts and profiles
- **reports**: Scam reports and details
- **evidence**: File attachments for reports
- **entities**: Scammer profiles and entities
- **moderation_tasks**: Content moderation workflow
- **search_analytics**: Search and usage analytics

## 🚀 Deployment

### Docker (Recommended)
```bash
docker-compose up -d
```

### Manual Deployment
1. Build both frontend and backend
2. Set up PostgreSQL database
3. Configure environment variables
4. Use PM2 or similar for process management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

- [ ] Email verification system
- [ ] SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] API rate limiting improvements
- [ ] Multi-language support
- [ ] Blockchain integration for immutable records

---

**Built with ❤️ for a safer digital Nepal**
