const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Import database repositories
const { UserRepository } = require('./repositories/UserRepository');
const { ReportRepository } = require('./repositories/ReportRepository');

// Import forex service
const forexService = require('./services/forexService');

// Risk calculation function
function calculateRiskScore(report) {
  let riskScore = 0;
  
  // Base risk factors
  const riskFactors = {
    // Category-based risk (0-30 points)
    category: {
      'phishing': 25,
      'investment': 30,
      'romance': 20,
      'tech_support': 15,
      'other': 10
    },
    
    // Amount-based risk (0-25 points)
    amount: (amount) => {
      if (amount >= 10000) return 25;
      if (amount >= 5000) return 20;
      if (amount >= 1000) return 15;
      if (amount >= 100) return 10;
      return 5;
    },
    
    // Status-based risk (0-20 points)
    status: {
      'verified': 20,
      'under_review': 15,
      'pending': 10,
      'rejected': 0
    },
    
    // Evidence-based risk (0-15 points)
    evidence: (evidenceCount) => {
      if (evidenceCount >= 5) return 15;
      if (evidenceCount >= 3) return 10;
      if (evidenceCount >= 1) return 5;
      return 0;
    },
    
    // Recency-based risk (0-10 points)
    recency: (daysSinceCreated) => {
      if (daysSinceCreated <= 1) return 10;
      if (daysSinceCreated <= 7) return 7;
      if (daysSinceCreated <= 30) return 5;
      return 2;
    }
  };
  
  // Calculate category risk
  riskScore += riskFactors.category[report.category] || 10;
  
  // Calculate amount risk
  riskScore += riskFactors.amount(report.amount_lost || 0);
  
  // Calculate status risk
  riskScore += riskFactors.status[report.status] || 5;
  
  // Calculate evidence risk (assuming evidence count is passed)
  const evidenceCount = report.evidence_count || 0;
  riskScore += riskFactors.evidence(evidenceCount);
  
  // Calculate recency risk
  const daysSinceCreated = Math.floor((Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24));
  riskScore += riskFactors.recency(daysSinceCreated);
  
  // Ensure risk score is between 0 and 100
  return Math.min(Math.max(riskScore, 0), 100);
}

// Interfaces
interface ExpressRequest {
  body: any;
  headers: any;
  query: any;
  params: any;
  user?: any;
  files?: any[];
  file?: any;
}

interface ExpressResponse {
  json: (data: any) => void;
  status: (code: number) => ExpressResponse;
}

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// Health check endpoint for Render
app.get('/health', (req: ExpressRequest, res: ExpressResponse) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Initialize repositories
const userRepository = new UserRepository();
const reportRepository = new ReportRepository();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = 'uploads/evidence';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
    files: 10 // Max 10 files per request
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: images, videos, PDFs, and common documents.`), false);
    }
  }
});

// Configure multer for profile image uploads
const profileStorage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = 'uploads/profile';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile images
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Only allow image files for profile images
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for profile pictures'), false);
    }
  }
});

// Middleware
// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for development
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});
app.use(limiter);

// Helper functions
const generateToken = (user: any) => {
  return Buffer.from(JSON.stringify({ 
    userId: user.id, 
    email: user.email, 
    role: user.role 
  })).toString('base64');
};

const verifyToken = (token: string) => {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch (error) {
    return null;
  }
};

// Authentication middleware
const authMiddleware = (req: ExpressRequest, res: ExpressResponse, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

// Admin middleware
const adminMiddleware = (req: ExpressRequest, res: ExpressResponse, next: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }
  next();
};

// Utility functions
const transformReportForFrontend = (report: any) => ({
  id: report.id,
  identifierType: report.identifier_type,
  identifierValue: report.identifier_value,
  category: report.category,
  narrative: report.narrative,
  amountLost: report.amount_lost || 0,
  currency: report.currency || 'NPR',
  status: report.status,
  riskScore: report.risk_score || 0,
  reporterUserId: report.reporter_user_id,
  reporterEmail: report.reporter_email,
  incidentDate: report.incident_date,
  incidentChannel: report.incident_channel,
  createdAt: report.created_at,
  updatedAt: report.updated_at
});

// Routes


// Auth routes
app.post('/api/auth/register', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const { email, phone, password } = req.body;

  const existingUser = await userRepository.findByEmailOrPhone(email, phone);
  if (existingUser) {
    return res.status(400).json({ 
      success: false, 
      error: 'User already exists with this email or phone' 
    });
  }

  const newUser = await userRepository.createUser({
    email,
    phone,
      password,
    role: 'member',
      name: 'New User'
  });

  const token = generateToken(newUser);
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.is_verified
      }
    }
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

app.post('/api/auth/login', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const { email, phone, password } = req.body;
  console.log('Login attempt:', { email, phone, password: password ? '******' : undefined });

  const user = await userRepository.findByEmailOrPhone(email, phone);
  console.log('User found:', user ? { id: user.id, email: user.email } : null);
  
  if (!user) {
    console.log('No user found');
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid credentials' 
    });
  }
  
  console.log('Password from request:', password);
  console.log('Password hash from DB:', user.password_hash);
  const passwordMatch = bcrypt.compareSync(password, user.password_hash);
  console.log('Password match:', passwordMatch);
  
  if (!passwordMatch) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid credentials' 
    });
  }

  const token = generateToken(user);
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified
      }
    }
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

app.get('/api/auth/profile', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const user = await userRepository.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

      res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phone,
        role: user.role,
        isVerified: user.is_verified,
        profileImage: user.profile_image,
        createdAt: user.created_at,
        lastLogin: user.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

app.post('/api/auth/logout', authMiddleware, (req: ExpressRequest, res: ExpressResponse) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/refresh', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
      success: false, 
        error: 'Token is required'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const newToken = generateToken(user);
    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newToken,
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phone,
          role: user.role,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          lastLogin: user.updated_at
        },
        expiresIn: 86400
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

app.post('/api/auth/verify-otp', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { email, phoneNumber, otp } = req.body;
    
    const user = await userRepository.findByEmailOrPhone(email, phoneNumber);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Mock OTP verification (always accept '123456')
    if (otp !== '123456') {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      data: {
        token,
        refreshToken: token,
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phone,
          role: user.role,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          lastLogin: user.updated_at
        },
        expiresIn: 86400
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});

app.patch('/api/auth/users/:id/role', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const userId = req.params.id;
  const { role } = req.body;
  
  const user = await userRepository.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  user.role = role;
  await userRepository.updateUser(user);

  res.json({
    success: true,
    data: {
      message: `User role updated to ${role}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    }
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

// Risk calculation endpoint
app.post('/api/reports/recalculate-risk', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // Only allow moderators and admins to recalculate risk scores
    if (!['moderator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    // Get all reports
    const reports = await reportRepository.getAllReports();
    
    // Recalculate risk scores for all reports
    const updatedReports = [];
    for (const report of reports) {
      const newRiskScore = calculateRiskScore({
        ...report,
        evidence_count: report.evidence_count || 0
      });
      
      // Update the report with new risk score
      const updatedReport = await reportRepository.updateReport(report.id, {
        risk_score: newRiskScore
      });
      
      updatedReports.push(updatedReport);
    }

    res.json({
      success: true,
      data: {
        message: `Recalculated risk scores for ${updatedReports.length} reports`,
        updatedCount: updatedReports.length
      }
    });
  } catch (error) {
    console.error('Risk recalculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recalculate risk scores'
    });
  }
});

