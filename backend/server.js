const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { protect } = require('./middleware/authMiddleware');
const { canViewReports, hasRole } = require('./middleware/roleMiddleware');
const LoginHistory = require('./models/LoginHistory');

// Import route files
const authRoutes = require('./routes/authRoutes');
const financeRoutes = require('./routes/financeRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const userRoutes = require('./routes/userRoutes');
const advertiserRoutes = require('./routes/advertiserRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

dotenv.config();

// Ensure JWT secret is set for token signing/verification.
// If not provided in the environment (development setups), use a dev default
// and log a warning so production deployments must set a real secret.
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Using insecure default for development.');
  process.env.JWT_SECRET = 'dev_jwt_secret_change_me';
}

const app = express();

// ============ UPDATED CORS CONFIGURATION ============
// Allow your frontend to connect from GitHub Pages
app.use(cors({
  origin: [
    'http://localhost:3000',           // Local development
    'https://maloke03.github.io',      // Your GitHub Pages frontend
    'https://lekope-fis.onrender.com'  // Your backend itself
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ============ ROOT ROUTE ============
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Lekope FM API is running',
    endpoints: {
      health: '/api/health',
      invoices: '/api/invoices',
      expenses: '/api/expenses',
      revenue: '/api/revenue',
      payroll: '/api/payroll',
      assets: '/api/assets',
      tax: '/api/tax',
      advertisers: '/api/advertisers',
      bookings: '/api/bookings',
      login: '/api/login',
      register: '/api/register'
    }
  });
});

// MongoDB Connection
// Note: useNewUrlParser and useUnifiedTopology are deprecated in Mongoose 8.x
mongoose.set('strictQuery', false);

const LOCAL_MONGODB_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/lekope-fis';
const MONGODB_CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
  socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS) || 45000,
};

const isLocalMongoUri = (uri) => /^mongodb:\/\/(localhost|127\.0\.0\.1)(:|\/)/i.test(uri || '');

const maskMongoUri = (uri = '') => uri.replace(/\/\/([^:/@]+):([^@]+)@/, '//***:***@');

const recordAuditEntry = async (req, { status = 'INFO', actionType = 'SYSTEM', targetType = 'GENERAL', details = '', reason = '' }) => {
  try {
    await LoginHistory.create({
      user: req.user?._id,
      name: req.user?.name,
      email: req.user?.email,
      role: req.user?.role,
      status,
      actionType,
      targetType,
      details,
      reason,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    console.error('Failed to record audit entry:', error);
  }
};

const getConnectionState = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};

const isMongoConnectionError = (error) => {
  return (
    ['MongoNetworkError', 'MongoServerSelectionError', 'MongooseServerSelectionError'].includes(error?.name) ||
    /buffering timed out|server selection timed out|ECONNREFUSED|ENOTFOUND|querySrv/i.test(error?.message || '')
  );
};

const VALID_USER_ROLES = ['STATION_MANAGER', 'FINANCE_OFFICER', 'MARKETING_OFFICER', 'STAFF', 'AUDITOR'];
const normalizeRole = (role = '') => role.toString().trim().toUpperCase().replace(/\s+/g, '_');
const recordLoginHistory = async (req, { user, email, status, reason }) => {
  try {
    await LoginHistory.create({
      user: user?._id,
      name: user?.name,
      email: user?.email || email,
      role: user?.role,
      status,
      reason,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    console.error('Failed to record login history:', error);
  }
};

// ============ USER SCHEMA ============
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: VALID_USER_ROLES, set: normalizeRole, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
});

userSchema.pre('validate', function(next) {
  if (this.role) this.role = normalizeRole(this.role);
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ============ INVOICE SCHEMA ============
const invoiceSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  client: { type: String, required: true },
  clientEmail: String,
  clientPhone: String,
  issue: { type: String, required: true },
  due: { type: String, required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['DRAFT', 'SENT', 'PENDING', 'PAID', 'OVERDUE', 'WRITTEN_OFF', 'PARTIAL'],
    default: 'DRAFT'
  },
  items: [{
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  payments: [{
    amount: Number,
    method: String,
    reference: String,
    date: Date,
    notes: String
  }],
  writeOffReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

const toMoney = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const calculateInvoiceItems = (items = [], fallbackAmount = 0) => {
  if (!Array.isArray(items) || items.length === 0) {
    const amount = toMoney(fallbackAmount);
    return {
      items: [{ description: 'Radio Advertising Service', quantity: 1, rate: amount, amount }],
      amount,
    };
  }

  const normalizedItems = items.map((item) => {
    const quantity = toMoney(item.quantity) || 1;
    const rate = toMoney(item.rate);
    const amount = toMoney(item.amount) || quantity * rate;

    return {
      description: item.description || 'Radio Advertising Service',
      quantity,
      rate,
      amount,
    };
  });

  return {
    items: normalizedItems,
    amount: normalizedItems.reduce((sum, item) => sum + item.amount, 0),
  };
};

const normalizeInvoicePayload = (payload = {}, existingInvoice = null) => {
  const source = existingInvoice ? { ...existingInvoice.toObject(), ...payload } : payload;
  const calculated = calculateInvoiceItems(source.items, source.amount);
  const payments = Array.isArray(source.payments) ? source.payments : [];
  const paidAmount = payments.length
    ? payments.reduce((sum, payment) => sum + toMoney(payment.amount), 0)
    : toMoney(source.paidAmount);

  const normalized = {
    ...payload,
    items: calculated.items,
    amount: calculated.amount,
    paidAmount: Math.min(paidAmount, calculated.amount),
    updatedAt: new Date(),
  };

  if (source.status === 'PAID') {
    normalized.paidAmount = calculated.amount;
  } else if (!['WRITTEN_OFF', 'OVERDUE'].includes(source.status)) {
    if (normalized.paidAmount >= calculated.amount && calculated.amount > 0) normalized.status = 'PAID';
    else if (normalized.paidAmount > 0) normalized.status = 'PARTIAL';
  }

  return normalized;
};

const syncAdvertiserTotals = async (clientName, contact = {}) => {
  if (!clientName || !mongoose.models.Advertiser) return;

  const [billing, campaigns] = await Promise.all([
    Invoice.aggregate([
      { $match: { client: clientName, status: { $ne: 'WRITTEN_OFF' } } },
      { $group: { _id: '$client', billed: { $sum: '$amount' } } },
    ]),
    mongoose.models.Booking
      ? mongoose.models.Booking.countDocuments({ client: clientName, status: { $ne: 'Cancelled' } })
      : Promise.resolve(0),
  ]);

  await mongoose.models.Advertiser.findOneAndUpdate(
    { name: clientName },
    {
      $set: {
        billed: billing[0]?.billed || 0,
        campaigns,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        id: `ADV-${Date.now()}`,
        name: clientName,
        industry: 'Unspecified',
        status: 'Active',
        contactEmail: contact.clientEmail || '',
        contactPhone: contact.clientPhone || '',
      },
    },
    { upsert: true, new: true }
  );
};

// Use route files
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/advertisers', advertiserRoutes);
app.use('/api/bookings', bookingRoutes);

// ============ AUTH ROUTES ============
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const normalizedRole = normalizeRole(role);
    if (!VALID_USER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_USER_ROLES.join(', ')}` });
    }

    const user = new User({ name, email, password, role: normalizedRole });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      await recordLoginHistory(req, { email, status: 'FAILED', reason: 'User not found' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.isActive) {
      await recordLoginHistory(req, { user, email, status: 'FAILED', reason: 'Account is deactivated' });
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await recordLoginHistory(req, { user, email, status: 'FAILED', reason: 'Invalid password' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    user.lastLogin = new Date();
    user.role = normalizeRole(user.role);
    await user.save();
    await recordLoginHistory(req, { user, email, status: 'SUCCESS' });
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id, '-password');
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============ USER ROUTES ============
app.get('/api/users', protect, hasRole('STATION_MANAGER'), async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', protect, hasRole('STATION_MANAGER'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', protect, hasRole('STATION_MANAGER'), async (req, res) => {
  try {
    const { name, role, isActive } = req.body;
    const normalizedRole = role ? normalizeRole(role) : undefined;

    if (normalizedRole && !VALID_USER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_USER_ROLES.join(', ')}` });
    }

    const updates = { name, isActive };
    if (normalizedRole) updates.role = normalizedRole;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, select: '-password' }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', protect, hasRole('STATION_MANAGER'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/login-history', protect, hasRole('STATION_MANAGER', 'AUDITOR'), async (req, res) => {
  try {
    const history = await LoginHistory.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(history);
  } catch (error) {
    console.error('Login history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
});


// ============ REVENUE SCHEMA ============
const revenueSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  client: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Advertising', 'Sponsorship', 'Event Sponsorship', 'Digital', 'Other'],
    required: true 
  },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'COMPLETED', 'OVERDUE'],
    default: 'PENDING'
  },
  description: String,
  invoiceId: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Revenue = mongoose.models.Revenue || mongoose.model('Revenue', revenueSchema);

