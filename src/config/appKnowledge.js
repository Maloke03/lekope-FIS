export const ROLE_LABELS = {
  STATION_MANAGER: 'Station Manager',
  FINANCE_OFFICER: 'Finance Officer',
  MARKETING_OFFICER: 'Marketing Officer',
  STAFF: 'Staff Member',
  AUDITOR: 'Auditor',
};

export const APP_OVERVIEW = {
  name: 'Lekope FM Financial Information System',
  summary:
    'Lekope FIS helps the station manage finance, advertising, bookings, payroll, tax, assets, reporting, analytics, users, and audit activity from one role-protected workspace.',
  capabilities: [
    'track revenue, expenses, budgets, invoices, and bank reconciliation',
    'manage advertisers, ad contracts, airtime bookings, and rate cards',
    'review payroll, tax compliance, assets, financial reports, analytics, users, and audit logs',
  ],
};

export const PAGE_KNOWLEDGE = {
  '/dashboard': {
    summary:
      'The Dashboard gives a high-level view of station performance, financial KPIs, module health, charts, upcoming payments, and manager login activity where permitted.',
    answers: [
      'Use it when you want the fastest overview of revenue, expenses, profit, outstanding invoices, operational activity, and user login activity.',
      'Station Managers see management controls and login activity. Finance users see finance-focused charts and summaries.',
    ],
  },
  '/revenue': {
    summary:
      'Revenue Management tracks station income from advertising, sponsorships, events, digital activity, and other income streams.',
    answers: [
      'Use it to review income records, monitor revenue performance, and understand where money is coming from.',
      'It supports questions about sales, collections, income growth, and revenue streams.',
    ],
  },
  '/expenses': {
    summary:
      'Expense Tracking records and monitors station costs, categories, budgets, approval status, vendors, and spending trends.',
    answers: [
      'Use it to add expenses, review pending approvals, compare spending against budget, and control operating costs.',
      'High-value expense approvals are protected by role rules.',
    ],
  },
  '/invoices': {
    summary:
      'Invoicing & Billing manages client invoices, payment status, outstanding balances, write-offs, ledger verification, PDFs, and email sending.',
    answers: [
      'Use it to create invoices, record payments, follow up on unpaid balances, and verify invoice ledger status.',
      'It is the best place for billing, receivables, and client payment questions.',
    ],
  },
  '/budget': {
    summary:
      'Budget Management compares budgeted amounts against actual spending and helps monitor allocation, utilization, remaining funds, and forecasts.',
    answers: [
      'Use it to see whether departments are staying within budget and where spending may need attention.',
      'It connects naturally to expenses, forecasts, and budget-versus-actual reporting.',
    ],
  },
  '/bank-reconciliation': {
    summary:
      'Bank Reconciliation matches bank transactions against internal records so finance users can spot unmatched or unresolved entries.',
    answers: [
      'Use it to review deposits, withdrawals, matched entries, and reconciliation status.',
      'It helps confirm that bank statements and system records agree.',
    ],
  },
  '/adcontracts': {
    summary:
      'Ad Contracts & Airtime manages advertising agreements, campaign contract details, airtime value, contract status, and commercial commitments.',
    answers: [
      'Use it when working with advertising contracts, airtime packages, campaign values, and contract follow-up.',
      'It connects advertisers, bookings, invoices, and revenue activity.',
    ],
  },
  '/advertisers': {
    summary:
      'Advertisers stores advertiser and client information used for campaigns, contracts, billing, and station commercial relationships.',
    answers: [
      'Use it to manage advertiser profiles, contact details, active partners, and client records.',
      'It is the best page for questions about sponsors, brands, and advertising clients.',
    ],
  },
  '/bookings': {
    summary:
      'Bookings schedules and manages airtime or campaign bookings, including dates, slots, clients, and booking status.',
    answers: [
      'Use it to create or check scheduled airtime, campaign bookings, and station calendar commitments.',
      'It helps marketing users connect advertiser demand to station airtime availability.',
    ],
  },
  '/rate-card': {
    summary:
      'Rate Card maintains pricing rules for airtime and advertising packages.',
    answers: [
      'Use it to review or adjust station advertising prices and package rates.',
      'Because pricing affects revenue and contracts, access is tightly controlled.',
    ],
  },
  '/payroll': {
    summary:
      'Payroll Management tracks employee pay, payroll status, salary totals, payment references, and payroll approvals.',
    answers: [
      'Use it for staff payment questions, payroll runs, paid versus pending payroll, and salary summaries.',
      'Approval and payment actions are role-protected.',
    ],
  },
  '/tax': {
    summary:
      'Tax & Compliance monitors tax obligations, due amounts, overdue items, regulations, and compliance status.',
    answers: [
      'Use it to see what tax is due, what has been paid, what is overdue, and what compliance items need attention.',
      'It supports finance and audit checks around tax and regulations.',
    ],
  },
  '/assets': {
    summary:
      'Asset Register tracks station equipment and assets, including value, depreciation, category, status, and asset records.',
    answers: [
      'Use it to understand equipment ownership, asset value, depreciation, and register completeness.',
      'It helps finance users account for station property.',
    ],
  },
  '/reports': {
    summary:
      'Financial Reports generates structured finance outputs such as income statements, financial summaries, and reporting views.',
    answers: [
      'Use it when you need formal reporting rather than live dashboard snapshots.',
      'It is the best page for month-end or management finance reports.',
    ],
  },
  '/analytics': {
    summary:
      'Analytics gives deeper charts, trends, projections, and performance insight across financial and operational data.',
    answers: [
      'Use it to explore trends, compare performance, review forecasts, and understand cash flow or performance projections.',
      'It is the best page for insight questions that go beyond a single record or transaction.',
    ],
  },
  '/audit-log': {
    summary:
      'Audit Log shows important system activity and login history for accountability and review.',
    answers: [
      'Use it to investigate actions, access history, and audit-sensitive events.',
      'Auditors and managers can use it to review system behavior.',
    ],
  },
  '/users': {
    summary:
      'User Management controls user accounts, roles, access, status, and administrative user maintenance.',
    answers: [
      'Use it to add users, update roles, manage active status, and control who can access protected areas.',
      'It is restricted because role changes affect the whole system.',
    ],
  },
};

export const FAQ_KNOWLEDGE = [
  {
    id: 'roles',
    title: 'Roles and permissions',
    keywords: ['role', 'roles', 'permission', 'permissions', 'access', 'allowed', 'who can use', 'restricted'],
    answer:
      'Lekope FIS uses role-based access. Each page has allowed roles, and the assistant follows the same access rules as the protected routes and sidebar.',
  },
  {
    id: 'app-purpose',
    title: 'App purpose',
    keywords: ['what is this app', 'what does app do', 'purpose', 'system', 'lekope fis', 'financial information system'],
    answer: APP_OVERVIEW.summary,
  },
  {
    id: 'offline',
    title: 'Offline and API data',
    keywords: ['offline', 'network', 'internet', 'render', 'api', 'data not loading', 'fallback'],
    answer:
      'The app uses the Render backend for live data. If the browser is offline or the backend cannot be reached, pages fall back to safe empty data instead of crashing.',
  },
  {
    id: 'security',
    title: 'Security',
    keywords: ['security', 'secure', 'token', 'login', 'authentication', 'jwt'],
    answer:
      'Login is protected by an auth token. Protected pages check the signed-in user before rendering, and role-based routes decide which modules the user may open.',
  },
];

export const getRoleLabel = role => ROLE_LABELS[role] || role;

export const getPageKnowledge = path => PAGE_KNOWLEDGE[path] || null;