// Report routes
app.post('/api/reports', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const reportData: any = {
      identifier_type: req.body.identifierType?.substring(0, 100) || 'website',
    identifier_value: req.body.identifierValue,
      category: req.body.scamCategory?.substring(0, 100) || 'other',
    narrative: req.body.narrative,
    amount_lost: req.body.amountLost || 0,
    currency: req.body.currency || 'INR',
    incident_date: req.body.incidentDate ? new Date(req.body.incidentDate) : null,
      incident_channel: req.body.incidentChannel?.substring(0, 100) || 'other',
      reporter_user_id: req.user.userId,
    reporter_email: req.user.email || 'unknown@example.com',
      status: 'pending'
  };

    // Calculate dynamic risk score
    const riskScore = calculateRiskScore({
      ...reportData,
      created_at: new Date().toISOString(),
      evidence_count: 0
    });
    
    reportData.risk_score = riskScore;

    const createdReport = await reportRepository.createReport(reportData);
    
    res.json({
      success: true,
      data: createdReport
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report',
      details: error.message
    });
  }
});

app.get('/api/reports', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    // For testing: Show all reports if user is admin/moderator, otherwise show user's own reports
    let allReports;
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      allReports = await reportRepository.findAllReports();
    } else {
      allReports = await reportRepository.findReportsByReporterId(req.user.userId);
    }

    // Apply filters
    if (status && status !== 'all') {
      allReports = allReports.filter(r => r.status === status);
    }
    if (category && category !== 'all') {
      allReports = allReports.filter(r => r.category === category);
    }
    if (search) {
      allReports = allReports.filter(r => 
        r.identifier_value?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase()) ||
        r.narrative?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by creation date (newest first)
    allReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const paginatedReports = allReports.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        data: paginatedReports.map(transformReportForFrontend),
        total: allReports.length,
        page,
        limit,
        totalPages: Math.ceil(allReports.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

// Special routes should be defined before the generic :id route

// Dashboard reports endpoint - moved before the :id route
app.get('/api/reports/dashboard', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    
    // For testing: Show all reports if user is admin/moderator, otherwise show user's own reports
    let allReports;
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      allReports = await reportRepository.findAllReports();
    } else {
      allReports = await reportRepository.findReportsByReporterId(req.user.userId);
    }
    
    const totalReports = allReports.length;
    const totalPages = Math.ceil(totalReports / limit);
    
    const reports = allReports.slice(offset, offset + limit).map(report => ({
      id: report.id,
      category: report.category,
      identifierType: report.identifier_type,
      identifierValue: report.identifier_value,
      amountLost: report.amount_lost,
      currency: report.currency,
      status: report.status,
      riskScore: report.risk_score,
      reporterEmail: report.reporter_email,
      narrative: report.narrative,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      // Add summary for dashboard
      summary: report.narrative?.substring(0, 100) + (report.narrative?.length > 100 ? '...' : ''),
      // Add status color indicator
      statusColor: report.status === 'verified' ? 'green' : report.status === 'rejected' ? 'red' : 'yellow'
    }));

    // Add dashboard summary statistics
    const dashboardStats = {
      totalReports: totalReports,
      totalAmountLost: allReports.reduce((sum, r) => sum + (r.amount_lost || 0), 0),
      pendingReports: allReports.filter(r => r.status === 'pending').length,
      verifiedReports: allReports.filter(r => r.status === 'verified').length,
      rejectedReports: allReports.filter(r => r.status === 'rejected').length,
      averageRiskScore: allReports.length > 0 
        ? Math.round(allReports.reduce((sum, r) => sum + (r.risk_score || 0), 0) / allReports.length * 100) / 100
        : 0
    };

    res.json({
      success: true,
      data: {
        data: reports,
        total: totalReports,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard reports'
    });
  }
});

// Get similar reports for dashboard
app.get('/api/reports/dashboard/similar', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { category, channel, amount, timeframe = '30d' } = req.query;
    
    const filters: any = {};
    if (category) filters.category = category as string;
    if (channel) filters.channel = channel as string;
    if (amount) filters.amount = parseFloat(amount as string);

    // Get reports from the last 30 days by default
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe as string));
    
    const similarReports = await reportRepository.findSimilarReports(filters, daysAgo);
    
    res.json({
      success: true,
      data: similarReports
    });
  } catch (error) {
    console.error('Error fetching similar reports for dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch similar reports'
    });
  }
});

// Stats endpoint - moved before the :id route
app.get('/api/reports/stats', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // For testing: Show all reports if user is admin/moderator, otherwise show user's own reports
    let allReports;
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      allReports = await reportRepository.findAllReports();
    } else {
      allReports = await reportRepository.findReportsByReporterId(req.user.userId);
    }
    
    // Calculate total amount lost (converted to INR using real-time forex rates)
    let totalAmountLost = 0;
    try {
      for (const report of allReports) {
        const amount = parseFloat(report.amount_lost) || 0;
        const currency = report.currency || 'INR';
        const amountInINR = await forexService.convertToINR(amount, currency);
        totalAmountLost += amountInINR;
      }
    } catch (error) {
      console.error('Error converting currencies:', error);
      // Fallback to simple addition if forex service fails
      totalAmountLost = allReports.reduce((sum, report) => {
        return sum + (parseFloat(report.amount_lost) || 0);
      }, 0);
    }
    
    // Calculate average amount lost
    const averageAmount = totalAmountLost / (allReports.length || 1);
    
    // Get recent activity
    const recentActivity = allReports
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(report => ({
        id: report.id,
        category: report.category,
        identifierValue: report.identifier_value,
        status: report.status,
        createdAt: report.created_at
      }));
    
    // Calculate category breakdown
    const categoryBreakdown = allReports.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Calculate currency breakdown
    const currencyBreakdown = allReports.reduce((acc, report) => {
      const currency = report.currency || 'INR';
      const amount = parseFloat(report.amount_lost) || 0;
      if (!acc[currency]) {
        acc[currency] = { count: 0, totalAmount: 0 };
      }
      acc[currency].count += 1;
      acc[currency].totalAmount += amount;
      return acc;
    }, {} as { [key: string]: { count: number, totalAmount: number } });

    // Get total user count
    const totalUsers = await userRepository.countUsers();

    const stats = {
      totalReports: allReports.length,
      pendingReports: allReports.filter(r => r.status === 'pending' || r.status === 'under_review').length,
      approvedReports: allReports.filter(r => r.status === 'verified').length,
      rejectedReports: allReports.filter(r => r.status === 'rejected').length,
      totalAmountLost,
      averageAmount: Math.round(averageAmount * 100) / 100,
      totalUsers,
      recentActivity,
      categoryBreakdown,
      currencyBreakdown
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report stats'
    });
  }
});