// ============ REVENUE API ROUTES ============

// Get all revenue transactions
app.get('/api/revenue', async (req, res) => {
  try {
    const revenues = await Revenue.find().sort({ date: -1, createdAt: -1 });
    res.json(revenues);
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ error: 'Failed to fetch revenue transactions' });
  }
});

// Get revenue summary (KPIs)
app.get('/api/revenue/summary', async (req, res) => {
  try {
    const revenues = await Revenue.find();
    const currentYear = new Date().getFullYear();
    
    // Calculate YTD revenue (current year)
    const ytdRevenue = revenues
      .filter(r => new Date(r.date).getFullYear() === currentYear && r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);
    
    // Calculate total revenue (all time)
    const totalRevenue = revenues
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);
    
    // Calculate active contracts (unique clients with pending/completed in last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const activeClients = new Set(
      revenues
        .filter(r => new Date(r.date) > threeMonthsAgo)
        .map(r => r.client)
    );
    
    // Calculate growth (compare last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const recentRevenue = revenues
      .filter(r => new Date(r.date) >= thirtyDaysAgo && r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const previousRevenue = revenues
      .filter(r => new Date(r.date) >= sixtyDaysAgo && new Date(r.date) < thirtyDaysAgo && r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const avgGrowth = previousRevenue > 0 
      ? ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;
    
    res.json({
      totalYTD: ytdRevenue,
      totalRevenue: totalRevenue,
      avgGrowth: avgGrowth,
      activeContracts: activeClients.size
    });
  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    res.status(500).json({ error: 'Failed to fetch revenue summary' });
  }
});

// Get revenue streams (grouped by type)
app.get('/api/revenue/streams', async (req, res) => {
  try {
    const revenues = await Revenue.find();
    const currentYear = new Date().getFullYear();
    
    const streams = {};
    revenues.forEach(r => {
      if (r.status === 'COMPLETED' && new Date(r.date).getFullYear() === currentYear) {
        if (!streams[r.type]) {
          streams[r.type] = { amount: 0, txns: 0 };
        }
        streams[r.type].amount += r.amount;
        streams[r.type].txns++;
      }
    });
    
    // Calculate growth for each stream (compare this year vs last year)
    const lastYear = currentYear - 1;
    const lastYearRevenues = revenues.filter(r => new Date(r.date).getFullYear() === lastYear && r.status === 'COMPLETED');
    const thisYearRevenues = revenues.filter(r => new Date(r.date).getFullYear() === currentYear && r.status === 'COMPLETED');
    
    const result = Object.entries(streams).map(([name, data]) => {
      const lastYearAmount = lastYearRevenues
        .filter(r => r.type === name)
        .reduce((sum, r) => sum + r.amount, 0);
      
      const growth = lastYearAmount > 0 
        ? ((data.amount - lastYearAmount) / lastYearAmount * 100).toFixed(1)
        : 0;
      
      return {
        name,
        amount: data.amount,
        txns: data.txns,
        growth: parseFloat(growth)
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching revenue streams:', error);
    res.status(500).json({ error: 'Failed to fetch revenue streams' });
  }
});

// Get monthly revenue by source
app.get('/api/revenue/monthly', async (req, res) => {
  try {
    const revenues = await Revenue.find({ status: 'COMPLETED' });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = {
      labels: months,
      advertising: new Array(12).fill(0),
      sponsorships: new Array(12).fill(0),
      events: new Array(12).fill(0),
      digital: new Array(12).fill(0)
    };
    
    revenues.forEach(r => {
      const date = new Date(r.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        let category = 'other';
        
        if (r.type === 'Advertising') category = 'advertising';
        else if (r.type === 'Sponsorship') category = 'sponsorships';
        else if (r.type === 'Event Sponsorship') category = 'events';
        else if (r.type === 'Digital') category = 'digital';
        
        if (monthlyData[category]) {
          monthlyData[category][month] += r.amount;
        }
      }
    });
    
    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({ error: 'Failed to fetch monthly revenue' });
  }
});

// Create new revenue transaction
app.post('/api/revenue', async (req, res) => {
  try {
    const { id } = req.body;
    
    // Check if revenue with same ID already exists
    const existingRevenue = await Revenue.findOne({ id });
    if (existingRevenue) {
      return res.status(400).json({ error: 'Revenue transaction with this ID already exists' });
    }
    
    const revenue = new Revenue(req.body);
    await revenue.save();
    res.status(201).json(revenue);
  } catch (error) {
    console.error('Error creating revenue:', error);
    res.status(500).json({ error: 'Failed to create revenue transaction' });
  }
});

// Update revenue transaction
app.put('/api/revenue/:id', async (req, res) => {
  try {
    const revenue = await Revenue.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!revenue) {
      return res.status(404).json({ error: 'Revenue transaction not found' });
    }
    res.json(revenue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update revenue transaction' });
  }
});

// Delete revenue transaction
app.delete('/api/revenue/:id', async (req, res) => {
  try {
    const revenue = await Revenue.findOneAndDelete({ id: req.params.id });
    if (!revenue) {
      return res.status(404).json({ error: 'Revenue transaction not found' });
    }
    res.json({ message: 'Revenue transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete revenue transaction' });
  }
});


// ============ EXPENSE SCHEMA ============
const expenseSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Salaries', 'Licensing', 'Equipment', 'Utilities', 'Marketing', 'Operations', 'Other'],
    required: true 
  },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'PAID', 'REJECTED'],
    default: 'PENDING'
  },
  vendor: String,
  receipt: String,
  notes: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

// ============ EXPENSE API ROUTES ============

// Get all expenses
app.get('/api/expenses', protect, async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense summary (KPIs)
app.get('/api/expenses/summary', protect, async (req, res) => {
  try {
    const expenses = await Expense.find();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Get current year expenses
    const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === currentYear);
    
    // Calculate total expenses (YTD)
    const total = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Budget (you can make this configurable or store in a settings collection)
    const budget = 2500000; // LSL 2.5M annual budget
    
    // Calculate pending approvals
    const pendingApproval = expenses.filter(e => e.status === 'PENDING').length;
    
    // Calculate monthly budget and actual
    const monthlyBudget = budget / 12;
    const thisMonthExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    }).reduce((sum, e) => sum + e.amount, 0);
    
    const budgetUsed = (total / budget) * 100;
    
    res.json({
      total: total,
      budget: budget,
      budgetUsed: budgetUsed.toFixed(1),
      pendingApproval: pendingApproval,
      monthlyBudget: monthlyBudget,
      thisMonthExpenses: thisMonthExpenses
    });
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
});

