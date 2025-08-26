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

interface ExpressRequest {
  body: any
  headers: any
  query: any
  params: any
  user?: any
  files?: any[]
}

interface ExpressResponse {
  json: (data: any) => void;
  status: (code: number) => ExpressResponse;
}

const app = express();
const PORT = process.env.PORT || 3001;

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
    fileSize: 15 * 1024 * 1024, // 15MB limit as requested
    files: 10 // Max 10 files per request
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Check file type - allow images, videos, PDFs, and common document types
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

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Helper function to generate JWT token (simplified for development)
const generateToken = (user: any) => {
  return Buffer.from(JSON.stringify({ 
    userId: user.id, 
    email: user.email, 
    role: user.role 
  })).toString('base64');
};

// Helper function to verify token
const verifyToken = (token: string) => {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded;
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

// Routes

// Health check
app.get('/health', (req: ExpressRequest, res: ExpressResponse) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', async (req: ExpressRequest, res: ExpressResponse) => {
  const { email, phone, password } = req.body;

  // Check if user already exists
  const existingUser = await userRepository.findByEmailOrPhone(email, phone);
  if (existingUser) {
    return res.status(400).json({ 
      success: false, 
      error: 'User already exists with this email or phone' 
    });
  }

  // Create new user
  const newUser = await userRepository.createUser({
    email,
    phone,
    password, // In production, hash this!
    role: 'member',
    name: 'New User' // Placeholder, will be updated later
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
});

app.post('/api/auth/login', async (req: ExpressRequest, res: ExpressResponse) => {
  const { email, phone, password } = req.body;

  console.log('Login attempt:', { email, phone, password });

  // Find user by email or phone
  const user = await userRepository.findByEmailOrPhone(email, phone);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
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
});

app.get('/api/auth/profile', authMiddleware, (req: ExpressRequest, res: ExpressResponse) => {
  res.json({
    success: true,
    data: {
              id: req.user.userId,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      isVerified: req.user.isVerified
    }
  });
});

app.post('/api/auth/logout', authMiddleware, (req: ExpressRequest, res: ExpressResponse) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get user profile
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

// Refresh token
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
        refreshToken: newToken, // For now, using same token
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phone,
          role: user.role,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          lastLogin: user.updated_at
        },
        expiresIn: 86400 // 24 hours
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

// Verify OTP (placeholder for now)
app.post('/api/auth/verify-otp', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { email, phoneNumber, otp } = req.body;
    
    // For now, just verify the user exists and generate a token
    // In production, you'd verify the OTP
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

// Update user role (admin only)
app.patch('/api/auth/users/:id/role', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Only admins can update user roles' 
    });
  }

  const userId = req.params.id;
  const { role } = req.body;
  
  const user = await userRepository.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Update user role
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
});

// Report routes
app.post('/api/reports', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  // Convert camelCase to snake_case for database
  const reportData = {
    identifier_type: req.body.identifierType?.substring(0, 100) || 'website', // Limit to 100 chars
    identifier_value: req.body.identifierValue,
    category: req.body.scamCategory?.substring(0, 100) || 'other', // Limit to 100 chars
    narrative: req.body.narrative,
    amount_lost: req.body.amountLost || 0,
    currency: req.body.currency || 'INR',
    incident_date: req.body.incidentDate ? new Date(req.body.incidentDate) : null,
    incident_channel: req.body.incidentChannel?.substring(0, 100) || 'other', // Limit to 100 chars
    reporter_user_id: req.user.userId, // Use userId from token, not id
    reporter_email: req.user.email || 'unknown@example.com',
    status: 'pending' // Use valid status from database constraint
  };

  try {
    console.log('User info:', { id: req.user.userId, email: req.user.email });
    console.log('Creating report with data:', JSON.stringify(reportData, null, 2));
    const createdReport = await reportRepository.createReport(reportData);
    
    res.json({
      success: true,
      data: createdReport
    });
  } catch (error) {
    console.error('Error creating report:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create report',
      details: error.message
    });
  }
});