// Generic report by ID endpoint - should be after specific routes
app.get('/api/reports/:id', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const report = await reportRepository.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    if (report.reporter_user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: transformReportForFrontend(report)
    });
  } catch (error) {
    console.error('Error fetching report by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

// Detailed report view endpoint - provides comprehensive report information
app.get('/api/reports/:id/detailed', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const report = await reportRepository.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    if (report.reporter_user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    // Get additional related data
    const similarReports = await reportRepository.findSimilarReports({
      category: report.category,
      channel: report.incident_channel,
      amount: report.amount_lost
    }, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Last 30 days

    // Get evidence files if they exist
    const evidenceFiles = await reportRepository.getFilesForReport(report.id);

    // Calculate risk assessment
    const riskAssessment = {
      level: report.risk_score >= 8 ? 'High' : report.risk_score >= 5 ? 'Medium' : 'Low',
      factors: [
        report.amount_lost > 10000 ? 'High financial impact' : null,
        report.incident_channel === 'online' ? 'Digital vulnerability' : null,
        report.category === 'investment' || report.category === 'crypto' ? 'Complex scam type' : null
      ].filter(Boolean)
    };

    // Enhanced report data for detailed view
    const detailedReport = {
      // Basic report info
      id: report.id,
      identifierType: report.identifier_type,
      identifierValue: report.identifier_value,
      category: report.category,
      narrative: report.narrative,
      amountLost: report.amount_lost || 0,
      currency: report.currency || 'NPR',
      status: report.status,
      riskScore: report.risk_score || 0,
      
      // User info
      reporterUserId: report.reporter_user_id,
      reporterEmail: report.reporter_email,
      
      // Incident details
      incidentDate: report.incident_date,
      incidentChannel: report.incident_channel,
      statusReason: report.status_reason,
      
      // Timestamps
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      
      // Enhanced data
      riskAssessment,
      similarReports: similarReports.slice(0, 5).map(r => ({
        id: r.id,
        category: r.category,
        amountLost: r.amount_lost,
        status: r.status,
        createdAt: r.created_at
      })),
      evidenceFiles,
      
      // Statistics
      totalSimilarReports: similarReports.length,
      averageAmountInCategory: similarReports.length > 0 
        ? similarReports.reduce((sum, r) => sum + (r.amount_lost || 0), 0) / similarReports.length 
        : 0,
      
      // Recommendations
      recommendations: [
        'Report to local authorities if amount exceeds ₹10,000',
        'Monitor your accounts for suspicious activity',
        'Consider freezing affected accounts',
        'Document all communication with the scammer'
      ]
    };

    res.json({
      success: true,
      data: detailedReport
    });
  } catch (error) {
    console.error('Error fetching detailed report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch detailed report'
    });
  }
});

app.patch('/api/reports/:id/status', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;
    
    const report = await reportRepository.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (report.reporter_user_id !== req.user.userId && req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updateData: any = {
      status: status
    };
    
    if (reason) {
      updateData.status_reason = reason;
    } else if (notes) {
      updateData.status_reason = notes;
    }

    const updatedReport = await reportRepository.updateReportStatus(id, status, req.user.userId, reason, notes);

    if (!updatedReport) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update report' 
      });
    }

    res.json({
      success: true,
      data: transformReportForFrontend(updatedReport)
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report status',
      details: error.message
    });
  }
});

// Update report endpoint
app.put('/api/reports/:id', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if report exists
    const existingReport = await reportRepository.findById(id);
    if (!existingReport) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    // Check permissions - only report owner, moderators, or admins can edit
    const isOwner = existingReport.reporter_user_id === req.user.userId;
    const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';
    
    if (!isOwner && !isModerator) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only edit your own reports.' 
      });
    }

    // Validate and sanitize input data
    const validatedData: any = {};
    
    if (updateData.category) {
      validatedData.category = updateData.category.substring(0, 100);
    }
    
    if (updateData.identifierType) {
      validatedData.identifier_type = updateData.identifierType.substring(0, 100);
    }
    
    if (updateData.identifierValue) {
      validatedData.identifier_value = updateData.identifierValue.substring(0, 500);
    }
    
    if (updateData.narrative) {
      validatedData.narrative = updateData.narrative.substring(0, 5000);
    }
    
    if (updateData.amountLost !== undefined) {
      const amount = parseFloat(updateData.amountLost);
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount. Must be a positive number.'
        });
      }
      validatedData.amount_lost = amount;
    }
    
    if (updateData.currency) {
      validatedData.currency = updateData.currency.substring(0, 10);
    }
    
    if (updateData.incidentDate) {
      const date = new Date(updateData.incidentDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid incident date format.'
        });
      }
      validatedData.incident_date = date;
    }
    
    if (updateData.incidentChannel) {
      validatedData.incident_channel = updateData.incidentChannel.substring(0, 100);
    }
    
    if (updateData.contactMethod) {
      validatedData.contact_method = updateData.contactMethod.substring(0, 100);
    }
    
    if (updateData.suspectedLinks && Array.isArray(updateData.suspectedLinks)) {
      validatedData.suspected_links = JSON.stringify(updateData.suspectedLinks);
    }
    
    if (updateData.additionalInfo) {
      validatedData.additional_info = JSON.stringify(updateData.additionalInfo);
    }

    // Only moderators and admins can change status
    if (updateData.status && isModerator) {
      const validStatuses = ['pending', 'under_review', 'verified', 'rejected'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be one of: pending, under_review, verified, rejected'
        });
      }
      validatedData.status = updateData.status;
    }

    // Only moderators and admins can change risk score
    if (updateData.riskScore !== undefined && isModerator) {
      const riskScore = parseInt(updateData.riskScore);
      if (isNaN(riskScore) || riskScore < 0 || riskScore > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid risk score. Must be a number between 0 and 100.'
        });
      }
      validatedData.risk_score = riskScore;
    }

    // Update the report
    const updatedReport = await reportRepository.updateReport(
      id, 
      validatedData, 
      req.user.userId
    );

    if (!updatedReport) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update report'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Report updated successfully',
        report: updatedReport
      }
    });

  } catch (error: any) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report',
      details: error.message
    });
  }
});

app.delete('/api/reports/:id', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    
    const report = await reportRepository.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (report.reporter_user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await reportRepository.deleteReport(report.id);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
});

// File upload endpoints
app.post('/api/reports/:id/evidence', authMiddleware, upload.array('evidence', 10), async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const reportId = req.params.id;
    const files = req.files as any[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No files uploaded' }
      });
    }

    // Validate file sizes
    const maxSize = 15 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      return res.status(400).json({
        success: false,
        error: { 
          message: `Files exceed 15MB limit: ${oversizedFiles.map(f => f.originalname).join(', ')}` 
        }
      });
    }

    const uploadedFiles = files.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageUrl: `/uploads/evidence/${file.filename}`,
      uploadedAt: new Date().toISOString()
    }));

    await reportRepository.addFilesToReport(reportId, uploadedFiles);

    res.json({
      success: true,
      data: {
        message: `${files.length} file(s) uploaded successfully`,
        files: uploadedFiles
      }
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to upload files' }
    });
  }
});

app.get('/api/reports/:id/evidence', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const reportId = req.params.id;
    const files = await reportRepository.getFilesForReport(reportId);
    res.json({
      success: true,
      data: files
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch evidence' }
    });
  }
});

