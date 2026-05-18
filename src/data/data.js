// ================================================================
//  LEKOPE FM FIS v2 — Full Data Store (matches screenshots)
// ================================================================

// ── DASHBOARD ────────────────────────────────────────────────────
export const dashboardKPIs = {
  totalRevenue:  387000,
  totalExpenses: 235000,
  netProfit:     152000,
  outstanding:   287000,
  revenueTrend:  15.9,
  expenseTrend:  3.1,
  marginPct:     39.3,
};

export const revenueVsExpenses = {
  labels:   ['Oct 2025','Nov 2025','Dec 2025','Jan 2026','Feb 2026','Mar 2026'],
  revenue:  [248000, 278000, 312000, 298000, 335000, 387000],
  expenses: [198000, 208000, 212000, 218000, 225000, 235000],
};

export const revenueSources = [
  { name:'Advertising',  pct:58, color:'#f5c518' },
  { name:'Sponsorships', pct:23, color:'#3b82f6' },
  { name:'Events',       pct:16, color:'#22c55e' },
  { name:'Other',        pct:4,  color:'#a855f7' },
];

export const topClients = [
  { name:'Maluti Brewery',           amount:145000, status:'PAID'    },
  { name:'Vodacom Lesotho',          amount:128000, status:'PAID'    },
  { name:'Standard Lesotho Bank',    amount:98000,  status:'PENDING' },
  { name:'Lesotho Electricity Company', amount:87000, status:'PAID'  },
  { name:'Shoprite Lesotho',         amount:76000,  status:'OVERDUE' },
];

export const upcomingPayments = [
  { name:'Staff Salaries - March',  due:'2026-04-05', amount:145000, priority:'HIGH'   },
  { name:'Music Licensing Fees',    due:'2026-04-10', amount:23500,  priority:'MEDIUM' },
  { name:'Equipment Maintenance',   due:'2026-04-15', amount:12800,  priority:'LOW'    },
  { name:'Utility Bills',           due:'2026-04-20', amount:8900,   priority:'MEDIUM' },
];

// ── REVENUE MANAGEMENT ────────────────────────────────────────────
export const revenueSummary = {
  totalYTD:       2152000,
  avgGrowth:      15.3,
  activeContracts:269,
};

export const revenueStreams = [
  { name:'Radio Advertising',  amount:1245000, txns:142, growth:12.5,  color:'#f5c518' },
  { name:'Sponsorships',       amount:487000,  txns:28,  growth:8.3,   color:'#3b82f6' },
  { name:'Event Revenue',      amount:342000,  txns:45,  growth:-5.2,  color:'#22c55e' },
  { name:'Digital Streaming',  amount:78000,   txns:87,  growth:45.8,  color:'#a855f7' },
];

export const monthlyRevBySource = {
  labels: ['Oct','Nov','Dec','Jan','Feb','Mar'],
  advertising:  [185000,210000,238000,195000,245000,248000],
  sponsorships: [42000, 48000, 55000, 50000, 58000, 62000],
  events:       [28000, 32000, 35000, 28000, 38000, 42000],
  digital:      [8000,  9000,  11000, 9500,  12000, 15000],
};

export const revenueTransactions = [
  { id:'INV-2026-0342', client:'Maluti Brewery',            type:'Advertising',       amount:45000, date:'2026-03-28', status:'COMPLETED' },
  { id:'INV-2026-0341', client:'Vodacom Lesotho',           type:'Sponsorship',       amount:38000, date:'2026-03-25', status:'COMPLETED' },
  { id:'INV-2026-0340', client:'Shoprite Lesotho',          type:'Advertising',       amount:15000, date:'2026-03-22', status:'PENDING'   },
  { id:'INV-2026-0339', client:'Standard Lesotho Bank',     type:'Event Sponsorship', amount:67000, date:'2026-03-18', status:'COMPLETED' },
  { id:'INV-2026-0338', client:'Lesotho Electricity Company',type:'Advertising',      amount:22000, date:'2026-03-15', status:'COMPLETED' },
  { id:'INV-2026-0337', client:'Econet Telecom Lesotho',    type:'Sponsorship',       amount:35000, date:'2026-03-12', status:'COMPLETED' },
];

// ── EXPENSE TRACKING ──────────────────────────────────────────────
export const expenseSummary = {
  total:          235000,
  budget:         248000,
  pendingApproval:1,
};

export const expenseCategories = [
  { name:'Staff Salaries',        actual:145000, budget:150000, color:'#f5c518' },
  { name:'Equipment & Maintenance', actual:28500, budget:30000, color:'#f5c518' },
  { name:'Music Licensing',       actual:23500,  budget:25000,  color:'#f5c518' },
  { name:'Utilities',             actual:18900,  budget:20000,  color:'#f5c518' },
  { name:'Marketing',             actual:12800,  budget:15000,  color:'#3b82f6' },
  { name:'Office Supplies',       actual:6300,   budget:8000,   color:'#a855f7' },
];

export const monthlyExpenses = [130000,132000,135000,132000,135000,133000];