// Enhanced search with filters
app.get('/api/search', async (req: ExpressRequest, res: ExpressResponse) => {
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
      r.identifierValue?.toLowerCase().includes(query.toLowerCase()) ||
      r.category?.toLowerCase().includes(query.toLowerCase()) ||
      r.narrative?.toLowerCase().includes(query.toLowerCase()) ||
      r.reporterEmail?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Apply filters
  if (type && type !== 'all') {
    filteredReports = filteredReports.filter(r => r.identifierType === type);
  }
  
  if (category && category !== 'all') {
    filteredReports = filteredReports.filter(r => r.category === category);
  }
  
  if (status && status !== 'all') {
    filteredReports = filteredReports.filter(r => r.status === status);
  }

  // Apply risk score filters
  if (riskScoreMin !== undefined) {
    filteredReports = filteredReports.filter(r => (r.riskScore || 0) >= riskScoreMin);
  }
  
  if (riskScoreMax !== undefined) {
    filteredReports = filteredReports.filter(r => (r.riskScore || 0) <= riskScoreMax);
  }

  // Apply date filters
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filteredReports = filteredReports.filter(r => new Date(r.createdAt) >= fromDate);
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    filteredReports = filteredReports.filter(r => new Date(r.createdAt) <= toDate);
  }

  // Apply sorting
  filteredReports.sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'risk_score':
        aValue = a.riskScore || 0;
        bValue = b.riskScore || 0;
        break;
      case 'title':
        aValue = a.identifierValue || '';
        bValue = b.identifierValue || '';
        break;
      default: // relevance
        aValue = a.riskScore || 0;
        bValue = b.riskScore || 0;
    }
    
    if (sortOrder === 'ASC') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
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
    
    // Add category suggestions
    allReports.forEach(report => {
      if (report.category?.toLowerCase().includes(query.toLowerCase()) && !seen.has(report.category)) {
        suggestions!.push(report.category);
        seen.add(report.category);
      }
    });
    
    // Add identifier suggestions
    allReports.forEach(report => {
      if (report.identifier_value?.toLowerCase().includes(query.toLowerCase()) && !seen.has(report.identifier_value)) {
        suggestions!.push(report.identifier_value);
        seen.add(report.identifier_value);
      }
    });
    
    suggestions = suggestions!.slice(0, 5); // Limit to 5 suggestions
  }

  const startTime = Date.now();
  const executionTime = Date.now() - startTime;

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
});

// Search autocomplete endpoint (matches frontend expectation)
app.get('/api/search/autocomplete', async (req: ExpressRequest, res: ExpressResponse) => {
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

  // Get identifier suggestions
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

  // Get category suggestions
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

  // Sort by count and limit results
  suggestions.sort((a, b) => b.count - a.count);
  const limitedSuggestions = suggestions.slice(0, limit);

  res.json({
    success: true,
    data: { suggestions: limitedSuggestions }
  });
});

// Trending searches endpoint
app.get('/api/search/trending', async (req: ExpressRequest, res: ExpressResponse) => {
  const timeframe = req.query.timeframe as string || 'day';
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  // Simple trending data based on categories
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
});

// Find similar items
app.get('/api/search/similar', async (req: ExpressRequest, res: ExpressResponse) => {
  const itemId = req.query.itemId as string;
  const type = req.query.type as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  if (!itemId || !type) {
    return res.status(400).json({
      success: false,
      error: 'itemId and type are required'
    });
  }

  // For now, return similar reports based on category
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
});

// Search analytics
app.get('/api/search/analytics', async (req: ExpressRequest, res: ExpressResponse) => {
  const timeframe = req.query.timeframe as string || 'month';
  
  // In a real implementation, you would track search metrics
  // For now, return mock data based on reports
  const totalReports = await reportRepository.countReports();
  const totalSearches = totalReports * 3; // Mock: assume 3 searches per report
  const uniqueUsers = new Set(await reportRepository.findAllReports()).size; // This will be inaccurate with in-memory

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
    averageExecutionTime: 45, // milliseconds
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
});