// Get report status history
app.get('/api/reports/:id/history', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const reportId = req.params.id;
    
    // Check if user has access to this report
    const report = await reportRepository.findById(reportId);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    if (report.reporter_user_id !== req.user.userId && req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    const history = await reportRepository.getStatusHistory(reportId);
    
    // Add initial report creation as first history entry
    const fullHistory = [
      {
        id: 'initial',
        report_id: reportId,
        old_status: null,
        new_status: 'pending',
        changed_by: null,
        changed_by_email: null,
        changed_by_name: null,
        reason: 'Report submitted',
        notes: 'Initial report submission',
        created_at: report.created_at
      },
      ...history
    ];

    res.json({
      success: true,
      data: fullHistory
    });
  } catch (error: any) {
    console.error('Error fetching report history:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch report history' }
    });
  }
});

// Stats endpoint has been moved before the generic :id route

// Dashboard reports endpoint has been moved before the generic :id route

// Similar reports endpoint
app.get('/api/reports/:id/similar', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    
    const currentReport = await reportRepository.findById(id);
    if (!currentReport) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const allReports = await reportRepository.findAllReports();
    const similarReports = allReports
      .filter(r => r.id !== id && r.category === currentReport.category)
      .slice(0, limit)
      .map(report => ({
        id: report.id,
        category: report.category,
        identifierType: report.identifier_type,
        identifierValue: report.identifier_value,
        amountLost: report.amount_lost,
        currency: report.currency,
        status: report.status,
        riskScore: report.risk_score,
        reporterEmail: report.reporter_email,
        narrative: report.narrative,
        createdAt: report.created_at
      }));

    res.json({
      success: true,
      data: similarReports
    });
  } catch (error) {
    console.error('Error fetching similar reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch similar reports'
    });
  }
});

// Search routes
app.get('/api/search', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const query = req.query.text as string || req.query.q as string;
  const type = req.query.type as string;
  const category = req.query.category as string;
  const status = req.query.status as string;
  const riskScoreMin = req.query.riskScoreMin ? parseInt(req.query.riskScoreMin as string) : undefined;
  const riskScoreMax = req.query.riskScoreMax ? parseInt(req.query.riskScoreMax as string) : undefined;
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const sortBy = req.query.sortBy as string || 'relevance';
  const sortOrder = req.query.sortOrder as string || 'DESC';
  const includeFacets = req.query.includeFacets === 'true';
  const includeSuggestions = req.query.includeSuggestions === 'true';

  let filteredReports = await reportRepository.findAllReports();

  // Apply search query
  if (query) {
    filteredReports = filteredReports.filter(r => 
      r.identifier_value?.toLowerCase().includes(query.toLowerCase()) ||
      r.category?.toLowerCase().includes(query.toLowerCase()) ||
      r.narrative?.toLowerCase().includes(query.toLowerCase()) ||
      r.reporter_email?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Apply filters
  if (type && type !== 'all') {
    filteredReports = filteredReports.filter(r => r.identifier_type === type);
  }
  if (category && category !== 'all') {
    filteredReports = filteredReports.filter(r => r.category === category);
  }
  if (status && status !== 'all') {
    filteredReports = filteredReports.filter(r => r.status === status);
  }
  if (riskScoreMin !== undefined) {
    filteredReports = filteredReports.filter(r => (r.risk_score || 0) >= riskScoreMin);
  }
  if (riskScoreMax !== undefined) {
    filteredReports = filteredReports.filter(r => (r.risk_score || 0) <= riskScoreMax);
  }
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filteredReports = filteredReports.filter(r => new Date(r.created_at) >= fromDate);
  }
  if (dateTo) {
    const toDate = new Date(dateTo);
    filteredReports = filteredReports.filter(r => new Date(r.created_at) <= toDate);
  }

  // Apply sorting
  filteredReports.sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'risk_score':
        aValue = a.risk_score || 0;
        bValue = b.risk_score || 0;
        break;
      case 'title':
        aValue = a.identifier_value || '';
        bValue = b.identifier_value || '';
        break;
        default:
        aValue = a.risk_score || 0;
        bValue = b.risk_score || 0;
    }
    
      return sortOrder === 'ASC' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  // Apply pagination
  const offset = (page - 1) * limit;
  const paginatedReports = filteredReports.slice(offset, offset + limit);

  // Convert reports to SearchResult format
  const searchResults = paginatedReports.map(report => ({
    id: report.id,
    type: 'report' as const,
    title: `${report.category} scam - ${report.identifier_value}`,
    description: report.narrative?.substring(0, 200) + (report.narrative && report.narrative.length > 200 ? '...' : ''),
    relevance: report.risk_score || 0,
    metadata: {
      category: report.category,
      identifierType: report.identifier_type,
      identifierValue: report.identifier_value,
      amountLost: report.amount_lost,
      currency: report.currency,
      status: report.status,
      riskScore: report.risk_score,
      reporterEmail: report.reporter_email,
      createdAt: report.created_at
    },
    url: `/dashboard/reports/${report.id}`,
    timestamp: report.created_at
  }));

  // Calculate facets if requested
  let facets = undefined;
  if (includeFacets) {
    const allReports = await reportRepository.findAllReports();
    facets = {
      types: allReports.reduce((acc, r) => {
        acc[r.identifierType] = (acc[r.identifierType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      categories: allReports.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      statuses: allReports.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      riskScores: {
        low: allReports.filter(r => (r.riskScore || 0) < 60).length,
        medium: allReports.filter(r => (r.riskScore || 0) >= 60 && (r.riskScore || 0) < 80).length,
        high: allReports.filter(r => (r.riskScore || 0) >= 80).length
      }
    };
  }

  // Generate suggestions if requested
  let suggestions: string[] | undefined = undefined;
  if (includeSuggestions && query) {
    const allReports = await reportRepository.findAllReports();
    const seen = new Set<string>();
    suggestions = [];
    
    allReports.forEach(report => {
      if (report.category?.toLowerCase().includes(query.toLowerCase()) && !seen.has(report.category)) {
        suggestions!.push(report.category);
        seen.add(report.category);
      }
      if (report.identifier_value?.toLowerCase().includes(query.toLowerCase()) && !seen.has(report.identifier_value)) {
        suggestions!.push(report.identifier_value);
        seen.add(report.identifier_value);
      }
    });
    
      suggestions = suggestions!.slice(0, 5);
  }

    const executionTime = Date.now() - Date.now();

  res.json({
    success: true,
    data: {
      results: searchResults,
      total: filteredReports.length,
      page,
      limit,
      executionTime,
      facets,
      suggestions,
      query: {
        text: query,
        filters: { type, category, status, riskScoreMin, riskScoreMax, dateFrom, dateTo },
        processedQuery: query || 'all'
      }
    }
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

app.get('/api/search/autocomplete', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const query = req.query.query as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  if (!query || query.length < 2) {
    return res.json({
      success: true,
      data: { suggestions: [] }
    });
  }

  const suggestions: Array<{
    text: string;
    type: string;
    count: number;
  }> = [];
  const seen = new Set();

  const reports = await reportRepository.findAllReports();
    
  reports.forEach(report => {
    if (report.identifier_value?.toLowerCase().includes(query.toLowerCase()) && !seen.has(report.identifier_value)) {
      suggestions.push({
        text: report.identifier_value,
        type: 'identifier',
        count: reports.filter(r => r.identifier_value === report.identifier_value).length
      });
      seen.add(report.identifier_value);
    }
  });

  const categories = ['phishing', 'romance', 'investment', 'tech_support', 'lottery', 'job_scam', 'rental', 'crypto'];
  categories.forEach(cat => {
    if (cat.toLowerCase().includes(query.toLowerCase())) {
      const count = reports.filter(r => r.category === cat).length;
      if (count > 0) {
        suggestions.push({
          text: cat,
          type: 'category',
          count
        });
      }
    }
  });

  suggestions.sort((a, b) => b.count - a.count);
  const limitedSuggestions = suggestions.slice(0, limit);

  res.json({
    success: true,
    data: { suggestions: limitedSuggestions }
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Autocomplete failed'
    });
  }
});

app.get('/api/search/trending', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const timeframe = req.query.timeframe as string || 'day';
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  const categoryCounts: { [key: string]: number } = {};
  const reports = await reportRepository.findAllReports();
  reports.forEach(report => {
    categoryCounts[report.category] = (categoryCounts[report.category] || 0) + 1;
  });

  const trending = Object.entries(categoryCounts)
    .map(([value, count]) => ({ value, count, type: 'category' }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, limit);

  res.json({
    success: true,
    data: trending
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get trending searches'
    });
  }
});

app.get('/api/search/similar', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const itemId = req.query.itemId as string;
  const type = req.query.type as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  if (!itemId || !type) {
    return res.status(400).json({
      success: false,
      error: 'itemId and type are required'
    });
  }

  const currentReport = await reportRepository.findById(itemId);
  if (!currentReport) {
    return res.json({
      success: true,
      data: []
    });
  }

  const similarReports = await reportRepository.findReportsByCategory(currentReport.category)
    .then(reports => reports.filter(r => r.id !== itemId))
    .then(reports => reports.slice(0, limit))
    .then(reports => reports.map(report => ({
      id: report.id,
      type: 'report' as const,
      title: `${report.category} scam - ${report.identifier_value}`,
      description: report.narrative?.substring(0, 200) + (report.narrative && report.narrative.length > 200 ? '...' : ''),
      relevance: report.risk_score || 0,
      metadata: {
        category: report.category,
        identifierType: report.identifier_type,
        identifierValue: report.identifier_value,
        amountLost: report.amount_lost,
        currency: report.currency,
        status: report.status,
        riskScore: report.risk_score,
        reporterEmail: report.reporter_email,
        createdAt: report.created_at
      },
      url: `/dashboard/reports/${report.id}`,
      timestamp: report.created_at
    })));

  res.json({
    success: true,
    data: similarReports
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to find similar items'
    });
  }
});

app.get('/api/search/analytics', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const timeframe = req.query.timeframe as string || 'month';
  
  const totalReports = await reportRepository.countReports();
    const totalSearches = totalReports * 3;
    const uniqueUsers = new Set(await reportRepository.findAllReports()).size;

  const analytics = {
    totalSearches,
    uniqueUsers,
    topQueries: [
      { query: 'phishing', count: await reportRepository.countReportsByCategory('phishing') * 2 },
      { query: 'investment', count: await reportRepository.countReportsByCategory('investment') * 2 },
      { query: 'tech support', count: await reportRepository.countReportsByCategory('tech_support') * 2 }
    ],
    searchesByType: {
      'report': totalSearches * 0.8,
      'entity': totalSearches * 0.15,
      'identifier': totalSearches * 0.05
    },
    averageResultsPerQuery: Math.round(totalReports / totalSearches * 100) / 100,
      averageExecutionTime: 45,
    popularFilters: {
      'category': totalSearches * 0.6,
      'status': totalSearches * 0.4,
      'risk_score': totalSearches * 0.3,
      'date_range': totalSearches * 0.2
    },
    trendsOverTime: [
      { date: '2025-08-20', searches: Math.floor(totalSearches * 0.3) },
      { date: '2025-08-21', searches: Math.floor(totalSearches * 0.25) },
      { date: '2025-08-22', searches: Math.floor(totalSearches * 0.2) },
      { date: '2025-08-23', searches: Math.floor(totalSearches * 0.15) },
      { date: '2025-08-24', searches: Math.floor(totalSearches * 0.1) }
    ]
  };

  res.json({
    success: true,
    data: analytics
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get search analytics'
    });
  }
});