export const recentExpenses = [
  { id:'EXP-2026-0521', desc:'Staff Salaries - March 2026',       category:'Salaries',   amount:145000, date:'2026-03-31', status:'PENDING'  },
  { id:'EXP-2026-0520', desc:'Music Licensing - COSOMA',          category:'Licensing',  amount:23500,  date:'2026-03-28', status:'APPROVED' },
  { id:'EXP-2026-0519', desc:'Equipment Maintenance - Studio A',  category:'Equipment',  amount:12800,  date:'2026-03-25', status:'PAID'     },
  { id:'EXP-2026-0518', desc:'Electricity Bill - February',       category:'Utilities',  amount:8900,   date:'2026-03-22', status:'PAID'     },
  { id:'EXP-2026-0517', desc:'Marketing Campaign - Easter Special',category:'Marketing', amount:15600,  date:'2026-03-18', status:'PAID'     },
  { id:'EXP-2026-0516', desc:'Office Supplies',                   category:'Operations', amount:3400,   date:'2026-03-15', status:'PAID'     },
];

// ── INVOICING & BILLING ───────────────────────────────────────────
export const invoiceSummary = {
  totalInvoiced: 696000,
  paid:          360000,
  outstanding:   293000,
  overdue:       76000,
};

export const arAging = [
  { bucket:'Current',    amount:246000, invoices:3 },
  { bucket:'1-30 days',  amount:119000, invoices:2 },
  { bucket:'31-60 days', amount:76000,  invoices:1 },
  { bucket:'60+ days',   amount:0,      invoices:0 },
];

export const invoices = [
  { id:'INV-2026-0342', client:'Maluti Brewery',             issue:'2026-03-01', due:'2026-03-31', amount:145000, status:'PAID'    },
  { id:'INV-2026-0341', client:'Vodacom Lesotho',            issue:'2026-03-01', due:'2026-03-31', amount:128000, status:'PAID'    },
  { id:'INV-2026-0340', client:'Standard Lesotho Bank',      issue:'2026-03-01', due:'2026-03-31', amount:98000,  status:'PENDING' },
  { id:'INV-2026-0339', client:'Lesotho Electricity Company',issue:'2026-03-01', due:'2026-03-31', amount:87000,  status:'PAID'    },
  { id:'INV-2026-0338', client:'Shoprite Lesotho',           issue:'2026-02-01', due:'2026-02-28', amount:76000,  status:'OVERDUE' },
  { id:'INV-2026-0337', client:'Econet Telecom Lesotho',     issue:'2026-03-01', due:'2026-03-31', amount:65000,  status:'SENT'    },
  { id:'INV-2026-0336', client:'Lesotho Post Bank',          issue:'2026-03-01', due:'2026-03-31', amount:54000,  status:'PENDING' },
  { id:'INV-2026-0335', client:'Metropolitan Health',        issue:'2026-03-01', due:'2026-03-31', amount:43000,  status:'DRAFT'   },
];

// ── BUDGET MANAGEMENT ─────────────────────────────────────────────
export const budgetSummary = {
  total:    528000,
  spent:    473800,
  remaining: 54200,
  utilization: 89.7,
};

export const deptBudgets = [
  { dept:'Programming & Content', budget:185000, spent:168500, remaining:16500, status:'On Track',  color:'#f5c518' },
  { dept:'Sales & Marketing',     budget:125000, spent:118200, remaining:6800,  status:'Monitor',   color:'#f5c518' },
  { dept:'Technical Operations',  budget:95000,  spent:78400,  remaining:16600, status:'On Track',  color:'#22c55e' },
  { dept:'Administration',        budget:78000,  spent:69800,  remaining:8200,  status:'On Track',  color:'#f5c518' },
  { dept:'Finance',               budget:45000,  spent:38900,  remaining:6100,  status:'On Track',  color:'#f5c518' },
];

export const quarterlyForecast = {
  labels: ['Q4 2025','Q1 2026','Q2 2026','Q3 2026','Q4 2026'],
  budget:   [875000,  940000,  990000,  1050000, 1100000],
  actual:   [862000,  940000,  null,    null,    null],
  forecast: [862000,  940000,  980000,  1040000, 1095000],
};

export const budgetVsActual = {
  labels:  ['Oct','Nov','Dec','Jan','Feb','Mar'],
  budget:  [285000,290000,305000,295000,310000,320000],
  actual:  [275000,295000,312000,288000,318000,340000],
};

// ── FINANCIAL REPORTS ─────────────────────────────────────────────
export const incomeStatement = {
  revenue: [
    { name:'Advertising Revenue', amount:1245000 },
    { name:'Sponsorships',         amount:487000  },
    { name:'Event Revenue',        amount:342000  },
    { name:'Digital Streaming',    amount:78000   },
  ],
  expenses: [
    { name:'Salaries & Benefits',     amount:870000 },
    { name:'Operations & Maintenance', amount:312000 },
    { name:'Marketing & Advertising', amount:145000 },
    { name:'Other Expenses',          amount:89000  },
  ],
  totalRevenue:  2152000,
  totalExpenses: 1416000,
  netProfit:     736000,
  margin:        34.2,
};

export const balanceSheet = {
  currentAssets:  { 'Cash & Equivalents':487000, 'Accounts Receivable':287000, 'Inventory':45000 },
  fixedAssets:    { 'Equipment':1245000, 'Buildings':2450000 },
  totalAssets:    4348000,
  currentLiab:    { 'Accounts Payable':145000, 'Short-term Debt':120000 },
  longTermLiab:   { 'Long-term Debt':850000 },
  totalLiabilities: 1271000,
  ownersEquity:   3077000,
};

export const cashFlowData = {
  labels:    ['Oct','Nov','Dec','Jan','Feb','Mar'],
  operating: [42000, 72000, 98000, 70000, 106000, 155000],
  investing: [-8000,-5000,-12000,-8000,-10000,-15000],
  financing: [0,    0,    0,    0,    0,    0],
};