// User reports endpoint (for individual users to see their own reports)
app.get('/api/reports', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let userReports = await reportRepository.findReportsByReporterId(req.user.userId);

    // Apply status filter
    if (status && status !== 'all') {
      userReports = userReports.filter(r => r.status === status);
    }

    // Apply category filter
    if (category && category !== 'all') {
      userReports = userReports.filter(r => r.category === category);
    }

    // Apply search filter
    if (search) {
      userReports = userReports.filter(r => 
        r.identifier_value?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase()) ||
        r.narrative?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by creation date (newest first)
    userReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const paginatedReports = userReports.slice(offset, offset + limit);

    // Transform data to match frontend expectations
    const transformedReports = paginatedReports.map(report => ({
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
    }));

    res.json({
      success: true,
      data: {
        data: transformedReports,
        total: userReports.length,
        page,
        limit,
        totalPages: Math.ceil(userReports.length / limit)
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

// Get single report by ID
app.get('/api/reports/:id', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const report = await reportRepository.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    // Check if user owns the report or is admin
    if (report.reporter_user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    // Transform database fields to frontend format
    const transformedReport = {
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
    };

    res.json({
      success: true,
      data: transformedReport
    });
  } catch (error) {
    console.error('Error fetching report by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

// Dashboard reports endpoint - shows all reports for admins/moderators, user-specific for regular users
app.get('/api/dashboard/reports', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const status = req.query.status as string;
  const category = req.query.category as string;
  const search = req.query.search as string;
  const offset = (page - 1) * limit;

  try {
    let filteredReports: any[] = [];
    let total = 0;

    // If user is not admin/moderator, only show their own reports
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      const userReports = await reportRepository.findReportsByReporterId(req.user.userId);
      filteredReports = userReports;
      total = userReports.length;
    } else {
      // For admins/moderators, show all reports with filters
      const filters: any = {};
      if (status && status !== 'all') filters.status = status;
      if (category && category !== 'all') filters.category = category;
      
      if (search) {
        // Use search functionality
        const searchResult = await reportRepository.searchReports(search, filters, page, limit);
        filteredReports = searchResult.data;
        total = searchResult.total;
      } else {
        // Use regular filtering
        const allReports = await reportRepository.findAllReports();
        filteredReports = allReports;
        total = allReports.length;
      }
    }

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    // Transform data to match frontend expectations
    const transformedReports = paginatedReports.map(report => ({
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
    }));

    res.json({
      success: true,
      data: {
        data: transformedReports,
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

// Get reports statistics
app.get('/api/reports/stats', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
    try {
    const userReports = await reportRepository.findReportsByReporterId(req.user.userId);

    // Calculate total amount lost
    const totalAmountLost = userReports.reduce((sum, r) => sum + (r.amount_lost || 0), 0);
    
    // Calculate average amount per report
    const averageAmount = userReports.length > 0 ? totalAmountLost / userReports.length : 0;
    
    // Get recent activity (last 5 reports)
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

    // Get category breakdown
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
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report stats'
    });
  }
});



// Update report status
app.patch('/api/reports/:id/status', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  
  const report = await reportRepository.findById(id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }

  // Check if user owns the report or is admin/moderator
      if (report.reporter_user_id !== req.user.userId && req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  const updateData: any = {
    status: status,
    updated_at: new Date().toISOString()
  };
  
  if (reason) {
    updateData.status_reason = reason;
  }

  const updatedReport = await reportRepository.updateReport(id, updateData);

  if (!updatedReport) {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update report' 
    });
  }

  // Transform database fields to frontend format
  const transformedReport = {
    id: updatedReport.id,
    identifierType: updatedReport.identifier_type,
    identifierValue: updatedReport.identifier_value,
    category: updatedReport.category,
    narrative: updatedReport.narrative,
    amountLost: updatedReport.amount_lost || 0,
    currency: updatedReport.currency || 'NPR',
    status: updatedReport.status,
    riskScore: updatedReport.risk_score || 0,
    reporterUserId: updatedReport.reporter_user_id,
    reporterEmail: updatedReport.reporter_email,
    incidentDate: updatedReport.incident_date,
    incidentChannel: updatedReport.incident_channel,
    createdAt: updatedReport.created_at,
    updatedAt: updatedReport.updated_at
  };

  res.json({
    success: true,
    data: transformedReport
  });
});

// Delete report
app.delete('/api/reports/:id', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  const { id } = req.params;
  
  const report = await reportRepository.findById(id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }

  // Check if user owns the report or is admin
      if (report.reporter_user_id !== req.user.userId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  await reportRepository.deleteReport(report.id);

  res.json({
    success: true,
    message: 'Report deleted successfully'
  });
});

// File upload endpoints
app.post('/api/reports/:id/evidence', authMiddleware, upload.array('evidence', 10), async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const reportId = req.params.id
    const files = req.files as any[]
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No files uploaded' }
      })
    }

    // Validate file sizes (double-check with our 15MB limit)
    const maxSize = 15 * 1024 * 1024; // 15MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      return res.status(400).json({
        success: false,
        error: { 
          message: `Files exceed 15MB limit: ${oversizedFiles.map(f => f.originalname).join(', ')}` 
        }
      })
    }

    // In a real implementation, you would save file metadata to database
    const uploadedFiles = files.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate a unique ID
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageUrl: `/uploads/evidence/${file.filename}`,
      uploadedAt: new Date().toISOString()
    }))

    await reportRepository.addFilesToReport(reportId, uploadedFiles);

    res.json({
      success: true,
      data: {
        message: `${files.length} file(s) uploaded successfully`,
        files: uploadedFiles
      }
    })
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to upload files' }
    })
  }
})