app.get('/api/search/saved', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const savedSearches = await userRepository.findSavedSearchesByUserId(req.user.userId);
    res.json({
      success: true,
      data: savedSearches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saved searches'
    });
  }
});

app.post('/api/search/save', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { query, filters, name } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false, 
        error: 'Query is required'
      });
    }

    const savedSearch = await userRepository.saveSearch({
      query,
      filters: filters || {},
      name: name || `Search: ${query.slice(0, 30)}${query.length > 30 ? '...' : ''}`,
      userId: req.user.userId,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      data: savedSearch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save search'
    });
  }
});

// Dashboard routes
app.get('/api/dashboard/reports', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const status = req.query.status as string;
  const category = req.query.category as string;
  const search = req.query.search as string;
  const offset = (page - 1) * limit;

    let filteredReports: any[] = [];
    let total = 0;

    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      const userReports = await reportRepository.findReportsByReporterId(req.user.userId);
      filteredReports = userReports;
      total = userReports.length;
    } else {
      const filters: any = {};
      if (status && status !== 'all') filters.status = status;
      if (category && category !== 'all') filters.category = category;
      
      if (search) {
        const searchResult = await reportRepository.searchReports(search, filters, page, limit);
        filteredReports = searchResult.data;
        total = searchResult.total;
      } else {
        const allReports = await reportRepository.findAllReports();
        filteredReports = allReports;
        total = allReports.length;
      }
    }

    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        data: paginatedReports.map(transformReportForFrontend),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

app.get('/api/dashboard/stats', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
    try {
    const userReports = await reportRepository.findReportsByReporterId(req.user.userId);

    const totalAmountLost = userReports.reduce((sum, r) => sum + (r.amount_lost || 0), 0);
    const averageAmount = userReports.length > 0 ? totalAmountLost / userReports.length : 0;
    
    const recentActivity = userReports
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        type: 'report',
        title: `${r.category} scam reported`,
        description: r.narrative?.substring(0, 100) + '...',
        timestamp: r.created_at,
        status: r.status
      }));

    const categoryBreakdown = userReports.reduce((acc, r) => {
      const cat = r.category || 'unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const stats = {
      totalReports: userReports.length,
      pendingReports: userReports.filter(r => r.status === 'pending').length,
      approvedReports: userReports.filter(r => r.status === 'verified').length,
      rejectedReports: userReports.filter(r => r.status === 'rejected').length,
      totalAmountLost,
      averageAmount: Math.round(averageAmount * 100) / 100,
      recentActivity,
      categoryBreakdown
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
});