// Get expense categories with actual vs budget
app.get('/api/expenses/categories', async (req, res) => {
  try {
    const expenses = await Expense.find();
    const currentYear = new Date().getFullYear();
    
    // Category budgets (you can make these configurable)
    const categoryBudgets = {
      'Salaries': 1200000,
      'Licensing': 300000,
      'Equipment': 250000,
      'Utilities': 180000,
      'Marketing': 200000,
      'Operations': 350000,
      'Other': 20000
    };
    
    // Calculate actual expenses by category
    const categoryActuals = {};
    expenses.forEach(e => {
      if (new Date(e.date).getFullYear() === currentYear) {
        if (!categoryActuals[e.category]) categoryActuals[e.category] = 0;
        categoryActuals[e.category] += e.amount;
      }
    });
    
    const result = Object.keys(categoryBudgets).map(category => ({
      name: category,
      actual: categoryActuals[category] || 0,
      budget: categoryBudgets[category],
      used: ((categoryActuals[category] || 0) / categoryBudgets[category]) * 100
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  }
});

// Get monthly expense trend
app.get('/api/expenses/monthly', async (req, res) => {
  try {
    const expenses = await Expense.find();
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyData = {
      labels: months,
      salaries: new Array(12).fill(0),
      operations: new Array(12).fill(0),
      marketing: new Array(12).fill(0),
      other: new Array(12).fill(0)
    };
    
    expenses.forEach(e => {
      const date = new Date(e.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        
        if (e.category === 'Salaries') monthlyData.salaries[month] += e.amount;
        else if (e.category === 'Operations') monthlyData.operations[month] += e.amount;
        else if (e.category === 'Marketing') monthlyData.marketing[month] += e.amount;
        else monthlyData.other[month] += e.amount;
      }
    });
    
    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ error: 'Failed to fetch monthly expenses' });
  }
});

// Analytics overview
app.get('/api/analytics/overview', protect, canViewReports, async (req, res) => {
  try {
    const [revenues, expenses, invoices, assets] = await Promise.all([
      Revenue.find(),
      Expense.find(),
      Invoice.find(),
      Asset.find()
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const last8Months = [];
    for (let i = 7; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last8Months.push(d.toLocaleString('default', { month: 'short' }));
    }

    const monthKey = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${d.getMonth()}`;
    };

    const revenueByMonth = {};
    const expenseByMonth = {};

    revenues.forEach((r) => {
      if (r.status !== 'COMPLETED') return;
      const key = monthKey(r.date);
      revenueByMonth[key] = (revenueByMonth[key] || 0) + r.amount;
    });

    expenses.forEach((e) => {
      const key = monthKey(e.date);
      expenseByMonth[key] = (expenseByMonth[key] || 0) + e.amount;
    });

    const profitRevenue = last8Months.map((_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - index), 1);
      return revenueByMonth[monthKey(d)] || 0;
    });
    const profitExpenses = last8Months.map((_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - index), 1);
      return expenseByMonth[monthKey(d)] || 0;
    });
    const profitNet = profitRevenue.map((value, index) => value - profitExpenses[index]);

    const clientTotals = {};
    revenues.filter((r) => r.status === 'COMPLETED').forEach((r) => {
      if (!r.client) return;
      clientTotals[r.client] = (clientTotals[r.client] || 0) + r.amount;
    });

    const topClients = Object.entries(clientTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const totalRevenue = revenues
      .filter((r) => r.status === 'COMPLETED' && new Date(r.date).getFullYear() === currentYear)
      .reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses
      .filter((e) => new Date(e.date).getFullYear() === currentYear)
      .reduce((sum, e) => sum + e.amount, 0);

    const revenueGrowth = (() => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const sixtyDaysAgo = new Date(today);
      sixtyDaysAgo.setDate(today.getDate() - 60);

      const recent = revenues
        .filter((r) => new Date(r.date) >= thirtyDaysAgo && r.status === 'COMPLETED')
        .reduce((sum, r) => sum + r.amount, 0);
      const previous = revenues
        .filter((r) => new Date(r.date) >= sixtyDaysAgo && new Date(r.date) < thirtyDaysAgo && r.status === 'COMPLETED')
        .reduce((sum, r) => sum + r.amount, 0);

      return previous > 0 ? Number((((recent - previous) / previous) * 100).toFixed(1)) : 0;
    })();

    const profitMargin = totalRevenue > 0 ? Number((((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1)) : 0;
    const operatingEfficiency = totalRevenue > 0 ? Number((((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1)) : 0;
    const uniqueClients = Math.max(1, Object.keys(clientTotals).length);
    const clientAcquisitionCost = Number((totalExpenses / uniqueClients).toFixed(0));

    const getQuarterLabel = (date) => {
      const d = new Date(date);
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      return `Q${quarter} ${d.getFullYear()}`;
    };

    const quarterLabels = [];
    let quarter = Math.floor(now.getMonth() / 3) + 1;
    let quarterYear = now.getFullYear();
    for (let i = 0; i < 5; i += 1) {
      quarterLabels.unshift(`Q${quarter} ${quarterYear}`);
      quarter -= 1;
      if (quarter === 0) {
        quarter = 4;
        quarterYear -= 1;
      }
    }

    const quarterTotals = quarterLabels.reduce((acc, label) => ({
      ...acc,
      [label]: { revenue: 0, expense: 0 }
    }), {});

    revenues.filter((r) => r.status === 'COMPLETED').forEach((r) => {
      const label = getQuarterLabel(r.date);
      if (quarterTotals[label]) {
        quarterTotals[label].revenue += r.amount;
      }
    });

    expenses.forEach((e) => {
      const label = getQuarterLabel(e.date);
      if (quarterTotals[label]) {
        quarterTotals[label].expense += e.amount;
      }
    });

    const quarterlyPerformance = {
      labels: quarterLabels,
      revenue: quarterLabels.map((label) => quarterTotals[label].revenue),
      profit: quarterLabels.map((label) => quarterTotals[label].revenue - quarterTotals[label].expense),
      margins: quarterLabels.map((label) => {
        const revenueValue = quarterTotals[label].revenue;
        const profitValue = revenueValue - quarterTotals[label].expense;
        return revenueValue > 0 ? Number(((profitValue / revenueValue) * 100).toFixed(1)) : 0;
      })
    };

    const categoryBudgets = {
      Salaries: 150000,
      Licensing: 90000,
      Equipment: 85000,
      Utilities: 60000,
      Marketing: 95000,
      Operations: 125000,
      Other: 50000
    };

    const revenueSources = Object.entries(
      revenues.filter((r) => r.status === 'COMPLETED').reduce((acc, r) => {
        const type = r.type || 'Other';
        acc[type] = (acc[type] || 0) + r.amount;
        return acc;
      }, {})
    ).map(([name, amount]) => ({ name, amount }));

    const revenueTotal = revenueSources.reduce((sum, item) => sum + item.amount, 0);
    revenueSources.forEach((item) => {
      item.pct = revenueTotal > 0 ? Number(((item.amount / revenueTotal) * 100).toFixed(1)) : 0;
    });

    const expenseCategories = Object.entries(
      expenses
        .filter((e) => new Date(e.date).getFullYear() === currentYear)
        .reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {})
    ).map(([category, actual]) => ({
      category,
      actual,
      budget: categoryBudgets[category] || 0,
      usage: categoryBudgets[category] ? Number(((actual / categoryBudgets[category]) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.actual - a.actual);

    const invoiceBuckets = [
      { bucket: 'Current', amount: 0, count: 0 },
      { bucket: '1-30 days', amount: 0, count: 0 },
      { bucket: '31-60 days', amount: 0, count: 0 },
      { bucket: '60+ days', amount: 0, count: 0 }
    ];

    invoices
      .filter((inv) => !['PAID', 'WRITTEN_OFF'].includes(inv.status))
      .forEach((inv) => {
        const dueDate = new Date(inv.due);
        const diffDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        const amount = Math.max(0, inv.amount - (inv.paidAmount || 0));

        if (diffDays < 0) {
          invoiceBuckets[0].amount += amount;
          invoiceBuckets[0].count += 1;
        } else if (diffDays <= 30) {
          invoiceBuckets[1].amount += amount;
          invoiceBuckets[1].count += 1;
        } else if (diffDays <= 60) {
          invoiceBuckets[2].amount += amount;
          invoiceBuckets[2].count += 1;
        } else {
          invoiceBuckets[3].amount += amount;
          invoiceBuckets[3].count += 1;
        }
      });

    const paidInvoiceAmount = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const receivablesOutstanding = invoices
      .filter((inv) => !['PAID', 'WRITTEN_OFF'].includes(inv.status))
      .reduce((sum, inv) => sum + Math.max(0, inv.amount - (inv.paidAmount || 0)), 0);

    const currentPayables = expenses
      .filter((e) => ['PENDING', 'APPROVED'].includes(e.status))
      .reduce((sum, e) => sum + e.amount, 0);

    const cashPosition = Math.max(0, paidInvoiceAmount - currentPayables);
    const workingCapital = Math.max(0, paidInvoiceAmount + receivablesOutstanding - currentPayables);
    const avgLatestExpense = profitExpenses.slice(-3).reduce((sum, value) => sum + value, 0) / Math.max(profitExpenses.slice(-3).length, 1);
    const cashRunwayMonths = avgLatestExpense > 0 ? Number((cashPosition / avgLatestExpense).toFixed(1)) : 0;

    const monthlyGrowthRates = [];
    for (let i = 1; i < profitRevenue.length; i += 1) {
      const prev = profitRevenue[i - 1] || 0;
      const current = profitRevenue[i] || 0;
      if (prev > 0) {
        monthlyGrowthRates.push((current - prev) / prev);
      }
    }
    const avgMonthlyGrowth = monthlyGrowthRates.length
      ? monthlyGrowthRates.reduce((sum, rate) => sum + rate, 0) / monthlyGrowthRates.length
      : 0;

    const forecastLabels = [];
    const forecastRevenue = [];
    const forecastExpenses = [];
    const forecastProfit = [];
    const baseRevenue = profitRevenue.slice(-3).reduce((sum, value) => sum + value, 0) / Math.max(profitRevenue.slice(-3).length, 1);
    const baseExpense = avgLatestExpense;

    for (let i = 1; i <= 3; i += 1) {
      const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
      forecastLabels.push(m.toLocaleString('default', { month: 'short' }));
      const projectedRevenue = Math.round(baseRevenue * Math.pow(1 + avgMonthlyGrowth, i));
      const projectedExpense = Math.round(baseExpense * (1 + 0.02 * i));
      forecastRevenue.push(projectedRevenue);
      forecastExpenses.push(projectedExpense);
      forecastProfit.push(projectedRevenue - projectedExpense);
    }

    const forecastSummary = {
      nextQuarterRevenue: forecastRevenue.reduce((sum, value) => sum + value, 0),
      nextQuarterExpenses: forecastExpenses.reduce((sum, value) => sum + value, 0),
      projectedProfit: forecastProfit.reduce((sum, value) => sum + value, 0)
    };

    const extendedForecastLabels = [];
    const monthlyRevenueProjection = [];
    const monthlyExpenseProjection = [];
    for (let i = 1; i <= 6; i += 1) {
      const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
      extendedForecastLabels.push(m.toLocaleString('default', { month: 'short' }));
      monthlyRevenueProjection.push(Math.max(0, Math.round(baseRevenue * Math.pow(1 + avgMonthlyGrowth, i))));
      monthlyExpenseProjection.push(Math.max(0, Math.round(baseExpense * (1 + 0.02 * i))));
    }

    const collectionAssumptions = {
      Current: { monthIndex: 0, rate: 0.9 },
      '1-30 days': { monthIndex: 1, rate: 0.7 },
      '31-60 days': { monthIndex: 2, rate: 0.45 },
      '60+ days': { monthIndex: 3, rate: 0.2 }
    };
    const projectedCollections = new Array(6).fill(0);
    const receivableBuckets = invoiceBuckets.map((bucket) => {
      const rule = collectionAssumptions[bucket.bucket] || { monthIndex: 0, rate: 0.5 };
      const expectedCollection = Math.round(bucket.amount * rule.rate);
      projectedCollections[rule.monthIndex] += expectedCollection;
      return {
        ...bucket,
        expectedCollection,
        riskAmount: Math.max(0, bucket.amount - expectedCollection),
        collectionRate: Number((rule.rate * 100).toFixed(0))
      };
    });

    const payableSettlements = [
      Math.round(currentPayables * 0.5),
      Math.round(currentPayables * 0.3),
      Math.round(currentPayables * 0.2),
      0,
      0,
      0
    ];
    const cashInflows = monthlyRevenueProjection.map((value, index) => value + projectedCollections[index]);
    const cashOutflows = monthlyExpenseProjection.map((value, index) => value + payableSettlements[index]);
    const netCashFlow = cashInflows.map((value, index) => value - cashOutflows[index]);
    const closingCash = [];
    let runningCash = cashPosition;
    let remainingReceivables = receivablesOutstanding;
    let remainingPayables = currentPayables;
    const workingCapitalOutlook = extendedForecastLabels.map((label, index) => {
      runningCash += netCashFlow[index];
      closingCash.push(Math.round(runningCash));
      remainingReceivables = Math.max(0, remainingReceivables - projectedCollections[index]);
      remainingPayables = Math.max(0, remainingPayables - payableSettlements[index]);
      return {
        label,
        cash: Math.round(runningCash),
        receivables: Math.round(remainingReceivables),
        payables: Math.round(remainingPayables),
        workingCapital: Math.round(runningCash + remainingReceivables - remainingPayables)
      };
    });

    const annualBudget = 2500000;
    const monthsElapsed = Math.max(now.getMonth() + 1, 1);
    const monthlySpendRate = Math.round(totalExpenses / monthsElapsed);
    const projectedYearEndSpend = Math.round(monthlySpendRate * 12);
    const budgetRemaining = Math.max(0, annualBudget - totalExpenses);
    const projectedBudgetVariance = Math.round(annualBudget - projectedYearEndSpend);
    const monthsUntilBudgetExhausted = monthlySpendRate > 0 && budgetRemaining > 0
      ? budgetRemaining / monthlySpendRate
      : 0;
    const exhaustionDate = budgetRemaining <= 0
      ? null
      : new Date(now.getFullYear(), now.getMonth() + Math.ceil(monthsUntilBudgetExhausted), 1);

    const revenueMixProjection = revenueSources.map((source) => {
      const share = revenueTotal > 0 ? source.amount / revenueTotal : 0;
      const projectedAmount = Math.round(forecastSummary.nextQuarterRevenue * share);
      return {
        name: source.name,
        currentAmount: source.amount,
        share: Number((share * 100).toFixed(1)),
        projectedQuarterAmount: projectedAmount,
        projectedMonthlyAverage: Math.round(projectedAmount / 3)
      };
    }).sort((a, b) => b.projectedQuarterAmount - a.projectedQuarterAmount);

    const currentYearExpenseTotal = expenseCategories.reduce((sum, category) => sum + category.actual, 0);
    const expenseCategoryProjection = expenseCategories.map((category) => {
      const share = currentYearExpenseTotal > 0 ? category.actual / currentYearExpenseTotal : 0;
      const projectedAmount = Math.round(forecastSummary.nextQuarterExpenses * share);
      return {
        category: category.category,
        currentActual: category.actual,
        budget: category.budget,
        share: Number((share * 100).toFixed(1)),
        projectedQuarterAmount: projectedAmount,
        projectedMonthlyAverage: Math.round(projectedAmount / 3)
      };
    }).sort((a, b) => b.projectedQuarterAmount - a.projectedQuarterAmount);

    const expectedReceivableCollections = receivableBuckets.reduce((sum, bucket) => sum + bucket.expectedCollection, 0);
    const collectionRisk = receivableBuckets.reduce((sum, bucket) => sum + bucket.riskAmount, 0);
    const vatRate = 0.15;
    const financialProjections = {
      cashFlow: {
        labels: extendedForecastLabels,
        openingCash: cashPosition,
        inflows: cashInflows,
        outflows: cashOutflows,
        net: netCashFlow,
        closingCash
      },
      receivables: {
        outstanding: receivablesOutstanding,
        expectedCollections: expectedReceivableCollections,
        collectionRisk,
        buckets: receivableBuckets
      },
      budgetBurn: {
        annualBudget,
        spentToDate: totalExpenses,
        remaining: budgetRemaining,
        monthlySpendRate,
        projectedYearEndSpend,
        projectedVariance: projectedBudgetVariance,
        exhaustionMonth: exhaustionDate
          ? exhaustionDate.toLocaleString('default', { month: 'short', year: 'numeric' })
          : 'Already over budget'
      },
      revenueMix: revenueMixProjection,
      expenseCategories: expenseCategoryProjection,
      workingCapital: {
        labels: workingCapitalOutlook.map((entry) => entry.label),
        values: workingCapitalOutlook.map((entry) => entry.workingCapital),
        outlook: workingCapitalOutlook
      },
      taxReserve: {
        vatRate,
        projectedVatReserve: Math.round(forecastSummary.nextQuarterRevenue * vatRate),
        projectedNetAfterVat: Math.round(forecastSummary.nextQuarterRevenue * (1 - vatRate))
      }
    };

    const scorecard = [
      { axis: 'Revenue Growth', val: Math.min(100, Math.max(0, Math.round(revenueGrowth))) },
      { axis: 'Profit Margin', val: Math.min(100, Math.max(0, Math.round(profitMargin))) },
      { axis: 'Budget Efficiency', val: Math.min(100, Math.max(0, Math.round(operatingEfficiency))) },
      { axis: 'Cash Flow', val: Math.min(100, Math.max(0, Math.round(((profitNet.slice(-1)[0] || 0) / Math.max((profitRevenue.slice(-1)[0] || 1), 1)) * 100))) },
      { axis: 'Cash Runway', val: Math.min(100, Math.max(0, Math.round(Math.min(cashRunwayMonths, 12) * 8))) },
      { axis: 'ROI', val: Math.min(100, Math.max(0, Math.round(profitMargin * 0.9))) }
    ];

    const insights = [
      {
        icon: '↗',
        color: 'var(--green)',
        bg: 'rgba(34,197,94,0.08)',
        border: '#22c55e33',
        title: 'Strong Revenue Growth',
        body: 'Recent revenue trends show sustained increase across key service lines.'
      },
      {
        icon: '◎',
        color: 'var(--teal)',
        bg: 'rgba(20,184,166,0.08)',
        border: '#14b8a633',
        title: 'Improved Profit Margins',
        body: 'Profit margin is improving this year, reflecting better cost control on operations.'
      },
      {
        icon: '▣',
        color: 'var(--blue)',
        bg: 'rgba(96,165,250,0.08)',
        border: '#60a5fa33',
        title: 'Client Concentration',
        body: 'Top clients contribute a large portion of recurring revenue. Monitor client mix closely.'
      },
      {
        icon: '⊙',
        color: 'var(--gold)',
        bg: 'rgba(245,197,24,0.08)',
        border: '#f5c51833',
        title: 'Seasonal Patterns',
        body: 'Revenue spikes in year-end and campaign months. Align spending and collections accordingly.'
      }
    ];

    res.json({
      kpis: {
        revenueGrowth,
        profitMargin,
        operatingEfficiency,
        clientAcquisitionCost
      },
      profitTrend: {
        labels: last8Months,
        revenue: profitRevenue,
        expenses: profitExpenses,
        profit: profitNet
      },
      revenueSources,
      expenseCategories,
      arAging: invoiceBuckets,
      financeSummary: {
        cashPosition,
        workingCapital,
        cashRunwayMonths,
        receivablesOutstanding,
        currentPayables
      },
      forecast: {
        labels: forecastLabels,
        revenue: forecastRevenue,
        expenses: forecastExpenses,
        profit: forecastProfit
      },
      forecastSummary,
      financialProjections,
      topClients,
      quarterlyPerformance,
      scorecard,
      insights
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// Get financial reports data
app.get('/api/reports/financials', protect, canViewReports, async (req, res) => {
  try {
    const month = req.query.month || new Date().toLocaleString('default', { month: 'long' });
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const [revenues, expenses, invoices, assets] = await Promise.all([
      Revenue.find(),
      Expense.find(),
      Invoice.find(),
      Asset.find()
    ]);

    const revenueItems = [
      { name: 'Advertising', type: 'Advertising' },
      { name: 'Sponsorship', type: 'Sponsorship' },
      { name: 'Event Sponsorship', type: 'Event Sponsorship' },
      { name: 'Digital', type: 'Digital' },
      { name: 'Other', type: 'Other' }
    ].map((item) => ({
      name: item.name,
      amount: revenues
        .filter((r) => r.status === 'COMPLETED' && r.type === item.type && new Date(r.date).getFullYear() === year)
        .reduce((sum, r) => sum + r.amount, 0)
    }));

    const expenseItems = ['Salaries', 'Licensing', 'Equipment', 'Utilities', 'Marketing', 'Operations', 'Other'].map((category) => ({
      name: category,
      amount: expenses
        .filter((e) => e.category === category && new Date(e.date).getFullYear() === year)
        .reduce((sum, e) => sum + e.amount, 0)
    }));

    const months = [];
    const chartMonths = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      chartMonths.push(d.toLocaleString('default', { month: 'short' }));
      months.push({ month: d.getMonth(), year: d.getFullYear() });
    }

    const monthlyRevenue = months.map((entry) => revenues
      .filter((r) => r.status === 'COMPLETED' && new Date(r.date).getFullYear() === entry.year && new Date(r.date).getMonth() === entry.month)
      .reduce((sum, r) => sum + r.amount, 0));

    const monthlyExpenses = months.map((entry) => expenses
      .filter((e) => new Date(e.date).getFullYear() === entry.year && new Date(e.date).getMonth() === entry.month)
      .reduce((sum, e) => sum + e.amount, 0));

    const cashFlowData = {
      labels: chartMonths,
      operating: monthlyRevenue.map((value, index) => value - monthlyExpenses[index]),
      investing: months.map((entry) => assets
        .filter((asset) => {
          const date = new Date(asset.purchaseDate);
          return date.getFullYear() === entry.year && date.getMonth() === entry.month;
        })
        .reduce((sum, asset) => sum + asset.cost, 0)),
      financing: new Array(6).fill(0)
    };

    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const statementRevenue = revenues
      .filter((r) => r.status === 'COMPLETED' && new Date(r.date).getFullYear() === year && new Date(r.date).getMonth() === monthIndex)
      .reduce((sum, r) => sum + r.amount, 0);
    const statementExpenses = expenses
      .filter((e) => new Date(e.date).getFullYear() === year && new Date(e.date).getMonth() === monthIndex)
      .reduce((sum, e) => sum + e.amount, 0);

    const incomeStatement = {
      revenue: revenueItems,
      expenses: expenseItems,
      totalRevenue: statementRevenue,
      totalExpenses: statementExpenses,
      netProfit: statementRevenue - statementExpenses,
      margin: statementRevenue > 0 ? Number((((statementRevenue - statementExpenses) / statementRevenue) * 100).toFixed(1)) : 0
    };

    const paidInvoicesAmount = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const receivables = invoices
      .filter((inv) => inv.status !== 'PAID' && inv.status !== 'WRITTEN_OFF')
      .reduce((sum, inv) => sum + (inv.amount - (inv.paidAmount || 0)), 0);
    const payable = expenses
      .filter((e) => ['PENDING', 'APPROVED'].includes(e.status))
      .reduce((sum, e) => sum + e.amount, 0);
    const assetNBV = assets.reduce((sum, asset) => sum + asset.netBook, 0);
    const totalCurrentAssets = paidInvoicesAmount + receivables;
    const totalAssets = totalCurrentAssets + assetNBV;
    const totalLiabilities = payable;
    const ownersEquity = totalAssets - totalLiabilities;

    const balanceSheet = {
      currentAssets: {
        Cash: paidInvoicesAmount,
        Receivables: receivables,
        PrepaidExpenses: 0
      },
      fixedAssets: {
        'Net Book Value': assetNBV,
        'Accumulated Depreciation': assets.reduce((sum, asset) => sum + asset.accumulated, 0)
      },
      currentLiab: {
        'Accounts Payable': payable,
        'Accrued Expenses': 0
      },
      longTermLiab: {
        Loans: 0,
        'Deferred Revenue': 0
      },
      totalAssets,
      totalLiabilities,
      ownersEquity
    };

    res.json({ incomeStatement, balanceSheet, cashFlowData });
  } catch (error) {
    console.error('Error fetching financial reports data:', error);
    res.status(500).json({ error: 'Failed to fetch financial reports data' });
  }
});

// Budget summary powered by actual expenses
app.get('/api/budget/summary', protect, canViewReports, async (req, res) => {
  try {
    const budget = 2500000;
    const currentYear = new Date().getFullYear();
    const expenses = await Expense.find();
    const revenues = await Revenue.find({ status: 'COMPLETED' });

    const yearExpenses = expenses.filter((e) => new Date(e.date).getFullYear() === currentYear);
    const totalSpent = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = Math.max(0, budget - totalSpent);

    const categoryBudgets = {
      Broadcasting: 450000,
      Sales: 400000,
      Finance: 600000,
      Technical: 500000,
      Management: 350000
    };

    const categoryMap = {
      Salaries: 'Broadcasting',
      Licensing: 'Finance',
      Equipment: 'Technical',
      Utilities: 'Finance',
      Marketing: 'Sales',
      Operations: 'Technical',
      Other: 'Management'
    };

    const departmentActuals = yearExpenses.reduce((acc, expense) => {
      const dept = categoryMap[expense.category] || 'Management';
      acc[dept] = (acc[dept] || 0) + expense.amount;
      return acc;
    }, {});

    const deptBudgets = Object.keys(categoryBudgets).map((dept) => {
      const spent = departmentActuals[dept] || 0;
      const used = categoryBudgets[dept] > 0 ? (spent / categoryBudgets[dept]) * 100 : 0;
      return {
        dept,
        budget: categoryBudgets[dept],
        spent,
        remaining: Math.max(0, categoryBudgets[dept] - spent),
        status: used >= 100 ? 'Over budget' : used >= 90 ? 'Watch' : 'On track'
      };
    });

    const quarterLabels = [];
    const qNow = new Date();
    let quarter = Math.floor(qNow.getMonth() / 3) + 1;
    let quarterYear = qNow.getFullYear();
    for (let i = 0; i < 5; i += 1) {
      quarterLabels.unshift(`Q${quarter} ${quarterYear}`);
      quarter -= 1;
      if (quarter === 0) {
        quarter = 4;
        quarterYear -= 1;
      }
    }

    const quarterActuals = quarterLabels.map((label) => {
      const [qString, yString] = label.split(' ');
      const qIndex = Number(qString.replace('Q', ''));
      const yearValue = Number(yString);
      return yearExpenses
        .filter((e) => {
          const d = new Date(e.date);
          const entryQuarter = Math.floor(d.getMonth() / 3) + 1;
          return entryQuarter === qIndex && d.getFullYear() === yearValue;
        })
        .reduce((sum, e) => sum + e.amount, 0);
    });

    const quarterBudgetTotals = quarterLabels.map(() => Math.round(budget / 5));
    const quarterlyForecast = {
      labels: quarterLabels,
      budget: quarterBudgetTotals,
      actual: quarterActuals,
      forecast: quarterActuals.map((actual, index) => Math.round(Math.max(actual, quarterBudgetTotals[index]) * 1.05))
    };

    const budgetVsActual = {
      labels: quarterLabels,
      budget: quarterBudgetTotals,
      actual: quarterActuals
    };

    res.json({
      budgetSummary: {
        total: budget,
        spent: totalSpent,
        remaining,
        utilization: Number(((totalSpent / budget) * 100).toFixed(1))
      },
      deptBudgets,
      quarterlyForecast,
      budgetVsActual
    });
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    res.status(500).json({ error: 'Failed to fetch budget summary' });
  }
});

// Create new expense
app.post('/api/expenses', protect, async (req, res) => {
  try {
    const { id } = req.body;
    const existingExpense = await Expense.findOne({ id });
    if (existingExpense) {
      return res.status(400).json({ error: 'Expense with this ID already exists' });
    }

    const expense = new Expense({ ...req.body, recordedBy: req.user._id });
    await expense.save();
    await recordAuditEntry(req, {
      status: 'SUCCESS',
      actionType: 'EXPENSE_CREATE',
      targetType: 'EXPENSE',
      details: `Created expense ${id}`
    });
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
app.put('/api/expenses/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOne({ id: req.params.id });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const nextStatus = req.body.status;
    if (nextStatus && ['APPROVED', 'PAID'].includes(nextStatus) && expense.amount > 5000 && req.user.role !== 'STATION_MANAGER') {
      return res.status(403).json({ error: 'Only the Station Manager can approve high-value expenses above LSL 5,000' });
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date(), approvedBy: nextStatus && ['APPROVED', 'PAID'].includes(nextStatus) ? req.user._id : expense.approvedBy },
      { new: true }
    );
    if (!updatedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await recordAuditEntry(req, {
      status: 'SUCCESS',
      actionType: 'EXPENSE_UPDATE',
      targetType: 'EXPENSE',
      details: `Updated expense ${req.params.id} status to ${nextStatus || expense.status}`
    });
    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
app.delete('/api/expenses/:id', protect, hasRole('STATION_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'), async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ id: req.params.id });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await recordAuditEntry(req, {
      status: 'SUCCESS',
      actionType: 'EXPENSE_DELETE',
      targetType: 'EXPENSE',
      details: `Deleted expense ${req.params.id}`
    });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ============ PAYROLL SCHEMA ============
const payrollSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  department: { 
    type: String, 
    enum: ['Broadcasting', 'Sales', 'Finance', 'Technical', 'Management'],
    required: true 
  },
  gross: { type: Number, required: true },
  tax: { type: Number, required: true },
  nssf: { type: Number, required: true },
  net: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Paid', 'Processing'],
    default: 'Pending'
  },
  month: { type: String, required: true }, // e.g., "March 2026"
  year: { type: Number, required: true },
  paymentDate: Date,
  bankAccount: String,
  paymentReference: String,
  notes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', payrollSchema);

// ============ RATE CARD SCHEMA ============
const rateCardSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  rate: { type: Number, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const RateCard = mongoose.models.RateCard || mongoose.model('RateCard', rateCardSchema);

// ============ PAYROLL API ROUTES ============

// Get all payroll records
app.get('/api/payroll', async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};
    
    if (month && year) {
      query = { month, year: parseInt(year) };
    } else {
      // Default to current month
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
      const currentYear = currentDate.getFullYear();
      query = { month: currentMonth, year: currentYear };
    }
    
    const payroll = await Payroll.find(query).sort({ name: 1 });
    res.json(payroll);
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({ error: 'Failed to fetch payroll data' });
  }
});

// Get payroll summary
app.get('/api/payroll/summary', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    
    const payroll = await Payroll.find({ month: currentMonth, year: currentYear });
    
    const totalGross = payroll.reduce((sum, p) => sum + p.gross, 0);
    const totalTax = payroll.reduce((sum, p) => sum + p.tax, 0);
    const totalNSSF = payroll.reduce((sum, p) => sum + p.nssf, 0);
    const totalNet = payroll.reduce((sum, p) => sum + p.net, 0);
    const pending = payroll.filter(p => p.status === 'Pending').length;
    const paid = payroll.filter(p => p.status === 'Paid').length;
    
    // Department breakdown
    const departments = ['Broadcasting', 'Sales', 'Finance', 'Technical', 'Management'];
    const deptSummary = departments.map(dept => ({
      dept,
      count: payroll.filter(p => p.department === dept).length,
      total: payroll.filter(p => p.department === dept).reduce((sum, p) => sum + p.gross, 0)
    })).filter(d => d.count > 0);
    
    // Statutory remittance summary
    const statutoryRemittance = {
      paye: totalTax,
      nssf: totalNSSF,
      previousPAYE: 7680, // This could come from a separate collection
      previousPAYEStatus: 'Paid'
    };
    
    res.json({
      totalGross,
      totalTax,
      totalNSSF,
      totalNet,
      employeeCount: payroll.length,
      pending,
      paid,
      deptSummary,
      statutoryRemittance,
      month: currentMonth,
      year: currentYear
    });
  } catch (error) {
    console.error('Error fetching payroll summary:', error);
    res.status(500).json({ error: 'Failed to fetch payroll summary' });
  }
});

// Create new payroll record
app.post('/api/payroll', async (req, res) => {
  try {
    const { id } = req.body;
    
    const existingRecord = await Payroll.findOne({ id });
    if (existingRecord) {
      return res.status(400).json({ error: 'Payroll record with this ID already exists' });
    }
    
    const payroll = new Payroll(req.body);
    await payroll.save();
    res.status(201).json(payroll);
  } catch (error) {
    console.error('Error creating payroll record:', error);
    res.status(500).json({ error: 'Failed to create payroll record' });
  }
});

// Update payroll record
app.put('/api/payroll/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payroll record' });
  }
});

// Update payroll status (mark as paid)
app.patch('/api/payroll/:id/status', async (req, res) => {
  try {
    const { status, paymentDate, paymentReference } = req.body;
    const payroll = await Payroll.findOneAndUpdate(
      { id: req.params.id },
      { 
        status, 
        paymentDate: paymentDate || new Date(),
        paymentReference,
        updatedAt: new Date() 
      },
      { new: true }
    );
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payroll status' });
  }
});

// Mark all as paid for current month
app.post('/api/payroll/mark-all-paid', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    
    await Payroll.updateMany(
      { month: currentMonth, year: currentYear, status: 'Pending' },
      { 
        status: 'Paid', 
        paymentDate: new Date(),
        updatedAt: new Date() 
      }
    );
    
    res.json({ message: 'All pending payroll records marked as paid' });
  } catch (error) {
    console.error('Error marking all as paid:', error);
    res.status(500).json({ error: 'Failed to mark all as paid' });
  }
});

app.post('/api/payroll/approve-run', protect, hasRole('STATION_MANAGER'), async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    await Payroll.updateMany(
      { month: currentMonth, year: currentYear, status: 'Pending' },
      {
        status: 'Approved',
        updatedAt: new Date()
      }
    );

    res.json({ message: 'Payroll run approved for current month' });
  } catch (error) {
    console.error('Error approving payroll run:', error);
    res.status(500).json({ error: 'Failed to approve payroll run' });
  }
});

// Delete payroll record
app.delete('/api/payroll/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findOneAndDelete({ id: req.params.id });
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete payroll record' });
  }
});

// ============ RATE CARD API ROUTES ============
app.get('/api/rate-card', protect, async (req, res) => {
  try {
    const rates = await RateCard.find().sort({ name: 1 });
    res.json(rates);
  } catch (error) {
    console.error('Error fetching rate card:', error);
    res.status(500).json({ error: 'Failed to fetch rate card items' });
  }
});

app.post('/api/rate-card', protect, hasRole('STATION_MANAGER'), async (req, res) => {
  try {
    const { id, name, description, category, rate } = req.body;
    if (!id || !name || typeof rate !== 'number') {
      return res.status(400).json({ error: 'Rate card item must contain id, name, and numeric rate' });
    }

    const existing = await RateCard.findOne({ id });
    if (existing) {
      return res.status(400).json({ error: 'Rate card item with this ID already exists' });
    }

    const item = new RateCard({ id, name, description, category, rate });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating rate card item:', error);
    res.status(500).json({ error: 'Failed to create rate card item' });
  }
});

app.put('/api/rate-card/:id', protect, hasRole('STATION_MANAGER'), async (req, res) => {
  try {
    const rateItem = await RateCard.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!rateItem) return res.status(404).json({ error: 'Rate card item not found' });
    res.json(rateItem);
  } catch (error) {
    console.error('Error updating rate card item:', error);
    res.status(500).json({ error: 'Failed to update rate card item' });
  }
});

app.delete('/api/rate-card/:id', protect, hasRole('STATION_MANAGER'), async (req, res) => {
  try {
    const rateItem = await RateCard.findOneAndDelete({ id: req.params.id });
    if (!rateItem) return res.status(404).json({ error: 'Rate card item not found' });
    res.json({ message: 'Rate card item deleted successfully' });
  } catch (error) {
    console.error('Error deleting rate card item:', error);
    res.status(500).json({ error: 'Failed to delete rate card item' });
  }
});

// Get payroll months (for history)
app.get('/api/payroll/months', async (req, res) => {
  try {
    const months = await Payroll.aggregate([
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          month: { $first: '$month' },
          year: { $first: '$year' },
          count: { $sum: 1 }
        }
      },
      { $sort: { year: -1 } }
    ]);
    
    res.json(months);
  } catch (error) {
    console.error('Error fetching payroll months:', error);
    res.status(500).json({ error: 'Failed to fetch payroll months' });
  }
});

// ============ BANK RECONCILIATION SCHEMA ============
const bankReconciliationSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  date: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], default: 'CREDIT' },
  status: { type: String, enum: ['UNMATCHED', 'MATCHED'], default: 'UNMATCHED' },
  matchedWith: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BankReconciliation = mongoose.models.BankReconciliation || mongoose.model('BankReconciliation', bankReconciliationSchema);

// Get all bank reconciliation entries
app.get('/api/bank-reconciliation', async (req, res) => {
  try {
    const entries = await BankReconciliation.find().sort({ date: -1, createdAt: -1 });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching bank reconciliation entries:', error);
    res.status(500).json({ error: 'Failed to fetch bank reconciliation entries' });
  }
});

// Create a bank reconciliation entry
app.post('/api/bank-reconciliation', async (req, res) => {
  try {
    const { id } = req.body;
    const existing = await BankReconciliation.findOne({ id });
    if (existing) {
      return res.status(400).json({ error: 'Bank reconciliation entry with this ID already exists' });
    }
    const entry = new BankReconciliation(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating bank reconciliation entry:', error);
    res.status(500).json({ error: 'Failed to create bank reconciliation entry' });
  }
});

// Update a bank reconciliation entry
app.put('/api/bank-reconciliation/:id', async (req, res) => {
  try {
    const entry = await BankReconciliation.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!entry) {
      return res.status(404).json({ error: 'Bank reconciliation entry not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error('Error updating bank reconciliation entry:', error);
    res.status(500).json({ error: 'Failed to update bank reconciliation entry' });
  }
});

// Delete a bank reconciliation entry
app.delete('/api/bank-reconciliation/:id', async (req, res) => {
  try {
    const entry = await BankReconciliation.findOneAndDelete({ id: req.params.id });
    if (!entry) {
      return res.status(404).json({ error: 'Bank reconciliation entry not found' });
    }
    res.json({ message: 'Bank reconciliation entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank reconciliation entry:', error);
    res.status(500).json({ error: 'Failed to delete bank reconciliation entry' });
  }
});

// ============ TAX SCHEMA ============
const taxSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  type: { 
    type: String, 
    enum: ['PAYE (Employees)', 'VAT Return', 'NSSF Contributions', 'Corporate Tax (Est.)', 
           'Withholding Tax', 'SDL', 'COSOMA Licensing', 'Broadcasting Licence Fee'],
    required: true 
  },
  period: { type: String, required: true }, // e.g., "March 2026", "Q1 2026", "FY 2025"
  amount: { type: Number, required: true },
  dueDate: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Overdue', 'Filed', 'Review'],
    default: 'Pending'
  },
  paymentDate: Date,
  paymentReference: String,
  notes: String,
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Tax = mongoose.models.Tax || mongoose.model('Tax', taxSchema);

// ============ REGULATIONS SCHEMA ============
const regulationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Tax', 'Labour', 'Broadcasting', 'Data Protection', 'Other'] },
  status: { 
    type: String, 
    enum: ['Compliant', 'Review', 'Non-Compliant', 'Pending'],
    default: 'Review'
  },
  lastReviewDate: Date,
  nextReviewDate: Date,
  responsibleParty: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Regulation = mongoose.models.Regulation || mongoose.model('Regulation', regulationSchema);

// ============ TAX API ROUTES ============

// Get all tax obligations
app.get('/api/tax', async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    const tax = await Tax.find(query).sort({ dueDate: 1, createdAt: -1 });
    res.json(tax);
  } catch (error) {
    console.error('Error fetching tax obligations:', error);
    res.status(500).json({ error: 'Failed to fetch tax obligations' });
  }
});

// Get tax summary
app.get('/api/tax/summary', async (req, res) => {
  try {
    const tax = await Tax.find();
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    
    const pending = tax.filter(t => t.status === 'Pending');
    const paid = tax.filter(t => t.status === 'Paid');
    const overdue = tax.filter(t => {
      if (t.status !== 'Paid') {
        const dueDate = new Date(t.dueDate);
        return dueDate < today;
      }
      return false;
    });
    
    const totalDue = pending.reduce((sum, t) => sum + t.amount, 0);
    const totalPaid = paid.reduce((sum, t) => sum + t.amount, 0);
    const totalOverdue = overdue.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate upcoming obligations (next 90 days)
    const upcoming = tax.filter(t => {
      if (t.status !== 'Paid') {
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate <= ninetyDaysFromNow;
      }
      return false;
    });
    const upcomingTotal = upcoming.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate compliance score (based on paid/filed vs total)
    const complianceScore = tax.length > 0 
      ? Math.round((paid.length / tax.length) * 100)
      : 100;
    
    res.json({
      totalDue,
      totalPaid,
      totalOverdue,
      upcomingTotal,
      pendingCount: pending.length,
      paidCount: paid.length,
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      complianceScore
    });
  } catch (error) {
    console.error('Error fetching tax summary:', error);
    res.status(500).json({ error: 'Failed to fetch tax summary' });
  }
});

// Create new tax obligation
app.post('/api/tax', async (req, res) => {
  try {
    const { id } = req.body;
    
    const existingTax = await Tax.findOne({ id });
    if (existingTax) {
      return res.status(400).json({ error: 'Tax obligation with this ID already exists' });
    }
    
    const tax = new Tax(req.body);
    await tax.save();
    res.status(201).json(tax);
  } catch (error) {
    console.error('Error creating tax obligation:', error);
    res.status(500).json({ error: 'Failed to create tax obligation' });
  }
});

// Update tax obligation
app.put('/api/tax/:id', async (req, res) => {
  try {
    const tax = await Tax.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!tax) {
      return res.status(404).json({ error: 'Tax obligation not found' });
    }
    res.json(tax);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tax obligation' });
  }
});

// Mark tax as paid
app.patch('/api/tax/:id/paid', async (req, res) => {
  try {
    const { paymentReference } = req.body;
    const tax = await Tax.findOneAndUpdate(
      { id: req.params.id },
      { 
        status: 'Paid', 
        paymentDate: new Date(),
        paymentReference,
        updatedAt: new Date() 
      },
      { new: true }
    );
    if (!tax) {
      return res.status(404).json({ error: 'Tax obligation not found' });
    }
    res.json(tax);
  } catch (error) {
    console.error('Error marking tax as paid:', error);
    res.status(500).json({ error: 'Failed to mark tax as paid' });
  }
});

// Delete tax obligation
app.delete('/api/tax/:id', async (req, res) => {
  try {
    const tax = await Tax.findOneAndDelete({ id: req.params.id });
    if (!tax) {
      return res.status(404).json({ error: 'Tax obligation not found' });
    }
    res.json({ message: 'Tax obligation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tax obligation' });
  }
});

// ============ REGULATIONS API ROUTES ============

// Get all regulations
app.get('/api/regulations', async (req, res) => {
  try {
    const regulations = await Regulation.find().sort({ category: 1, name: 1 });
    res.json(regulations);
  } catch (error) {
    console.error('Error fetching regulations:', error);
    res.status(500).json({ error: 'Failed to fetch regulations' });
  }
});

// Initialize default regulations if none exist
const initializeRegulations = async () => {
  const count = await Regulation.countDocuments();
  if (count === 0) {
    const defaultRegulations = [
      { name: 'Income Tax Act, 1993 (Lesotho)', description: 'Governs PAYE, corporate income tax, and withholding taxes on payments.', status: 'Compliant', category: 'Tax' },
      { name: 'Value Added Tax Order, 2001', description: 'VAT registration and quarterly filing obligations for revenue above threshold.', status: 'Compliant', category: 'Tax' },
      { name: 'National Social Security Fund Act', description: 'Mandatory employer and employee NSSF contributions at statutory rates.', status: 'Compliant', category: 'Tax' },
      { name: 'Communications Authority of Lesotho', description: 'Broadcasting licence, spectrum allocation, and frequency fee compliance.', status: 'Compliant', category: 'Broadcasting' },
      { name: 'COSOMA Music Licensing', description: 'Music rights and performance licensing — required for commercial broadcast.', status: 'Compliant', category: 'Broadcasting' },
      { name: 'Labour Code Order, 1992', description: 'Employment contracts, minimum wage, leave entitlements, and termination rules.', status: 'Compliant', category: 'Labour' },
      { name: 'Data Protection Act (Lesotho)', description: 'Listener data and advertiser data protection and privacy practices.', status: 'Review', category: 'Data Protection' }
    ];
    
    await Regulation.insertMany(defaultRegulations);
    console.log('✅ Default regulations initialized');
  }
};

// Update regulation status
app.put('/api/regulations/:id', async (req, res) => {
  try {
    const regulation = await Regulation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!regulation) {
      return res.status(404).json({ error: 'Regulation not found' });
    }
    res.json(regulation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update regulation' });
  }
});

// ============ ASSET SCHEMA ============
const assetSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Studio Equipment', 'Broadcast', 'IT', 'Vehicles', 'Furniture', 'Other'],
    required: true 
  },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  purchaseDate: { type: String, required: true },
  cost: { type: Number, required: true },
  accumulated: { type: Number, default: 0 },
  netBook: { type: Number, required: true },
  life: { type: Number, required: true }, // useful life in years
  serialNumber: String,
  location: String,
  condition: { 
    type: String, 
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'End of Life'],
    default: 'Good'
  },
  status: {
    type: String,
    enum: ['Active', 'Disposed', 'Under Repair', 'In Storage'],
    default: 'Active'
  },
  disposalDate: String,
  disposalValue: Number,
  notes: String,
  lastValuationDate: Date,
  nextValuationDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Asset = mongoose.models.Asset || mongoose.model('Asset', assetSchema);

// ============ ASSET API ROUTES ============

// Get all assets
app.get('/api/assets', async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    
    const assets = await Asset.find(query).sort({ purchaseDate: -1, name: 1 });
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Get asset summary
app.get('/api/assets/summary', async (req, res) => {
  try {
    const assets = await Asset.find();
    
    const totalCost = assets.reduce((sum, a) => sum + a.cost, 0);
    const totalAccum = assets.reduce((sum, a) => sum + a.accumulated, 0);
    const totalNBV = assets.reduce((sum, a) => sum + a.netBook, 0);
    const annualDep = assets.reduce((sum, a) => sum + Math.round(a.cost / a.life), 0);
    
    // Calculate assets near end of life (>70% depreciated)
    const nearEOL = assets.filter(a => {
      const depPct = (a.accumulated / a.cost) * 100;
      return depPct >= 70;
    });
    
    // Category breakdown
    const categories = ['Studio Equipment', 'Broadcast', 'IT', 'Vehicles', 'Furniture', 'Other'];
    const categorySummary = categories.map(cat => ({
      category: cat,
      count: assets.filter(a => a.category === cat).length,
      totalCost: assets.filter(a => a.category === cat).reduce((sum, a) => sum + a.cost, 0),
      totalNBV: assets.filter(a => a.category === cat).reduce((sum, a) => sum + a.netBook, 0)
    })).filter(c => c.count > 0);
    
    // Age analysis
    const currentDate = new Date();
    const assetsByAge = {
      under1Year: 0,
      under3Years: 0,
      under5Years: 0,
      over5Years: 0
    };
    
    assets.forEach(asset => {
      const purchaseDate = new Date(asset.purchaseDate);
      const ageYears = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
      
      if (ageYears < 1) assetsByAge.under1Year += asset.netBook;
      else if (ageYears < 3) assetsByAge.under3Years += asset.netBook;
      else if (ageYears < 5) assetsByAge.under5Years += asset.netBook;
      else assetsByAge.over5Years += asset.netBook;
    });
    
    res.json({
      totalCost,
      totalAccum,
      totalNBV,
      annualDep,
      nearEOLCount: nearEOL.length,
      nearEOLList: nearEOL.map(a => ({ id: a.id, name: a.name, depPct: Math.round((a.accumulated / a.cost) * 100) })),
      categorySummary,
      assetsByAge
    });
  } catch (error) {
    console.error('Error fetching asset summary:', error);
    res.status(500).json({ error: 'Failed to fetch asset summary' });
  }
});

// Create new asset
app.post('/api/assets', async (req, res) => {
  try {
    const { id } = req.body;
    
    const existingAsset = await Asset.findOne({ id });
    if (existingAsset) {
      return res.status(400).json({ error: 'Asset with this ID already exists' });
    }
    
    const asset = new Asset(req.body);
    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// Update asset
app.put('/api/assets/:id', async (req, res) => {
  try {
    // Calculate net book value
    const { cost, accumulated } = req.body;
    const netBook = (cost || 0) - (accumulated || 0);
    
    const asset = await Asset.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, netBook, updatedAt: new Date() },
      { new: true }
    );
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Delete asset
app.delete('/api/assets/:id', async (req, res) => {
  try {
    const asset = await Asset.findOneAndDelete({ id: req.params.id });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Calculate and update depreciation for all assets
app.post('/api/assets/calculate-depreciation', async (req, res) => {
  try {
    const assets = await Asset.find();
    const currentDate = new Date();
    
    for (const asset of assets) {
      const purchaseDate = new Date(asset.purchaseDate);
      const yearsOwned = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
      const expectedDepreciation = (asset.cost / asset.life) * yearsOwned;
      const accumulated = Math.min(expectedDepreciation, asset.cost);
      const netBook = asset.cost - accumulated;
      
      asset.accumulated = Math.round(accumulated);
      asset.netBook = Math.round(netBook);
      await asset.save();
    }
    
    res.json({ message: 'Depreciation calculated successfully' });
  } catch (error) {
    console.error('Error calculating depreciation:', error);
    res.status(500).json({ error: 'Failed to calculate depreciation' });
  }
});

// ============ ADVERTISERS SCHEMA ============
const advertiserSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  industry: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Pending', 'Prospective', 'Completed'], default: 'Active' },
  contactEmail: String,
  contactPhone: String,
  campaigns: { type: Number, default: 0 },
  billed: { type: Number, default: 0 },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Advertiser = mongoose.models.Advertiser || mongoose.model('Advertiser', advertiserSchema);

// ============ BOOKINGS SCHEMA ============
const bookingSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  client: { type: String, required: true },
  campaign: { type: String, required: true },
  spots: { type: Number, required: true },
  due: { type: String, required: true },
  status: { type: String, enum: ['Confirmed', 'Pending', 'Delivered', 'Planned', 'Cancelled'], default: 'Pending' },
  type: { type: String, default: 'Radio Spots' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

const getMongoErrorMessage = (error, fallback) => {
  if (mongoose.connection.readyState !== 1 || isMongoConnectionError(error)) {
    return `Database connection unavailable (${getConnectionState()}): ${error?.message || fallback}`;
  }

  if (error?.name === 'ValidationError') {
    return Object.values(error.errors).map(err => err.message).join('; ');
  }

  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
    return `A record with this ${duplicateField} already exists`;
  }

  return error?.message || fallback;
};

// Get all advertisers
app.get('/api/advertisers', protect, hasRole('FINANCE_OFFICER', 'MARKETING_OFFICER', 'AUDITOR'), async (req, res) => {
  try {
    const advertisers = await Advertiser.find().sort({ createdAt: -1 });
    res.json(advertisers);
  } catch (error) {
    console.error('Error fetching advertisers:', error);
    res.status(500).json({ error: 'Failed to fetch advertisers' });
  }
});

// Create advertiser
app.post('/api/advertisers', protect, hasRole('FINANCE_OFFICER', 'MARKETING_OFFICER'), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Advertiser ID is required' });
    }

    const existing = await Advertiser.findOne({ id });
    if (existing) {
      return res.status(400).json({ error: 'Advertiser with this ID already exists' });
    }

    const advertiser = new Advertiser(req.body);
    await advertiser.save();
    res.status(201).json(advertiser);
  } catch (error) {
    console.error('Error creating advertiser:', error);
    res.status(400).json({ error: getMongoErrorMessage(error, 'Failed to create advertiser') });
  }
});

// Get all bookings
app.get('/api/bookings', protect, hasRole('FINANCE_OFFICER', 'MARKETING_OFFICER', 'AUDITOR'), async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ due: 1, createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create booking
app.post('/api/bookings', protect, hasRole('FINANCE_OFFICER', 'MARKETING_OFFICER'), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const existing = await Booking.findOne({ id });
    if (existing) {
      return res.status(400).json({ error: 'Booking with this ID already exists' });
    }

    const booking = new Booking(req.body);
    await booking.save();
    await syncAdvertiserTotals(booking.client);
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(400).json({ error: getMongoErrorMessage(error, 'Failed to create booking') });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const startServer = async () => {
  const PORT = process.env.PORT || 5000;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connected to MongoDB Atlas');
    await initializeRegulations();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Available endpoints:`);
      console.log(`   - POST   /api/register`);
      console.log(`   - POST   /api/login`);
      console.log(`   - GET    /api/invoices`);
      console.log(`   - GET    /api/health`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

const startServerWithFallback = async () => {
  const PORT = process.env.PORT || 5000;
  const primaryUri = process.env.MONGODB_URI;
  const connectionAttempts = [];

  if (primaryUri) {
    connectionAttempts.push({ label: isLocalMongoUri(primaryUri) ? 'MongoDB local' : 'MongoDB primary', uri: primaryUri });
  }

  if (!primaryUri || !isLocalMongoUri(primaryUri)) {
    connectionAttempts.push({ label: 'MongoDB local fallback', uri: LOCAL_MONGODB_URI });
  }

  try {
    let connected = false;
    const errors = [];

    for (const attempt of connectionAttempts) {
      try {
        console.log(`Connecting to ${attempt.label}: ${maskMongoUri(attempt.uri)}`);
        await mongoose.connect(attempt.uri, MONGODB_CONNECT_OPTIONS);
        console.log(`Connected to ${attempt.label}`);
        connected = true;
        break;
      } catch (error) {
        errors.push(`${attempt.label} (${maskMongoUri(attempt.uri)}): ${error.message}`);
        console.error(`Failed to connect to ${attempt.label}:`, error.message);
        await mongoose.disconnect().catch(() => {});
      }
    }

    if (!connected) {
      throw new Error(`Unable to connect to MongoDB. Attempts: ${errors.join(' | ')}`);
    }

    await initializeRegulations();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Available endpoints:`);
      console.log(`   - POST   /api/register`);
      console.log(`   - POST   /api/login`);
      console.log(`   - GET    /api/invoices`);
      console.log(`   - GET    /api/health`);
      console.log(`   - GET    /api/advertisers`);
      console.log(`   - POST   /api/advertisers`);
      console.log(`   - GET    /api/bookings`);
      console.log(`   - POST   /api/bookings`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

startServerWithFallback();