// Get evidence files for a report
app.get('/api/reports/:id/evidence', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const reportId = req.params.id
    
    // In a real implementation, you would fetch from database
    const files = await reportRepository.getFilesForReport(reportId);
    res.json({
      success: true,
      data: files
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch evidence' }
    })
  }
})

// Removed duplicate search endpoints - using the main search endpoint instead

// Get saved searches
app.get('/api/search/saved', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  // In a real implementation, you would fetch from database
      const savedSearches = await userRepository.findSavedSearchesByUserId(req.user.userId);

  res.json({
    success: true,
    data: savedSearches
  });
});

// Save search
app.post('/api/search/save', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  const { query, filters, name } = req.body;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query is required'
    });
  }

  // In a real implementation, you would save to database
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
});

// Moderation routes (admin only)
app.get('/api/moderation/queue', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  const pendingReports = await reportRepository.findReportsByStatus('pending');

  res.json({
    success: true,
    data: {
      tasks: pendingReports.map(report => ({
        id: report.id,
        type: 'report',
        itemId: report.id,
        priority: report.risk_score > 80 ? 'high' : report.risk_score > 60 ? 'medium' : 'low',
        status: 'pending',
        title: `${report.category} scam - ${report.identifier_value}`,
        riskScore: report.risk_score,
        createdAt: report.created_at,
        updatedAt: report.updated_at
      })),
      total: pendingReports.length
    }
  });
});

// Get individual moderation task
app.get('/api/moderation/queue/:id', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

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
});

// Assign task to moderator
app.post('/api/moderation/queue/:id/assign', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  const taskId = req.params.id;
  const { moderatorId } = req.body;
  
  const report = await reportRepository.findById(taskId);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  // In a real implementation, you would update the task assignment in database
  // For now, we'll just return success
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
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };

  // Update the report status to under_review
  await reportRepository.updateReport(taskId, { status: 'under_review' });

  res.json({
    success: true,
    data: task
  });
});

// Unassign task
app.post('/api/moderation/queue/:id/unassign', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

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

  // Update the report status back to pending
  await reportRepository.updateReport(taskId, { status: 'pending' });

  res.json({
    success: true,
    data: task
  });
});

// Update task status
app.patch('/api/moderation/queue/:id/status', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  const taskId = req.params.id;
  const { status, reason } = req.body;
  
  const report = await reportRepository.findById(taskId);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  // Update report status based on moderation decision
  if (status === 'completed') {
    // In a real implementation, you would update the report status
    // For now, we'll just return success
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

  // Update the report status based on moderation decision
  if (status === 'completed') {
    await reportRepository.updateReport(taskId, { status: 'verified' });
  } else if (status === 'rejected') {
    await reportRepository.updateReport(taskId, { status: 'rejected' });
  }

  res.json({
    success: true,
    data: task
  });
});

// Update task priority
app.patch('/api/moderation/queue/:id/priority', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

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

  // Update the report priority (in a real implementation, this would update a moderation task)
  // For now, we'll just return success

  res.json({
    success: true,
    data: task
  });
});