// Moderation routes
app.get('/api/moderation/queue', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const pendingReports = await reportRepository.findReportsByStatus('pending');
  const underReviewReports = await reportRepository.findReportsByStatus('under_review');
  const verifiedReports = await reportRepository.findReportsByStatus('verified');
  const rejectedReports = await reportRepository.findReportsByStatus('rejected');

  // Combine pending and under_review reports for the queue
  const allQueueReports = [...pendingReports, ...underReviewReports];

  res.json({
    success: true,
    data: {
      tasks: allQueueReports.map(report => ({
        id: report.id,
        type: 'report',
        itemId: report.id,
        priority: report.risk_score > 80 ? 'high' : report.risk_score > 60 ? 'medium' : 'low',
        status: report.status === 'under_review' ? 'under_review' : 'pending',
        title: `${report.category} scam - ${report.identifier_value}`,
        riskScore: report.risk_score,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        assignedTo: report.status === 'under_review' ? req.user.userId : null, // Show as assigned if under review
        dueDate: null
      })),
      total: allQueueReports.length,
      stats: {
        pending: pendingReports.length,
        underReview: underReviewReports.length,
        requiresInfo: 0,
        escalated: 0,
        completed: verifiedReports.length + rejectedReports.length,
        total: pendingReports.length + underReviewReports.length + verifiedReports.length + rejectedReports.length,
        averageProcessingTime: 24,
        overdueTasks: 0
      }
    }
  });
  } catch (error) {
  res.status(500).json({
    success: false, 
    error: 'Failed to fetch moderation queue'
  });
  }
});

app.get('/api/moderation/queue/:id', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const taskId = req.params.id;
  const report = await reportRepository.findById(taskId);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const task = {
    id: report.id,
    type: 'report',
    itemId: report.id,
    priority: report.risk_score > 80 ? 'high' : report.risk_score > 60 ? 'medium' : 'low',
    status: 'pending',
    title: `${report.category} scam - ${report.identifier_value}`,
    riskScore: report.risk_score,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    assignedTo: null,
    dueDate: null
  };

  res.json({
    success: true,
    data: task
  });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: 'Failed to fetch moderation task'
    });
  }
});

app.post('/api/moderation/queue/:id/assign', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const taskId = req.params.id;
  const { moderatorId } = req.body;
  
  const report = await reportRepository.findById(taskId);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const task = {
    id: report.id,
    type: 'report',
    itemId: report.id,
    priority: report.risk_score > 80 ? 'high' : report.risk_score > 60 ? 'medium' : 'low',
    status: 'under_review',
    title: `${report.category} scam - ${report.identifier_value}`,
    riskScore: report.risk_score,
    createdAt: report.created_at,
    updatedAt: new Date().toISOString(),
    assignedTo: moderatorId,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  await reportRepository.updateReport(taskId, { status: 'under_review' });

  res.json({
    success: true,
    data: task
  });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: 'Failed to assign task'
    });
  }
});

app.post('/api/moderation/queue/:id/unassign', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const taskId = req.params.id;
  const report = await reportRepository.findById(taskId);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const task = {
    id: report.id,
    type: 'report',
    itemId: report.id,
    priority: report.risk_score > 80 ? 'high' : report.risk_score > 60 ? 'medium' : 'low',
    status: 'pending',
    title: `${report.category} scam - ${report.identifier_value}`,
    riskScore: report.risk_score,
    createdAt: report.created_at,
    updatedAt: new Date().toISOString(),
    assignedTo: null,
    dueDate: null
  };

  await reportRepository.updateReport(taskId, { status: 'pending' });

  res.json({
    success: true,
    data: task
  });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: 'Failed to unassign task'
    });
  }
});

app.patch('/api/moderation/queue/:id/status', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const taskId = req.params.id;
  const { status, reason } = req.body;
  
  const report = await reportRepository.findById(taskId);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const task = {
    id: report.id,
    type: 'report',
    itemId: report.id,
    priority: report.risk_score > 80 ? 'high' : report.risk_score > 60 ? 'medium' : 'low',
    status: status,
    title: `${report.category} scam - ${report.identifier_value}`,
    riskScore: report.risk_score,
    createdAt: report.created_at,
    updatedAt: new Date().toISOString(),
    assignedTo: req.user.userId,
    dueDate: null
  };

  if (status === 'completed') {
    await reportRepository.updateReport(taskId, { status: 'verified' });
  } else if (status === 'rejected') {
    await reportRepository.updateReport(taskId, { status: 'rejected' });
  }

  res.json({
    success: true,
    data: task
  });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: 'Failed to update task status'
    });
  }
});

app.patch('/api/moderation/queue/:id/priority', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const taskId = req.params.id;
  const { priority, reason } = req.body;
  
  const report = await reportRepository.findById(taskId);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const task = {
    id: report.id,
    type: 'report',
    itemId: report.id,
    priority: priority,
    status: 'pending',
    title: `${report.category} scam - ${report.identifier_value}`,
    riskScore: report.risk_score,
    createdAt: report.created_at,
    updatedAt: new Date().toISOString(),
    assignedTo: null,
    dueDate: null
  };

  res.json({
    success: true,
    data: task
  });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: 'Failed to update task priority'
    });
  }
});

app.post('/api/moderation/queue/:id/decide', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const taskId = req.params.id;
  const { decision, reason, notes, actionData } = req.body;
  
  const report = await reportRepository.findById(taskId);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  let newStatus = 'pending';
  if (decision === 'approve') {
    newStatus = 'verified';
  } else if (decision === 'reject') {
    newStatus = 'rejected';
  } else if (decision === 'escalate') {
    newStatus = 'under_review';
  } else if (decision === 'require_info') {
    newStatus = 'requires_more_info';
  }

  const task = {
    id: report.id,
    type: 'report',
    itemId: report.id,
    priority: report.risk_score > 80 ? 'high' : report.risk_score > 60 ? 'medium' : 'low',
    status: newStatus,
    title: `${report.category} scam - ${report.identifier_value}`,
    riskScore: report.risk_score,
    createdAt: report.created_at,
    updatedAt: new Date().toISOString(),
    assignedTo: req.user.userId,
    dueDate: null
  };

  if (decision === 'approve') {
    await reportRepository.updateReport(taskId, { status: 'verified' });
  } else if (decision === 'reject') {
    await reportRepository.updateReport(taskId, { status: 'rejected' });
  } else if (decision === 'escalate') {
    await reportRepository.updateReport(taskId, { status: 'under_review' });
  } else if (decision === 'require_info') {
    await reportRepository.updateReport(taskId, { status: 'requires_more_info' });
  }

  res.json({
    success: true,
    data: {
      task,
      decision: {
        decision,
        reason,
        notes,
        actionData,
        moderatorId: req.user.userId,
        timestamp: new Date().toISOString()
      }
    }
  });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: 'Failed to make decision'
    });
  }
});

app.get('/api/moderation/assigned', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const moderatorId = req.query.moderatorId || req.user.userId;
  
  // Get all reports that are under review (assigned tasks)
  const assignedReports = await reportRepository.findReportsByStatus('under_review');
  
  // Filter to only show reports assigned to the current moderator
  // For now, we'll show all under_review reports as assigned tasks
  const assignedTasks = assignedReports.map(report => ({
    id: report.id,
    type: 'report',
    itemId: report.id,
    priority: report.risk_score > 80 ? 'high' : report.risk_score > 60 ? 'medium' : 'low',
    status: 'under_review',
    title: `${report.category} scam - ${report.identifier_value}`,
    riskScore: report.risk_score,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    assignedTo: moderatorId,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }));

  res.json({
    success: true,
    data: assignedTasks
  });
  } catch (error) {
  res.status(500).json({
    success: false, 
    error: 'Failed to fetch assigned tasks'
  });
  }
});

