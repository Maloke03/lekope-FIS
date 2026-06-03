import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart2,
  PieChart,
  Clock,
  Users,
  ShieldCheck,
  Database,
  Megaphone,
  Calendar,
  UserCircle,
} from 'lucide-react';
import { PAGE_ACCESS } from '../contexts/AuthContext';

export const NAV_GROUPS = [
  {
    label: 'Core Finance',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: PAGE_ACCESS['/dashboard'],
        description: 'Review key financial summaries, recent activity, and user login activity.',
        keywords: ['home', 'overview', 'summary', 'main', 'login activity', 'user login activity'],
      },
      {
        label: 'Revenue Management',
        path: '/revenue',
        icon: TrendingUp,
        roles: PAGE_ACCESS['/revenue'],
        description: 'Track income streams, collections, and revenue performance.',
        keywords: ['revenue', 'income', 'sales', 'collections', 'money in'],
      },
      {
        label: 'Expense Tracking',
        path: '/expenses',
        icon: TrendingDown,
        roles: PAGE_ACCESS['/expenses'],
        description: 'Record, review, and manage station expenses.',
        keywords: ['expense', 'expenses', 'spend', 'costs', 'payments', 'money out'],
      },
      {
        label: 'Invoicing & Billing',
        path: '/invoices',
        icon: FileText,
        roles: PAGE_ACCESS['/invoices'],
        description: 'Create invoices, monitor balances, and manage billing actions.',
        keywords: ['invoice', 'invoices', 'billing', 'bill', 'client bill', 'payment request'],
      },
      {
        label: 'Budget Management',
        path: '/budget',
        icon: BarChart2,
        roles: PAGE_ACCESS['/budget'],
        description: 'Plan budgets, compare allocations, and monitor spend against targets.',
        keywords: ['budget', 'budgets', 'planning', 'allocation', 'forecast'],
      },
      {
        label: 'Bank Reconciliation',
        path: '/bank-reconciliation',
        icon: ShieldCheck,
        roles: PAGE_ACCESS['/bank-reconciliation'],
        description: 'Match bank transactions with system records.',
        keywords: ['bank', 'reconciliation', 'reconcile', 'statement', 'banking'],
      },
    ],
  },
  {
    label: 'Radio Station',
    items: [
      {
        label: 'Ad Contracts & Airtime',
        path: '/adcontracts',
        icon: Megaphone,
        roles: PAGE_ACCESS['/adcontracts'],
        description: 'Manage advertising contracts, airtime packages, and campaign agreements.',
        keywords: ['ad contract', 'ad contracts', 'advertising contract', 'airtime', 'campaign contract'],
      },
      {
        label: 'Advertisers',
        path: '/advertisers',
        icon: Users,
        roles: PAGE_ACCESS['/advertisers'],
        description: 'View and manage advertiser profiles and client details.',
        keywords: ['advertiser', 'advertisers', 'clients', 'sponsors', 'brands'],
      },
      {
        label: 'Bookings',
        path: '/bookings',
        icon: Calendar,
        roles: PAGE_ACCESS['/bookings'],
        description: 'Schedule and manage airtime bookings.',
        keywords: ['booking', 'bookings', 'schedule', 'calendar', 'slots', 'airtime booking'],
      },
      {
        label: 'Rate Card',
        path: '/rate-card',
        icon: FileText,
        roles: PAGE_ACCESS['/rate-card'],
        description: 'Maintain advertising prices and airtime rate rules.',
        keywords: ['rate card', 'rates', 'pricing', 'prices', 'airtime prices'],
      },
      {
        label: 'Payroll Management',
        path: '/payroll',
        icon: Users,
        roles: PAGE_ACCESS['/payroll'],
        description: 'Review payroll, staff payments, and salary information.',
        keywords: ['payroll', 'salary', 'salaries', 'staff pay', 'wages'],
      },
      {
        label: 'Tax & Compliance',
        path: '/tax',
        icon: ShieldCheck,
        roles: PAGE_ACCESS['/tax'],
        description: 'Manage tax information and compliance obligations.',
        keywords: ['tax', 'compliance', 'vat', 'returns', 'regulation'],
      },
      {
        label: 'Asset Register',
        path: '/assets',
        icon: Database,
        roles: PAGE_ACCESS['/assets'],
        description: 'Track station assets, equipment, and asset values.',
        keywords: ['asset', 'assets', 'equipment', 'inventory', 'register'],
      },
    ],
  },
  {
    label: 'Reporting',
    items: [
      {
        label: 'Financial Reports',
        path: '/reports',
        icon: BarChart2,
        roles: PAGE_ACCESS['/reports'],
        description: 'Generate and review financial reports.',
        keywords: ['report', 'reports', 'financial report', 'statements', 'monthly report'],
      },
      {
        label: 'Analytics',
        path: '/analytics',
        icon: PieChart,
        roles: PAGE_ACCESS['/analytics'],
        description: 'Explore charts, trends, and financial analytics.',
        keywords: ['analytics', 'analysis', 'charts', 'insights', 'trends', 'projection', 'projections', 'forecast', 'cash flow forecast'],
      },
      {
        label: 'Audit Log',
        path: '/audit-log',
        icon: Clock,
        roles: PAGE_ACCESS['/audit-log'],
        description: 'Review audit history and important system actions.',
        keywords: ['audit', 'audit log', 'logs', 'history', 'activity log'],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'User Management',
        path: '/users',
        icon: UserCircle,
        roles: PAGE_ACCESS['/users'],
        description: 'Manage user accounts, roles, and access.',
        keywords: ['users', 'user management', 'staff accounts', 'roles', 'permissions', 'accounts'],
      },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap(group =>
  group.items.map(item => ({ ...item, group: group.label }))
);

export const getAllowedNavGroups = hasRole =>
  NAV_GROUPS
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.some(role => hasRole(role))),
    }))
    .filter(group => group.items.length > 0);

export const getAllowedNavItems = hasRole =>
  NAV_ITEMS.filter(item => item.roles.some(role => hasRole(role)));