// Make decision on task
app.post('/api/moderation/queue/:id/decide', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  const taskId = req.params.id;
  const { decision, reason, notes, actionData } = req.body;
  
  const report = await reportRepository.findById(taskId);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  // Update report status based on decision
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

  // In a real implementation, you would update the report status and create decision record
  // For now, we'll just return success

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

  // Update the report status based on decision
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
});

// Get assigned tasks for a moderator
app.get('/api/moderation/assigned', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  const moderatorId = req.query.moderatorId || req.user.userId;
  
  // In a real implementation, you would fetch assigned tasks from database
  // For now, return empty array
  const assignedTasks = await userRepository.findAssignedTasksByModeratorId(moderatorId);

  res.json({
    success: true,
    data: assignedTasks
  });
});

// Get overdue tasks
app.get('/api/moderation/overdue', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  // In a real implementation, you would fetch overdue tasks from database
  // For now, return empty array
  const overdueTasks = await userRepository.findOverdueTasksByModeratorId(req.user.userId);

  res.json({
    success: true,
    data: overdueTasks
  });
});

// Get moderation analytics
app.get('/api/moderation/analytics', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  const timeframe = req.query.timeframe || 'month';
  
  // Calculate basic analytics from reports
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
    averageDecisionTime: 24, // hours (mock data)
    escalationRate: 0.1, // 10% (mock data)
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
});

// Get moderator performance stats
app.get('/api/moderation/moderator-stats', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  const moderatorId = req.query.moderatorId || req.user.userId;
  const timeframe = req.query.timeframe || 'month';
  
  // In a real implementation, you would calculate real stats
  // For now, return mock data
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
});

// Get decision history for a task
app.get('/api/moderation/queue/:id/history', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  const taskId = req.params.id;
  const report = await reportRepository.findById(taskId);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  // In a real implementation, you would fetch decision history from database
  // For now, return mock data
  const history = await userRepository.findDecisionHistoryByTaskId(taskId);

  res.json({
    success: true,
    data: history
  });
});

// Bulk update tasks
app.post('/api/moderation/bulk-update', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  const { taskIds, action, data } = req.body;
  
  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Task IDs are required'
    });
  }

  // In a real implementation, you would perform bulk updates
  // For now, return success
  const updatedTasks = await userRepository.bulkUpdateTasks(taskIds, action, data);

  res.json({
    success: true,
    data: {
      message: `Updated ${taskIds.length} tasks`,
      updatedTasks
    }
  });
});

app.get('/api/moderation/stats', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied' 
    });
  }

  const stats = {
    pending: await reportRepository.countReportsByStatus('pending'),
    approved: await reportRepository.countReportsByStatus('verified'),
    rejected: await reportRepository.countReportsByStatus('rejected'),
    total: await reportRepository.countReports()
  };

  res.json({
    success: true,
    data: stats
  });
});

// Enhanced dashboard stats
app.get('/api/dashboard/stats', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
      const userReports = await reportRepository.findReportsByReporterId(req.user.userId);
  
  // Calculate total amount lost
  const totalAmountLost = userReports.reduce((sum, r) => sum + (r.amount_lost || 0), 0);
  
  // Calculate average amount per report
  const averageAmount = userReports.length > 0 ? totalAmountLost / userReports.length : 0;
  
  // Get recent activity (last 5 reports)
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

  // Get category breakdown
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
});



// Entity management endpoints
app.get('/api/entities', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const status = req.query.status as string;
  const search = req.query.search as string;
  const offset = (page - 1) * limit;

  try {
    // Get all reports from database
    const reports = await reportRepository.findAllReports();
    
    // Create entities based on reports (in a real app, these would be separate)
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

    // Apply status filter
    if (status && status !== 'all') {
      filteredEntities = filteredEntities.filter(e => e.status === status);
    }

    // Apply search filter
    if (search) {
      filteredEntities = filteredEntities.filter(e => 
        e.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        e.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Sort by risk score (highest first)
    filteredEntities.sort((a, b) => b.riskScore - a.riskScore);

    // Apply pagination
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

app.get('/api/entities/stats', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
  // Create mock entities for stats
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
});

// Error handling middleware
app.use((err: any, req: ExpressRequest, res: ExpressResponse, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Error handling middleware for multer and other errors
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

// 404 handler
app.use('*', (req: ExpressRequest, res: ExpressResponse) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:3000`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