app.get('/api/moderation/overdue', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const overdueTasks = await userRepository.findOverdueTasksByModeratorId(req.user.userId);
  res.json({
    success: true,
    data: overdueTasks
  });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: 'Failed to fetch overdue tasks'
    });
  }
});

app.get('/api/moderation/analytics', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const timeframe = req.query.timeframe || 'month';
  
  const totalReports = await reportRepository.countReports();
  const pendingReports = await reportRepository.countReportsByStatus('pending');
  const verifiedReports = await reportRepository.countReportsByStatus('verified');
  const rejectedReports = await reportRepository.countReportsByStatus('rejected');

  const analytics = {
    totalDecisions: totalReports,
    decisionsByType: {
      pending: pendingReports,
      verified: verifiedReports,
      rejected: rejectedReports
    },
    decisionsByItemType: {
      report: totalReports
    },
      averageDecisionTime: 24,
      escalationRate: 0.1,
    topModerators: [
      {
        moderatorId: 'admin1',
        decisions: totalReports,
        averageTime: 24
      }
    ]
  };

  res.json({
    success: true,
    data: analytics
  });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: 'Failed to fetch moderation analytics'
    });
  }
});

app.get('/api/moderation/moderator-stats', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const moderatorId = req.query.moderatorId || req.user.userId;
  const timeframe = req.query.timeframe || 'month';
  
  const stats = {
    totalDecisions: 0,
    averageDecisionTime: 0,
    accuracy: 0.95,
    efficiency: 0.88
  };

  res.json({
    success: true,
    data: stats
  });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: 'Failed to fetch moderator stats'
    });
  }
});

app.get('/api/moderation/queue/:id/history', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const taskId = req.params.id;
  const report = await reportRepository.findById(taskId);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  const history = await userRepository.findDecisionHistoryByTaskId(taskId);

  res.json({
    success: true,
    data: history
  });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: 'Failed to fetch decision history'
    });
  }
});

app.post('/api/moderation/bulk-update', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const { taskIds, action, data } = req.body;
  
  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Task IDs are required'
    });
  }

  const updatedTasks = await userRepository.bulkUpdateTasks(taskIds, action, data);

  res.json({
    success: true,
    data: {
      message: `Updated ${taskIds.length} tasks`,
      updatedTasks
    }
  });
  } catch (error) {
  res.status(500).json({
    success: false, 
    error: 'Failed to perform bulk update'
  });
  }
});

// Bulk update tasks endpoint
app.patch('/api/moderation/queue/bulk', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { taskIds, updates } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Task IDs are required'
      });
    }

    let updatedCount = 0;
    for (const taskId of taskIds) {
      try {
        if (updates.status) {
          await reportRepository.updateReport(taskId, { status: updates.status });
        }
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update task ${taskId}:`, error);
      }
    }
    
    res.json({
      success: true,
      data: { updatedCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update tasks'
    });
  }
});

// Moderation decisions endpoint
app.post('/api/moderation/decisions', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { taskId, decision, reason, notes, actionData } = req.body;
    
    const report = await reportRepository.findById(taskId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    let newStatus = 'pending';
    if (decision === 'approve') {
      newStatus = 'verified';
    } else if (decision === 'reject') {
      newStatus = 'rejected';
    } else if (decision === 'escalate') {
      newStatus = 'under_review';
    } else if (decision === 'require_info') {
      newStatus = 'requires_more_info';
    }

    await reportRepository.updateReport(taskId, { status: newStatus });

    res.json({
      success: true,
      data: {
        success: true,
        actionTaken: `Report ${decision}d`,
        updatedItem: {
          id: report.id,
          status: newStatus,
          decision,
          reason,
          notes,
          moderatorId: req.user.userId,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record decision'
    });
  }
});

// Bulk make decisions endpoint
app.post('/api/moderation/decisions/bulk', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { decisions } = req.body;
    
    if (!decisions || !Array.isArray(decisions) || decisions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Decisions array is required'
      });
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const decisionData of decisions) {
      try {
        const { taskId, decision, reason, notes, actionData } = decisionData;
        
        const report = await reportRepository.findById(taskId);
        if (!report) {
          results.push({
            taskId,
            success: false,
            error: 'Task not found'
          });
          failed++;
          continue;
        }

        let newStatus = 'pending';
        if (decision === 'approve') {
          newStatus = 'verified';
        } else if (decision === 'reject') {
          newStatus = 'rejected';
        } else if (decision === 'escalate') {
          newStatus = 'under_review';
        } else if (decision === 'require_info') {
          newStatus = 'requires_more_info';
        }

        await reportRepository.updateReport(taskId, { status: newStatus });

        results.push({
          taskId,
          success: true,
          actionTaken: `Report ${decision}d`
        });
        successful++;
      } catch (error) {
        results.push({
          taskId: decisionData.taskId,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    res.json({
      success: true,
      data: {
        successful,
        failed,
        results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk decisions'
    });
  }
});

app.get('/api/moderation/stats', authMiddleware, adminMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const pending = await reportRepository.countReportsByStatus('pending');
  const underReview = await reportRepository.countReportsByStatus('under_review');
  const verified = await reportRepository.countReportsByStatus('verified');
  const rejected = await reportRepository.countReportsByStatus('rejected');
  const total = await reportRepository.countReports();

  const stats = {
    pending,
    underReview,
    requiresInfo: 0,
    escalated: 0,
    completed: verified + rejected,
    total,
    averageProcessingTime: 24,
    overdueTasks: 0
  };

  res.json({
    success: true,
    data: stats
  });
  } catch (error) {
  res.status(500).json({
    success: false,
    error: 'Failed to fetch moderation stats'
  });
  }
});

// Entity routes
app.get('/api/entities', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const status = req.query.status as string;
  const search = req.query.search as string;
  const offset = (page - 1) * limit;

    const reports = await reportRepository.findAllReports();
    
    const entities = reports.map(report => ({
      id: `entity_${report.id}`,
      displayName: report.identifier_value,
      riskScore: report.risk_score || 0,
      status: report.status === 'verified' ? 'confirmed' : 
              report.status === 'rejected' ? 'cleared' : 
              report.status === 'under_review' ? 'disputed' : 'alleged',
      reportCount: 1,
      totalAmountLost: report.amount_lost || 0,
      tags: [report.category, report.identifier_type],
      createdAt: report.created_at,
      updatedAt: report.updated_at
    }));

    let filteredEntities = entities;

    if (status && status !== 'all') {
      filteredEntities = filteredEntities.filter(e => e.status === status);
    }
    if (search) {
      filteredEntities = filteredEntities.filter(e => 
        e.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        e.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    filteredEntities.sort((a, b) => b.riskScore - a.riskScore);
    const paginatedEntities = filteredEntities.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        data: paginatedEntities,
        total: filteredEntities.length,
        page,
        limit,
        totalPages: Math.ceil(filteredEntities.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entities'
    });
  }
});

app.get('/api/entities/:id', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const entityId = req.params.id;
    
    // Extract report ID from entity ID (entity_<reportId>)
    const reportId = entityId.replace('entity_', '');
    
    const report = await reportRepository.findById(reportId);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Entity not found' 
      });
    }

    // Get additional statistics for this entity
    const reportCount = await reportRepository.countReportsByStatus('verified', reportId);
    const totalAmountLost = await reportRepository.sumAmountLostByReportId(reportId);
    
    const entity = {
      id: `entity_${report.id}`,
      displayName: report.identifier_value,
      riskScore: report.risk_score || 0,
      status: report.status === 'verified' ? 'confirmed' : 
              report.status === 'rejected' ? 'cleared' : 
              report.status === 'under_review' ? 'disputed' : 'alleged',
      reportCount,
      totalAmountLost: totalAmountLost || 0,
      lastReported: report.created_at,
      identifierType: report.identifier_type,
      category: report.category,
      narrative: report.narrative,
      amountLost: report.amount_lost,
      currency: report.currency,
      incidentDate: report.incident_date,
      incidentChannel: report.incident_channel,
      createdAt: report.created_at,
      updatedAt: report.updated_at
    };

    res.json({
      success: true,
      data: entity
    });
  } catch (error) {
    console.error('Error fetching entity details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entity details'
    });
  }
});

app.get('/api/entities/stats', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
  const entities = await reportRepository.findAllReports();
  const entitiesWithCounts = await Promise.all(entities.map(async report => {
    const reportCount = await reportRepository.countReportsByStatus('verified', report.id);
    const totalAmountLost = await reportRepository.sumAmountLostByReportId(report.id);
    return {
      id: `entity_${report.id}`,
      displayName: report.identifier_value,
      riskScore: report.risk_score || 0,
      status: report.status === 'verified' ? 'confirmed' : 
              report.status === 'rejected' ? 'cleared' : 
              report.status === 'under_review' ? 'disputed' : 'alleged',
      reportCount: reportCount,
      totalAmountLost: totalAmountLost,
      tags: [report.category, report.identifier_type],
      createdAt: report.created_at,
      updatedAt: report.updated_at
    };
  }));

  const stats = {
    totalEntities: entitiesWithCounts.length,
    highRisk: entitiesWithCounts.filter(e => e.riskScore >= 80).length,
    underReview: entitiesWithCounts.filter(e => e.status === 'disputed').length,
    communityReports: entitiesWithCounts.reduce((sum, e) => sum + e.reportCount, 0)
  };

  res.json({
    success: true,
    data: stats
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entity stats'
    });
  }
});

// Error handling middleware
app.use((err: any, req: ExpressRequest, res: ExpressResponse, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.use((error: any, req: ExpressRequest, res: ExpressResponse, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: { message: 'File size exceeds 15MB limit' }
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: { message: 'Too many files. Maximum 10 files allowed.' }
      });
    }
    return res.status(400).json({
      success: false,
      error: { message: `Upload error: ${error.message}` }
    });
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: { message: error.message }
    });
  }
  
  next(error);
});

// Profile image upload endpoint
app.post('/api/profile/upload-image', authMiddleware, profileUpload.single('profileImage'), async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const userId = req.user.userId;
    const imagePath = `/uploads/profile/${req.file.filename}`;

    // Update user's profile image
    const updatedUser = await userRepository.updateUser(userId, { profileImage: imagePath });
    
    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile image'
      });
    }

    res.json({
      success: true,
      data: {
        profileImage: imagePath
      }
    });
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile image'
    });
  }
});

// Comments endpoints
app.get('/api/reports/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 20 } = req.query
    const userId = req.user?.userId || null // Optional user ID for reactions

    const comments = await reportRepository.getComments(id, parseInt(page as string), parseInt(limit as string), userId)
    res.json({
      success: true,
      data: comments
    })
  } catch (error) {
    console.error('Get comments error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch comments' })
  }
})

app.post('/api/reports/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { content, parentId } = req.body
    const userId = req.user?.userId

    if (!content || !userId) {
      return res.status(400).json({ success: false, error: 'Content and user ID are required' })
    }

    const comment = await reportRepository.addComment(id, userId, content, parentId)
    res.json({
      success: true,
      data: comment
    })
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ success: false, error: 'Failed to add comment' })
  }
})

// Get all replies for a specific comment
app.get('/api/comments/:id/replies', async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 20 } = req.query
    const userId = req.user?.userId || null

    const replies = await reportRepository.getCommentReplies(id, parseInt(page as string), parseInt(limit as string), userId)
    res.json({
      success: true,
      data: replies
    })
  } catch (error) {
    console.error('Get replies error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch replies' })
  }
})

app.post('/api/comments/:id/reactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { type } = req.body // 'like', 'love', 'support'
    const userId = req.user?.userId

    if (!type || !userId) {
      return res.status(400).json({ success: false, error: 'Reaction type and user ID are required' })
    }

    const reaction = await reportRepository.toggleReaction(id, userId, type)
    res.json({
      success: true,
      data: reaction
    })
  } catch (error) {
    console.error('Toggle reaction error:', error)
    res.status(500).json({ success: false, error: 'Failed to toggle reaction' })
  }
})

// User management endpoints (Admin only)
app.get('/api/admin/users', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // Only allow admins to access user management
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    const result = await userRepository.getAllUsers(page, limit);
    
    res.json({
      success: true,
      data: {
        users: result.users.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          phone: user.phone,
          isVerified: user.is_verified,
          profileImage: user.profile_image,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        })),
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

app.post('/api/admin/users', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // Only allow admins to create users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    const { email, password, role, name, phone } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (!['member', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be member, moderator, or admin'
      });
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user
    const newUser = await userRepository.createUser({
      email,
      password,
      role: role || 'member',
      name,
      phone
    });

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        phone: newUser.phone,
        isVerified: newUser.is_verified,
        createdAt: newUser.created_at
      }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

app.put('/api/admin/users/:id', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // Only allow admins to update users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate role if provided
    if (updateData.role && !['member', 'moderator', 'admin'].includes(updateData.role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be member, moderator, or admin'
      });
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = bcrypt.hashSync(updateData.password, 10);
    }

    // Update user
    const updatedUser = await userRepository.updateUser(id, updateData);
    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update user'
      });
    }

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
        phone: updatedUser.phone,
        isVerified: updatedUser.is_verified,
        updatedAt: updatedUser.updated_at
      }
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // Only allow admins to delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete user
    const deleted = await userRepository.deleteUser(id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'User deleted successfully'
      }
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// 404 handler
app.use('*', (req: ExpressRequest, res: ExpressResponse) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});



// Forex rates management endpoints
app.get('/api/forex/status', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const cacheInfo = forexService.getCacheInfo();
    res.json({
      success: true,
      data: cacheInfo
    });
  } catch (error: any) {
    console.error('Error getting forex status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get forex status'
    });
  }
});

app.post('/api/forex/refresh', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // Only allow admins to manually refresh rates
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can refresh forex rates'
      });
    }
    
    const newRates = await forexService.refreshRates();
    res.json({
      success: true,
      data: {
        message: 'Forex rates refreshed successfully',
        rates: newRates
      }
    });
  } catch (error: any) {
    console.error('Error refreshing forex rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh forex rates'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:3000`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;