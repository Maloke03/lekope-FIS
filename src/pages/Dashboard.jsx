import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { DollarSign, TrendingDown, TrendingUp, FileText, AlertCircle, Clock, Users, BarChart3, PieChart } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { KPI } from '../components/common/UI';
import { revenueService } from '../services/revenueService';
import { expenseService } from '../services/expenseService';
import { invoiceService } from '../services/invoiceService';
import { reportService } from '../services/reportService';
import { bookingService } from '../services/bookingService';
import { advertiserService } from '../services/advertiserService';
import { payrollService } from '../services/payrollService';
import { budgetService } from '../services/budgetService';
import { bankReconciliationService } from '../services/bankReconciliationService';
import { taxService } from '../services/taxService';
import { assetService } from '../services/assetService';
import { rateCardService } from '../services/rateCardService';
import { analyticsService } from '../services/analyticsService';
import { ROLES, useAuth } from '../contexts/AuthContext';
import { lsl, statusStyle } from '../utils/helpers';
import API_URL from '../config/apiConfig';
import dashboardAccent from '../images/landing-hero.jpg';
import financeDash1 from '../images/finance_dash1.jpg';
import financeDash2 from '../images/finance_dash2.jpg';
import financeDash3 from '../images/finance_dash3.jpg';
import { getApiErrorMessage, isBrowserOffline, isNetworkError } from '../utils/network';

Chart.register(...registerables);

const Dashboard = () => {
  const { user } = useAuth();
  const lineRef = useRef(); const lineChart = useRef();
  const pieRef = useRef(); const pieChart = useRef();
  const profitRef = useRef(); const profitChart = useRef();
  const expensePieRef = useRef(); const expensePieChart = useRef();
  const revenueSourcesRef = useRef(); const revenueSourcesChart = useRef();
  const cashFlowRef = useRef(); const cashFlowChart = useRef();
  const invoiceStatusRef = useRef(); const invoiceStatusChart = useRef();
  const assetLiabilityRef = useRef(); const assetLiabilityChart = useRef();
  const userActivityRef = useRef(); const userActivityChart = useRef();
  const revenueCompositionRef = useRef(); const revenueCompositionChart = useRef();
  const moduleHealthRef = useRef(); const moduleHealthChart = useRef();
  const recentActivityRef = useRef(); const recentActivityChart = useRef();
  const bookingsRef = useRef(); const bookingsChart = useRef();
  const advertisersRef = useRef(); const advertisersChart = useRef();
  const payrollRef = useRef(); const payrollChart = useRef();
  const adContractsRef = useRef(); const adContractsChart = useRef();
  const monthlyExpenseRef = useRef(); const monthlyExpenseChart = useRef();
  const budgetActualRef = useRef(); const budgetActualChart = useRef();
  const quarterlyForecastRef = useRef(); const quarterlyForecastChart = useRef();

  const isStationManager = user?.role === ROLES.STATION_MANAGER;
  const isFinanceOfficer = user?.role === ROLES.FINANCE_OFFICER;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    marginPct: 0,
    outstanding: 0,
    revenueGrowth: 0
  });
  const [monthlyTrend, setMonthlyTrend] = useState({ labels: [], revenue: [], expenses: [], profit: [] });
  const [topClients, setTopClients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [adContracts, setAdContracts] = useState([]);
  const [airtimes, setAirtimes] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [managerTab, setManagerTab] = useState('users');
  const [stationUsers, setStationUsers] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [bankEntries, setBankEntries] = useState([]);
  const [taxSummary, setTaxSummary] = useState(null);
  const [taxItems, setTaxItems] = useState([]);
  const [assetSummary, setAssetSummary] = useState(null);
  const [assets, setAssets] = useState([]);
  const [rateCards, setRateCards] = useState([]);
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [expenseMonthlyData, setExpenseMonthlyData] = useState(null);
  const [revenueMonthlyData, setRevenueMonthlyData] = useState(null);

  const buildTopClients = (revenues = []) => {
    const clients = revenues.reduce((acc, item) => {
      if (!item.client) return acc;
      acc[item.client] = (acc[item.client] || 0) + item.amount;
      return acc;
    }, {});

    return Object.entries(clients)
      .map(([name, amount]) => ({ name, amount, status: amount > 0 ? 'Paid' : 'Pending' }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const buildUpcomingPayments = (invoices = []) => {
    const today = new Date();
    const soon = new Date();
    soon.setDate(today.getDate() + 30);

    return invoices
      .filter(invoice => {
        const dueDate = new Date(invoice.due);
        return invoice.status !== 'PAID' && invoice.status !== 'WRITTEN_OFF' && dueDate >= today && dueDate <= soon;
      })
      .map(invoice => ({
        id: invoice.id,
        description: invoice.client,
        due: invoice.due,
        amount: invoice.amount - (invoice.paidAmount || 0),
        status: 'Pending'
      }))
      .slice(0, 5);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all data with individual error handling
      const fetchWithFallback = async (fn, fallback = null) => {
        if (isBrowserOffline()) return fallback;

        try {
          return await fn();
        } catch (error) {
          if (!isNetworkError(error)) {
            console.warn('API call failed, using fallback:', getApiErrorMessage(error));
          }
          return fallback;
        }
      };

      const [
        revSummary,
        expSummary,
        revenueMonthly,
        expenseMonthly,
        invoicesData,
        allRevenue,
        finData,
        bookingsData,
        advertisersData,
        adContractsData,
        airtimesData,
        payrollSummaryData,
        budgetSummaryData,
        bankEntriesData,
        taxSummaryData,
        taxItemsData,
        assetSummaryData,
        assetsData,
        rateCardsData,
        analyticsOverviewData
      ] = await Promise.all([
        fetchWithFallback(() => revenueService.getRevenueSummary(), { totalRevenue: 0, avgGrowth: 0, activeContracts: 0 }),
        fetchWithFallback(() => expenseService.getExpenseSummary(), { total: 0, budget: 2500000, budgetUsed: 0 }),
        fetchWithFallback(() => revenueService.getMonthlyRevenue(), { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], advertising: [], sponsorships: [], events: [], digital: [] }),
        fetchWithFallback(() => expenseService.getMonthlyExpenses(), { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], salaries: [], operations: [], marketing: [], other: [] }),
        fetchWithFallback(() => invoiceService.getInvoices(), []),
        fetchWithFallback(() => revenueService.getRevenue(), []),
        fetchWithFallback(() => reportService.getFinancials(), null),
        fetchWithFallback(() => bookingService.getBookings(), []),
        fetchWithFallback(() => advertiserService.getAdvertisers(), []),
        fetchWithFallback(() => advertiserService.getAdContracts(), []),
        fetchWithFallback(() => bookingService.getAirtimes(), []),
        fetchWithFallback(() => payrollService.getPayrollSummary(), null),
        fetchWithFallback(() => budgetService.getBudgetSummary(), null),
        fetchWithFallback(() => bankReconciliationService.getEntries(), []),
        fetchWithFallback(() => taxService.getTaxSummary(), null),
        fetchWithFallback(() => taxService.getTax(), []),
        fetchWithFallback(() => assetService.getAssetSummary(), null),
        fetchWithFallback(() => assetService.getAssets(), []),
        fetchWithFallback(() => rateCardService.getRates(), []),
        fetchWithFallback(() => analyticsService.getOverview(), null)
      ]);

      // Ensure arrays have proper length for monthly data
      const ensureMonthlyArray = (arr = []) => Array.isArray(arr) ? arr : new Array(12).fill(0);
      const monthlyRevLabels = ensureMonthlyArray(revenueMonthly.labels).length > 0 ? revenueMonthly.labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyExpLabels = ensureMonthlyArray(expenseMonthly.labels).length > 0 ? expenseMonthly.labels : monthlyRevLabels;
      const labels = monthlyRevLabels.length > 0 ? monthlyRevLabels : monthlyExpLabels;

      // Calculate revenue series with proper fallbacks
      const revenueSeries = labels.map((_, idx) => {
        const advertising = Number(revenueMonthly?.advertising?.[idx]) || 0;
        const sponsorships = Number(revenueMonthly?.sponsorships?.[idx]) || 0;
        const events = Number(revenueMonthly?.events?.[idx]) || 0;
        const digital = Number(revenueMonthly?.digital?.[idx]) || 0;
        return Math.max(0, advertising + sponsorships + events + digital);
      });

      // Calculate expenses series with proper fallbacks
      const expensesSeries = labels.map((_, idx) => {
        const salaries = Number(expenseMonthly?.salaries?.[idx]) || 0;
        const operations = Number(expenseMonthly?.operations?.[idx]) || 0;
        const marketing = Number(expenseMonthly?.marketing?.[idx]) || 0;
        const other = Number(expenseMonthly?.other?.[idx]) || 0;
        return Math.max(0, salaries + operations + marketing + other);
      });

      // Calculate totals with proper type conversion
      const totalRevenue = Number(revSummary?.totalRevenue || revSummary?.totalYTD || 0);
      const totalExpenses = Number(expSummary?.total || 0);
      const netProfit = totalRevenue - totalExpenses;
      const marginPct = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
      const revenueGrowth = Number(revSummary?.avgGrowth || 0);

      // Calculate outstanding invoices
      const outstandingAmount = Array.isArray(invoicesData) ? invoicesData.reduce((sum, inv) => {
        const balance = Number(inv.amount || 0) - Number(inv.paidAmount || 0);
        return sum + (inv.status !== 'PAID' && inv.status !== 'WRITTEN_OFF' && balance > 0 ? balance : 0);
      }, 0) : 0;

      setSummary({
        totalRevenue: Math.max(0, totalRevenue),
        totalExpenses: Math.max(0, totalExpenses),
        netProfit,
        marginPct,
        outstanding: Math.max(0, outstandingAmount),
        revenueGrowth
      });

      setMonthlyTrend({
        labels: labels || [],
        revenue: revenueSeries,
        expenses: expensesSeries,
        profit: revenueSeries.map((value, index) => Math.max(value - (expensesSeries[index] || 0), -999999))
      });

      setTopClients(buildTopClients(Array.isArray(allRevenue) ? allRevenue : []));
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setAdvertisers(Array.isArray(advertisersData) ? advertisersData : []);
      setAdContracts(Array.isArray(adContractsData) ? adContractsData : []);
      setAirtimes(Array.isArray(airtimesData) ? airtimesData : []);
      setPayrollSummary(payrollSummaryData || null);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setUpcomingPayments(buildUpcomingPayments(Array.isArray(invoicesData) ? invoicesData : []));
      setFinancialData(finData);
      setBudgetSummary(budgetSummaryData || null);
      setBankEntries(Array.isArray(bankEntriesData) ? bankEntriesData : []);
      setTaxSummary(taxSummaryData || null);
      setTaxItems(Array.isArray(taxItemsData) ? taxItemsData : []);
      setAssetSummary(assetSummaryData || null);
      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setRateCards(Array.isArray(rateCardsData) ? rateCardsData : []);
      setAnalyticsOverview(analyticsOverviewData || null);
      setExpenseMonthlyData(expenseMonthly || null);
      setRevenueMonthlyData(revenueMonthly || null);

      if (isStationManager) {
        const token = localStorage.getItem('authToken');
        if (token) {
          const headers = { Authorization: `Bearer ${token}` };
          const usersData = await fetchWithFallback(() => axios.get(`${API_URL}/users`, { headers }).then(r => r.data), []);
          const historyData = await fetchWithFallback(() => axios.get(`${API_URL}/login-history`, { headers }).then(r => r.data), []);

          setStationUsers(Array.isArray(usersData) ? usersData : []);
          setLoginHistory(Array.isArray(historyData) ? historyData : []);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set minimal defaults
      setSummary({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        marginPct: 0,
        outstanding: 0,
        revenueGrowth: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleContractsUpdated = () => loadData();
    window.addEventListener('contractsUpdated', handleContractsUpdated);
    return () => window.removeEventListener('contractsUpdated', handleContractsUpdated);
  }, []);

  useEffect(() => {
    if (loading || !monthlyTrend.labels || monthlyTrend.labels.length === 0) return;

    const requiredRefs = [
      lineRef,
      pieRef,
      profitRef,
      expensePieRef,
      moduleHealthRef,
      recentActivityRef,
      bookingsRef,
      advertisersRef,
      payrollRef,
      adContractsRef,
      monthlyExpenseRef,
      budgetActualRef,
      quarterlyForecastRef,
      revenueCompositionRef,
    ];

    if (isStationManager) {
      requiredRefs.push(invoiceStatusRef, userActivityRef);
    }

    if (isFinanceOfficer) {
      requiredRefs.push(revenueSourcesRef, cashFlowRef, assetLiabilityRef);
    }

    if (requiredRefs.some(ref => !ref.current)) return;

    try {
      // Revenue vs Expenses Trend Line Chart
      lineChart.current?.destroy();
      lineChart.current = new Chart(lineRef.current, {
        type: 'line',
        data: {
          labels: monthlyTrend.labels,
          datasets: [
            {
              label: 'Revenue',
              data: monthlyTrend.revenue && monthlyTrend.revenue.length > 0 ? monthlyTrend.revenue : new Array(monthlyTrend.labels.length).fill(0),
              borderColor: '#f5c518',
              backgroundColor: 'rgba(245,197,24,0.06)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#f5c518',
              pointRadius: 5,
              borderWidth: 2.5
            },
            {
              label: 'Expenses',
              data: monthlyTrend.expenses && monthlyTrend.expenses.length > 0 ? monthlyTrend.expenses : new Array(monthlyTrend.labels.length).fill(0),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.04)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#ef4444',
              pointRadius: 5,
              borderWidth: 2.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
            tooltip: {
              backgroundColor: '#141f35',
              borderColor: '#1e2e48',
              borderWidth: 1,
              titleColor: '#eef2f8',
              bodyColor: '#8ba0bc',
              callbacks: { label: ctx => ` LSL ${Number(ctx.parsed.y || 0).toLocaleString()}` }
            }
          },
          scales: {
            x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
            y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, min: 0 }
          }
        }
      });

      // Top Clients Pie Chart
      pieChart.current?.destroy();
      if (topClients && topClients.length > 0) {
        pieChart.current = new Chart(pieRef.current, {
          type: 'pie',
          data: {
            labels: topClients.map(c => c.name),
            datasets: [{
              data: topClients.map(c => Number(c.amount || 0)),
              backgroundColor: ['#f5c518', '#c49b10', '#8a6d0a', '#4a6080', '#263d60'],
              borderColor: '#141f35',
              borderWidth: 2,
              hoverOffset: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#141f35',
                borderColor: '#1e2e48',
                borderWidth: 1,
                titleColor: '#eef2f8',
                bodyColor: '#8ba0bc',
                callbacks: { label: ctx => `${ctx.label}: ${lsl(ctx.parsed)}` }
              }
            }
          }
        });
      }

      // Profit Trend Chart
      profitChart.current?.destroy();
      const profitData = monthlyTrend.profit && monthlyTrend.profit.length > 0 ? monthlyTrend.profit : new Array(monthlyTrend.labels.length).fill(0);
      profitChart.current = new Chart(profitRef.current, {
        type: 'bar',
        data: {
          labels: monthlyTrend.labels,
          datasets: [{
            label: 'Net Profit',
            data: profitData,
            backgroundColor: profitData.map(v => v >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'),
            borderColor: profitData.map(v => v >= 0 ? '#22c55e' : '#ef4444'),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#141f35',
              borderColor: '#1e2e48',
              borderWidth: 1,
              titleColor: '#eef2f8',
              bodyColor: '#8ba0bc',
              callbacks: { label: ctx => `Profit: LSL ${Number(ctx.parsed.y || 0).toLocaleString()}` }
            }
          },
          scales: {
            x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
            y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } }
          }
        }
      });

      // Expense Breakdown Pie
      expensePieChart.current?.destroy();
      if (financialData?.incomeStatement?.expenses && Array.isArray(financialData.incomeStatement.expenses) && financialData.incomeStatement.expenses.length > 0) {
        expensePieChart.current = new Chart(expensePieRef.current, {
          type: 'doughnut',
          data: {
            labels: financialData.incomeStatement.expenses.map(e => e.name),
            datasets: [{
              data: financialData.incomeStatement.expenses.map(e => Number(e.amount || 0)),
              backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
              borderColor: '#141f35',
              borderWidth: 2,
              hoverOffset: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: {
                backgroundColor: '#141f35',
                borderColor: '#1e2e48',
                borderWidth: 1,
                titleColor: '#eef2f8',
                bodyColor: '#8ba0bc',
                callbacks: { label: ctx => `${ctx.label}: ${lsl(ctx.parsed)}` }
              }
            }
          }
        });
      }

      // Revenue Sources Chart (Finance Officer)
      revenueSourcesChart.current?.destroy();
      if (revenueSourcesRef.current && isFinanceOfficer && financialData?.incomeStatement?.revenue && Array.isArray(financialData.incomeStatement.revenue) && financialData.incomeStatement.revenue.length > 0) {
        revenueSourcesChart.current = new Chart(revenueSourcesRef.current, {
          type: 'pie',
          data: {
            labels: financialData.incomeStatement.revenue.map(r => r.name),
            datasets: [{
              data: financialData.incomeStatement.revenue.map(r => Number(r.amount || 0)),
              backgroundColor: ['#f5c518', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
              borderColor: '#141f35',
              borderWidth: 2,
              hoverOffset: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: {
                backgroundColor: '#141f35',
                borderColor: '#1e2e48',
                borderWidth: 1,
                titleColor: '#eef2f8',
                bodyColor: '#8ba0bc',
                callbacks: { label: ctx => `${ctx.label}: ${lsl(ctx.parsed)}` }
              }
            }
          }
        });
      }

      // Cash Flow Trend Chart (Finance Officer)
      cashFlowChart.current?.destroy();
      if (cashFlowRef.current && isFinanceOfficer && financialData?.cashFlowData) {
        const cashFlowData = financialData.cashFlowData;
        cashFlowChart.current = new Chart(cashFlowRef.current, {
          type: 'line',
          data: {
            labels: cashFlowData.labels || [],
            datasets: [
              {
                label: 'Operating Cash Flow',
                data: cashFlowData.operating && Array.isArray(cashFlowData.operating) ? cashFlowData.operating : [],
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#22c55e',
                pointRadius: 4,
                borderWidth: 2
              },
              {
                label: 'Investing Cash Flow',
                data: cashFlowData.investing && Array.isArray(cashFlowData.investing) ? cashFlowData.investing : [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 4,
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: {
                backgroundColor: '#141f35',
                borderColor: '#1e2e48',
                borderWidth: 1,
                titleColor: '#eef2f8',
                bodyColor: '#8ba0bc',
                callbacks: { label: ctx => ` LSL ${Number(ctx.parsed.y || 0).toLocaleString()}` }
              }
            },
            scales: {
              x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
              y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } }
            }
          }
        });
      }

      // Booking Status
      bookingsChart.current?.destroy();
      if (bookingsRef.current) {
        const statusCounts = bookings.reduce((acc, booking) => {
          const status = booking.status || 'Pending';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        const labels = Object.keys(statusCounts);
        bookingsChart.current = new Chart(bookingsRef.current, {
          type: 'doughnut',
          data: {
            labels: labels.length ? labels : ['No bookings'],
            datasets: [{
              data: labels.length ? Object.values(statusCounts) : [1],
              backgroundColor: ['#22c55e', '#f97316', '#60a5fa', '#ef4444', '#a855f7'],
              borderColor: '#141f35',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} booking(s)` } }
            }
          }
        });
      }

      // Top Advertisers
      advertisersChart.current?.destroy();
      if (advertisersRef.current) {
        const topAdvertisers = [...advertisers]
          .map(advertiser => ({
            name: advertiser.name || advertiser.client || 'Unknown',
            value: Number(advertiser.billed || advertiser.totalBilled || advertiser.amount || advertiser.campaigns || 0)
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);
        advertisersChart.current = new Chart(advertisersRef.current, {
          type: 'bar',
          data: {
            labels: topAdvertisers.length ? topAdvertisers.map(item => item.name) : ['No advertisers'],
            datasets: [{
              label: 'Billed / Activity',
              data: topAdvertisers.length ? topAdvertisers.map(item => item.value) : [0],
              backgroundColor: 'rgba(34,197,94,0.78)',
              borderColor: '#22c55e',
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: ctx => lsl(ctx.parsed.x || 0) } }
            },
            scales: {
              x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } },
              y: { grid: { display: false }, ticks: { color: '#8ba0bc' } }
            }
          }
        });
      }

      // User Login Activity (Station Manager)
      userActivityChart.current?.destroy();
      if (userActivityRef.current && isStationManager) {
        const loginEvents = Array.isArray(loginHistory) ? loginHistory.map(entry => ({
          date: entry.createdAt ? new Date(entry.createdAt).toISOString().slice(0, 10) : 'Unknown',
          status: entry.status || 'UNKNOWN'
        })) : [];

        const dates = [...new Set(loginEvents.map(event => event.date))].sort();
        const statuses = [...new Set(loginEvents.map(event => event.status))];

        const statusSeries = statuses.map(status => ({
          status,
          data: dates.map(date => loginEvents.filter(event => event.date === date && event.status === status).length)
        }));

        const activeDates = dates.length ? dates : ['No activity'];
        const datasets = statusSeries.length ? statusSeries.map((series, index) => ({
          label: series.status,
          data: series.data,
          backgroundColor: ['#22c55e', '#ef4444', '#f97316', '#3b82f6', '#a855f7'][index % 5],
          borderColor: '#141f35',
          borderWidth: 1,
          borderRadius: 4
        })) : [{ label: 'No activity', data: [0], backgroundColor: '#4a6080', borderColor: '#141f35', borderWidth: 1 }];

        userActivityChart.current = new Chart(userActivityRef.current, {
          type: 'bar',
          data: {
            labels: activeDates,
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: {
                callbacks: {
                  label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y || 0}`
                }
              }
            },
            scales: {
              x: { stacked: true, grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
              y: { stacked: true, grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', precision: 0 }, min: 0 }
            }
          }
        });
      }

      // Payroll Status
      payrollChart.current?.destroy();
      if (payrollRef.current) {
        const paid = Number(payrollSummary?.paid || 0);
        const pending = Number(payrollSummary?.pending || 0);
        const employeeCount = Number(payrollSummary?.employeeCount || 0);
        const other = Math.max(0, employeeCount - paid - pending);
        payrollChart.current = new Chart(payrollRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Paid', 'Pending', 'Other'],
            datasets: [{
              data: employeeCount ? [paid, pending, other] : [0, 0, 0],
              backgroundColor: ['#22c55e', '#f97316', '#4a6080'],
              borderColor: '#141f35',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} employee(s)` } }
            }
          }
        });
      }

      // Contract Type Distribution for Ad Contracts + Airtime
      adContractsChart.current?.destroy();
      if (adContractsRef.current) {
        const typeCounts = [...adContracts.map(contract => ({ type: contract.type || 'Ad Contract' })), ...airtimes.map(entry => ({ type: entry.type || 'Airtime Booking' }))]
          .reduce((acc, item) => {
            const type = item.type || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
        const labels = Object.keys(typeCounts);
        const values = labels.map(type => typeCounts[type]);

        adContractsChart.current = new Chart(adContractsRef.current, {
          type: 'bar',
          data: {
            labels: labels.length ? labels : ['No contracts'],
            datasets: [{
              label: 'Contract Count',
              data: labels.length ? values : [0],
              backgroundColor: ['rgba(245,197,24,0.82)', 'rgba(34,197,94,0.78)', 'rgba(249,115,22,0.78)', 'rgba(239,68,68,0.78)', 'rgba(59,130,246,0.78)'],
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.y || 0} contracts` } }
            },
            scales: {
              x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
              y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' }, min: 0 }
            }
          }
        });
      }

      // Module Data Health
      moduleHealthChart.current?.destroy();
      const moduleHealthRowsData = [
        {
          module: 'Invoices',
          metric: `${paidInvoiceCount}/${invoiceCount} paid`,
          value: lsl(summary.outstanding),
          status: summary.outstanding > 0 ? 'Monitor' : 'On Track'
        },
        {
          module: 'Secure Ledger',
          metric: `${securedInvoiceCount}/${invoiceCount} secured`,
          value: `${invoiceCount ? Math.round((securedInvoiceCount / invoiceCount) * 100) : 100}%`,
          status: securedInvoiceCount === invoiceCount ? 'On Track' : 'Watch'
        },
        {
          module: 'Budget',
          metric: `${budgetTotals.utilization || 0}% used`,
          value: lsl(budgetTotals.remaining || 0),
          status: (budgetTotals.utilization || 0) >= 100 ? 'Over budget' : (budgetTotals.utilization || 0) >= 90 ? 'Watch' : 'On Track'
        },
        {
          module: 'Bank Reconciliation',
          metric: `${bankReconciliationRate}% matched`,
          value: lsl(bankUnmatchedValue),
          status: bankReconciliationRate >= 95 ? 'On Track' : 'Watch'
        },
        {
          module: 'Tax & Compliance',
          metric: `${complianceScore}% compliant`,
          value: lsl(taxDue + taxOverdue),
          status: taxOverdue > 0 || complianceScore < 80 ? 'Over budget' : complianceScore < 95 ? 'Watch' : 'On Track'
        },
        {
          module: 'Assets',
          metric: `${assets.length} assets`,
          value: lsl(assetValue),
          status: 'On Track'
        },
        {
          module: 'Rate Card',
          metric: `${activeRates} active rates`,
          value: `${rateCards.length} total`,
          status: activeRates > 0 ? 'On Track' : 'Watch'
        }
      ];
      const moduleHealthScoreMap = { 'On Track': 4, Watch: 3, Monitor: 2, 'Over budget': 1 };
      if (moduleHealthRef.current) {
        moduleHealthChart.current = new Chart(moduleHealthRef.current, {
          type: 'bar',
          data: {
            labels: moduleHealthRowsData.map(r => r.module),
            datasets: [{
              label: 'Module Health',
              data: moduleHealthRowsData.map(r => moduleHealthScoreMap[r.status] || 0),
              backgroundColor: moduleHealthRowsData.map(r => r.status === 'On Track' ? '#22c55e' : r.status === 'Watch' ? '#f97316' : r.status === 'Monitor' ? '#f59e0b' : '#ef4444'),
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#141f35'
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => {
                    const row = moduleHealthRowsData[ctx.dataIndex] || {};
                    return `${row.module}: ${row.status} — ${row.metric} (${row.value})`;
                  }
                }
              }
            },
            scales: {
              x: {
                min: 0,
                max: 4,
                ticks: {
                  color: '#8ba0bc',
                  callback: v => {
                    if (v === 0) return 'Low';
                    if (v === 1) return 'Poor';
                    if (v === 2) return 'Monitor';
                    if (v === 3) return 'Watch';
                    if (v === 4) return 'On Track';
                    return '';
                  }
                },
                grid: { color: '#1e2e48' }
              },
              y: { ticks: { color: '#8ba0bc' }, grid: { display: false } }
            }
          }
        });
      }

      // Recent Cross-Module Activity
      recentActivityChart.current?.destroy();
      const recentOperationalRowsData = [
        ...invoices.slice(0, 3).map(item => ({ type: 'Invoice', label: item.client, amount: item.amount, status: item.status, date: item.issue || item.createdAt })),
        ...bookings.slice(0, 3).map(item => ({ type: 'Booking', label: item.client || item.campaign, amount: item.amount || item.spots || 0, status: item.status, date: item.due || item.createdAt })),
        ...taxItems.slice(0, 3).map(item => ({ type: 'Tax', label: item.type, amount: item.amount, status: item.status, date: item.dueDate || item.createdAt })),
        ...bankEntries.slice(0, 3).map(item => ({ type: 'Bank', label: item.description, amount: item.amount, status: item.status, date: item.date || item.createdAt }))
      ]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 8);
      const activityCounts = recentOperationalRowsData.reduce((acc, row) => {
        acc[row.type] = (acc[row.type] || 0) + 1;
        return acc;
      }, {});
      const activityTotals = recentOperationalRowsData.reduce((acc, row) => {
        acc[row.type] = (acc[row.type] || 0) + Number(row.amount || 0);
        return acc;
      }, {});
      const activityLabels = Object.keys(activityCounts).length ? Object.keys(activityCounts) : ['No activity'];
      const activityValues = activityLabels.map(label => activityCounts[label] || 0);
      const activityAmounts = activityLabels.map(label => activityTotals[label] || 0);
      if (recentActivityRef.current) {
        recentActivityChart.current = new Chart(recentActivityRef.current, {
          type: 'bar',
          data: {
            labels: activityLabels,
            datasets: [{
              label: 'Recent Events',
              data: activityValues,
              backgroundColor: ['#3b82f6', '#22c55e', '#f97316', '#a855f7'],
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#141f35'
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => {
                    const amount = activityAmounts[ctx.dataIndex] || 0;
                    return `${ctx.label}: ${ctx.parsed.x || 0} event(s) • ${lsl(amount)}`;
                  }
                }
              }
            },
            scales: {
              x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', precision: 0 } },
              y: { ticks: { color: '#8ba0bc' }, grid: { display: false } }
            }
          }
        });
      }

      // Revenue Composition
      revenueCompositionChart.current?.destroy();
      if (revenueCompositionRef.current) {
        const revenueRows = financialData?.incomeStatement?.revenue?.length
          ? financialData.incomeStatement.revenue.map(item => ({ name: item.name, amount: Number(item.amount || 0) }))
          : [
              { name: 'Advertising', amount: (revenueMonthlyData?.advertising || []).reduce((sum, value) => sum + Number(value || 0), 0) },
              { name: 'Sponsorships', amount: (revenueMonthlyData?.sponsorships || []).reduce((sum, value) => sum + Number(value || 0), 0) },
              { name: 'Events', amount: (revenueMonthlyData?.events || []).reduce((sum, value) => sum + Number(value || 0), 0) },
              { name: 'Digital', amount: (revenueMonthlyData?.digital || []).reduce((sum, value) => sum + Number(value || 0), 0) }
            ].filter(item => item.amount > 0);
        revenueCompositionChart.current = new Chart(revenueCompositionRef.current, {
          type: 'doughnut',
          data: {
            labels: revenueRows.length ? revenueRows.map(item => item.name) : ['No revenue'],
            datasets: [{
              data: revenueRows.length ? revenueRows.map(item => item.amount) : [1],
              backgroundColor: ['#f5c518', '#22c55e', '#60a5fa', '#a855f7', '#f97316'],
              borderColor: '#141f35',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: { callbacks: { label: ctx => `${ctx.label}: ${lsl(ctx.parsed)}` } }
            }
          }
        });
      }

      // Monthly Expense Trend
      monthlyExpenseChart.current?.destroy();
      if (monthlyExpenseRef.current) {
        const expenseLabels = expenseMonthlyData?.labels || monthlyTrend.labels;
        monthlyExpenseChart.current = new Chart(monthlyExpenseRef.current, {
          type: 'bar',
          data: {
            labels: expenseLabels,
            datasets: [
              { label: 'Salaries', data: expenseMonthlyData?.salaries || [], backgroundColor: 'rgba(245,197,24,0.78)', borderRadius: 3 },
              { label: 'Operations', data: expenseMonthlyData?.operations || [], backgroundColor: 'rgba(249,115,22,0.78)', borderRadius: 3 },
              { label: 'Marketing', data: expenseMonthlyData?.marketing || [], backgroundColor: 'rgba(96,165,250,0.78)', borderRadius: 3 },
              { label: 'Other', data: expenseMonthlyData?.other || [], backgroundColor: 'rgba(168,85,247,0.78)', borderRadius: 3 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${lsl(ctx.parsed.y || 0)}` } }
            },
            scales: {
              x: { stacked: true, grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
              y: { stacked: true, grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, min: 0 }
            }
          }
        });
      }

      // Budget vs Actual
      budgetActualChart.current?.destroy();
      if (budgetActualRef.current && budgetSummary?.budgetVsActual) {
        budgetActualChart.current = new Chart(budgetActualRef.current, {
          type: 'bar',
          data: {
            labels: budgetSummary.budgetVsActual.labels || [],
            datasets: [
              { label: 'Budget', data: budgetSummary.budgetVsActual.budget || [], backgroundColor: 'rgba(74,96,128,0.55)', borderRadius: 3 },
              { label: 'Actual', data: budgetSummary.budgetVsActual.actual || [], backgroundColor: 'rgba(245,197,24,0.82)', borderRadius: 3 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${lsl(ctx.parsed.y || 0)}` } }
            },
            scales: {
              x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
              y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, min: 0 }
            }
          }
        });
      }

      // Quarterly Forecast
      quarterlyForecastChart.current?.destroy();
      if (quarterlyForecastRef.current && budgetSummary?.quarterlyForecast) {
        quarterlyForecastChart.current = new Chart(quarterlyForecastRef.current, {
          type: 'line',
          data: {
            labels: budgetSummary.quarterlyForecast.labels || [],
            datasets: [
              { label: 'Budget', data: budgetSummary.quarterlyForecast.budget || [], borderColor: '#4a6080', borderDash: [5, 4], tension: 0.3, fill: false },
              { label: 'Actual', data: budgetSummary.quarterlyForecast.actual || [], borderColor: '#f5c518', tension: 0.3, fill: false },
              { label: 'Forecast', data: budgetSummary.quarterlyForecast.forecast || [], borderColor: '#60a5fa', borderDash: [3, 3], tension: 0.3, fill: false }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${lsl(ctx.parsed.y || 0)}` } }
            },
            scales: {
              x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
              y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, min: 0 }
            }
          }
        });
      }

      // Invoice Status Chart (Station Manager)
      invoiceStatusChart.current?.destroy();
      if (invoiceStatusRef.current && isStationManager && invoices && invoices.length > 0) {
        const statusCounts = invoices.reduce((acc, invoice) => {
          acc[invoice.status || 'DRAFT'] = (acc[invoice.status || 'DRAFT'] || 0) + 1;
          return acc;
        }, {});

        invoiceStatusChart.current = new Chart(invoiceStatusRef.current, {
          type: 'doughnut',
          data: {
            labels: Object.keys(statusCounts),
            datasets: [{
              data: Object.values(statusCounts),
              backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
              borderColor: '#141f35',
              borderWidth: 2,
              hoverOffset: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } },
              tooltip: {
                backgroundColor: '#141f35',
                borderColor: '#1e2e48',
                borderWidth: 1,
                titleColor: '#eef2f8',
                bodyColor: '#8ba0bc',
                callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} invoices` }
              }
            }
          }
        });
      }

      // Asset vs Liability Chart (Finance Officer)
      assetLiabilityChart.current?.destroy();
      if (assetLiabilityRef.current && isFinanceOfficer && financialData?.balanceSheet) {
        const balanceSheet = financialData.balanceSheet;
        assetLiabilityChart.current = new Chart(assetLiabilityRef.current, {
          type: 'bar',
          data: {
            labels: ['Assets', 'Liabilities', 'Equity'],
            datasets: [{
              label: 'Amount',
              data: [
                Number(balanceSheet.totalAssets || 0),
                Number(balanceSheet.totalLiabilities || 0),
                Number(balanceSheet.ownersEquity || 0)
              ],
              backgroundColor: ['#22c55e', '#ef4444', '#3b82f6'],
              borderColor: '#141f35',
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#141f35',
                borderColor: '#1e2e48',
                borderWidth: 1,
                titleColor: '#eef2f8',
                bodyColor: '#8ba0bc',
                callbacks: { label: ctx => `${ctx.label}: LSL ${Number(ctx.parsed.y || 0).toLocaleString()}` }
              }
            },
            scales: {
              x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
              y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  }, [
    monthlyTrend,
    topClients,
    upcomingPayments,
    invoices,
    financialData,
    isFinanceOfficer,
    isStationManager,
    loginHistory,
    bookings,
    advertisers,
    adContracts,
    payrollSummary,
    budgetSummary,
    expenseMonthlyData,
    revenueMonthlyData,
    loading
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lineChart.current?.destroy();
      pieChart.current?.destroy();
      profitChart.current?.destroy();
      expensePieChart.current?.destroy();
      revenueSourcesChart.current?.destroy();
      cashFlowChart.current?.destroy();
      invoiceStatusChart.current?.destroy();
      assetLiabilityChart.current?.destroy();
      userActivityChart.current?.destroy();
      revenueCompositionChart.current?.destroy();
      moduleHealthChart.current?.destroy();
      recentActivityChart.current?.destroy();
      bookingsChart.current?.destroy();
      advertisersChart.current?.destroy();
      payrollChart.current?.destroy();
      adContractsChart.current?.destroy();
      monthlyExpenseChart.current?.destroy();
      budgetActualChart.current?.destroy();
      quarterlyForecastChart.current?.destroy();
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard data...</div>;
  }

  const cashFlowData = financialData?.cashFlowData || {};
  const operatingCashFlow = Array.isArray(cashFlowData.operating) ? cashFlowData.operating : [];
  const investingCashFlow = Array.isArray(cashFlowData.investing) ? cashFlowData.investing : [];
  const balanceSheet = financialData?.balanceSheet || {};
  const operatingCashFlowTotal = operatingCashFlow.reduce((acc, value) => acc + Number(value || 0), 0);
  const bookingCount = bookings.length;
  const advertiserCount = advertisers.length;
  const payrollGross = payrollSummary?.totalGross || 0;
  const totalContracts = adContracts.length;
  const airtimeCount = airtimes.length;
  const airtimeDurationTotal = airtimes.reduce((sum, airtime) => sum + Number(airtime.duration || 0), 0);
  const contractValueTotal = adContracts.reduce((sum, contract) => sum + Number(contract.amount || 0), 0);
  const combinedContractTypeCounts = [...adContracts.map(contract => ({ type: contract.type || 'Ad Contract' })), ...airtimes.map(entry => ({ type: entry.type || 'Airtime Booking' }))]
    .reduce((acc, item) => {
      const type = item.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  const contractTypeLabels = Object.keys(combinedContractTypeCounts);
  const contractTypeValues = contractTypeLabels.map(type => combinedContractTypeCounts[type]);
  const budgetTotals = budgetSummary?.budgetSummary || { total: 0, spent: 0, remaining: 0, utilization: 0 };
  const bankMatchedCount = bankEntries.filter(entry => entry.status === 'MATCHED').length;
  const bankReconciliationRate = bankEntries.length ? Math.round((bankMatchedCount / bankEntries.length) * 100) : 100;
  const bankUnmatchedValue = bankEntries
    .filter(entry => entry.status !== 'MATCHED')
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const taxDue = Number(taxSummary?.totalDue || 0);
  const taxOverdue = Number(taxSummary?.totalOverdue || 0);
  const complianceScore = Number(taxSummary?.complianceScore ?? 100);
  const assetValue = Number(assetSummary?.totalNBV || assets.reduce((sum, asset) => sum + Number(asset.netBook || 0), 0));
  const depreciationTotal = Number(assetSummary?.totalAccum || 0);
  const activeRates = rateCards.filter(rate => rate.status !== 'Inactive').length || rateCards.length;
  const invoiceCount = invoices.length;
  const paidInvoiceCount = invoices.filter(invoice => invoice.status === 'PAID').length;
  const securedInvoiceCount = invoices.filter(invoice => invoice.blockchainLedgerTip).length;
  const analyticsHealth = analyticsOverview?.summary || analyticsOverview || null;
  const financeSummary = analyticsOverview?.financeSummary || {};
  const arAging = Array.isArray(analyticsOverview?.arAging) ? analyticsOverview.arAging : [];
  const expenseCategoriesOverview = Array.isArray(analyticsOverview?.expenseCategories) ? analyticsOverview.expenseCategories : [];
  const forecastSummary = analyticsOverview?.forecastSummary || {};
  const moduleHealthRows = [
    {
      module: 'Invoices',
      metric: `${paidInvoiceCount}/${invoiceCount} paid`,
      value: lsl(summary.outstanding),
      status: summary.outstanding > 0 ? 'Monitor' : 'On Track'
    },
    {
      module: 'Secure Ledger',
      metric: `${securedInvoiceCount}/${invoiceCount} secured`,
      value: `${invoiceCount ? Math.round((securedInvoiceCount / invoiceCount) * 100) : 100}%`,
      status: securedInvoiceCount === invoiceCount ? 'On Track' : 'Watch'
    },
    {
      module: 'Budget',
      metric: `${budgetTotals.utilization || 0}% used`,
      value: lsl(budgetTotals.remaining || 0),
      status: (budgetTotals.utilization || 0) >= 100 ? 'Over budget' : (budgetTotals.utilization || 0) >= 90 ? 'Watch' : 'On Track'
    },
    {
      module: 'Bank Reconciliation',
      metric: `${bankReconciliationRate}% matched`,
      value: lsl(bankUnmatchedValue),
      status: bankReconciliationRate >= 95 ? 'On Track' : 'Watch'
    },
    {
      module: 'Tax & Compliance',
      metric: `${complianceScore}% compliant`,
      value: lsl(taxDue + taxOverdue),
      status: taxOverdue > 0 || complianceScore < 80 ? 'Over budget' : complianceScore < 95 ? 'Watch' : 'On Track'
    },
    {
      module: 'Assets',
      metric: `${assets.length} assets`,
      value: lsl(assetValue),
      status: 'On Track'
    },
    {
      module: 'Rate Card',
      metric: `${activeRates} active rates`,
      value: `${rateCards.length} total`,
      status: activeRates > 0 ? 'On Track' : 'Watch'
    }
  ];
  const recentOperationalRows = [
    ...invoices.slice(0, 3).map(item => ({ type: 'Invoice', label: item.client, amount: item.amount, status: item.status, date: item.issue || item.createdAt })),
    ...bookings.slice(0, 3).map(item => ({ type: 'Booking', label: item.client || item.campaign, amount: item.amount || item.spots || 0, status: item.status, date: item.due || item.createdAt })),
    ...taxItems.slice(0, 3).map(item => ({ type: 'Tax', label: item.type, amount: item.amount, status: item.status, date: item.dueDate || item.createdAt })),
    ...bankEntries.slice(0, 3).map(item => ({ type: 'Bank', label: item.description, amount: item.amount, status: item.status, date: item.date || item.createdAt }))
  ]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 8);

  return (
    <div className="page">
      <div style={{ marginBottom: 22 }}>
        <h1 className="page-h">
          {isStationManager ? 'Executive Overview' : isFinanceOfficer ? 'Finance Manager Dashboard' : 'Financial Dashboard'}
        </h1>
        <p className="page-sub">
          {isStationManager
            ? 'Full station performance across finance, approvals, operations and commercial activity'
            : isFinanceOfficer
            ? 'Comprehensive financial analysis with P&L, balance sheet, and cash flow insights'
            : 'Live financial KPIs sourced from the database'}
        </p>
      </div>

      <div className="dashboard-hero">
        <div className="dashboard-hero__details">
          <span className="dashboard-hero__chip">Finance Manager</span>
          <h2>Luxury financial insights designed for fast, confident decisions.</h2>
          <p>Deploy elegant charts, premium revenue intelligence, and high-value metrics across every station finance workflow.</p>
          <div className="dashboard-hero__badges">
            <span className="dashboard-hero__badge">Gold-rated KPI panel</span>
            <span className="dashboard-hero__badge">Cash flow momentum</span>
            <span className="dashboard-hero__badge">Expense heatmap</span>
            <span className="dashboard-hero__badge">Revenue trend intelligence</span>
          </div>
        </div>
        <div className="dashboard-hero__image">
          <img src={dashboardAccent} alt="Premium finance dashboard visual" />
        </div>
      </div>

      <div className="dashboard-gallery" style={{ marginBottom: 22 }}>
        <div className="dashboard-image-card">
          <img src={financeDash1} alt="Finance dashboard snapshot 1" />
          <div className="dashboard-image-card__caption">Revenue growth spotlight</div>
        </div>
        <div className="dashboard-image-card">
          <img src={financeDash2} alt="Finance dashboard snapshot 2" />
          <div className="dashboard-image-card__caption">Cash flow and profit view</div>
        </div>
        <div className="dashboard-image-card">
          <img src={financeDash3} alt="Finance dashboard snapshot 3" />
          <div className="dashboard-image-card__caption">Expense and margin analysis</div>
        </div>
      </div>

      <div className="dashboard-metric-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__content">
            <h4>Monthly Recurring Revenue</h4>
            <div className="value">{lsl(summary.totalRevenue / 12)}</div>
            <div className="dashboard-metric-trend">+{summary.revenueGrowth}% YoY</div>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__content">
            <h4>Cash Burn Rate</h4>
            <div className="value">{lsl(summary.totalExpenses / 12)}</div>
            <div className="dashboard-metric-trend">{((summary.totalExpenses / 12 / (summary.totalRevenue / 12)) * 100).toFixed(1)}% of MRR</div>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__content">
            <h4>Profitability Index</h4>
            <div className="value">{(summary.marginPct > 0 ? summary.marginPct : 0).toFixed(1)}%</div>
            <div className="dashboard-metric-trend" style={{ color: summary.marginPct > 30 ? 'var(--green)' : 'var(--orange)' }}>
              {summary.marginPct > 30 ? 'Excellent' : summary.marginPct > 15 ? 'Healthy' : 'Monitor'}
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__content">
            <h4>Receivables Days</h4>
            <div className="value">{summary.outstanding > 0 ? Math.ceil(summary.outstanding / (summary.totalRevenue / 365)) : 0}</div>
            <div className="dashboard-metric-trend">days outstanding</div>
          </div>
        </div>
      </div>

      {analyticsOverview && (
        <>
          <div className="g4" style={{ marginBottom: 20 }}>
            <KPI title="Cash Position" value={lsl(financeSummary.cashPosition || 0)} sub="Available cash after payables" icon={DollarSign} accent="var(--green)" />
            <KPI title="Working Capital" value={lsl(financeSummary.workingCapital || 0)} sub="Receivables + cash - payables" icon={Users} accent="var(--gold)" />
            <KPI title="Cash Runway" value={`${financeSummary.cashRunwayMonths || 0} months`} sub="Projected coverage" icon={BarChart3} accent="var(--blue)" />
            <KPI title="Receivables Outstanding" value={lsl(financeSummary.receivablesOutstanding || 0)} sub="Uncollected invoice balance" icon={AlertCircle} accent="var(--red)" />
          </div>

          <div className="g2" style={{ marginBottom: 20 }}>
            <div className="card dashboard-card--premium">
              <div className="sec-head"><span className="sec-title">Expense Categories</span></div>
              <div style={{ padding: '18px 20px' }}>
                {expenseCategoriesOverview.length > 0 ? (
                  expenseCategoriesOverview.slice(0, 5).map((category) => (
                    <div key={category.category} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>{category.category}</span>
                        <span>{category.usage}%</span>
                      </div>
                      <div className="prog" style={{ height: 8, borderRadius: 6, background: 'var(--bg-hover)' }}>
                        <div className="prog-fill" style={{ width: `${Math.min(100, category.usage)}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        <span>{lsl(category.actual)}</span>
                        <span>Budget {lsl(category.budget)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Expense category details unavailable.</div>
                )}
              </div>
            </div>

            <div className="card dashboard-card--premium">
              <div className="sec-head"><span className="sec-title">AR Aging</span></div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  {arAging.slice(0, 4).map((bucket) => (
                    <div key={bucket.bucket} style={{ padding: 12, borderRadius: 12, background: 'var(--bg-hover)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{bucket.bucket}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{lsl(bucket.amount)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>{bucket.count || 0} invoices</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card dashboard-card--premium" style={{ marginBottom: 20 }}>
            <div className="sec-head"><span className="sec-title">Next Quarter Projection</span></div>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
                <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-hover)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Revenue</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{lsl(forecastSummary.nextQuarterRevenue || 0)}</div>
                </div>
                <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-hover)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Expenses</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{lsl(forecastSummary.nextQuarterExpenses || 0)}</div>
                </div>
                <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-hover)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Projected Profit</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{lsl(forecastSummary.projectedProfit || 0)}</div>
                </div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>This projection is based on the latest momentum from revenue and expense trends, and helps highlight spend vs cash coverage.</div>
            </div>
          </div>
        </>
      )}

      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Bookings" value={bookingCount} sub="Total campaign bookings" icon={BarChart3} accent="var(--blue)" />
        <KPI title="Advertisers" value={advertiserCount} sub="Active partners" icon={Users} accent="var(--green)" />
        <KPI title="Payroll Spend" value={lsl(payrollGross)} sub={`Current payroll ${payrollSummary?.month || ''}`} icon={DollarSign} accent="var(--gold)" />
        <KPI title="Ad Contracts" value={lsl(contractValueTotal)} sub={`${totalContracts} contracts`} icon={FileText} accent="var(--orange)" />
      </div>

      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Airtime Bookings" value={airtimeCount} sub="Live airtime requests" icon={Clock} accent="var(--purple)" />
        <KPI title="Airtime Duration" value={`${airtimeDurationTotal} min`} sub="Scheduled airtime" icon={BarChart3} accent="var(--blue)" />
        <KPI title="Contract Types" value={`${contractTypeLabels.length}`} sub="Ad + airtime categories" icon={FileText} accent="var(--gold)" />
        <KPI title="Contract Count" value={`${totalContracts + airtimeCount}`} sub="Total contracts" icon={TrendingUp} accent="var(--green)" />
      </div>

      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Budget Remaining" value={lsl(budgetTotals.remaining || 0)} sub={`${budgetTotals.utilization || 0}% utilized`} icon={PieChart} accent="var(--blue)" />
        <KPI title="Bank Matched" value={`${bankReconciliationRate}%`} sub={`${bankEntries.length - bankMatchedCount} unmatched entries`} icon={BarChart3} accent="var(--green)" />
        <KPI title="Tax Due" value={lsl(taxDue + taxOverdue)} sub={`${complianceScore}% compliance score`} icon={AlertCircle} accent={taxOverdue > 0 ? 'var(--red)' : 'var(--gold)'} />
        <KPI title="Net Asset Value" value={lsl(assetValue)} sub={`${lsl(depreciationTotal)} accumulated depreciation`} icon={TrendingUp} accent="var(--teal)" />
      </div>

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Module Data Health</span></div>
          <div style={{ height: 320 }} className="chart-card-glow"><canvas ref={moduleHealthRef} /></div>
        </div>
        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Recent Cross-Module Activity</span></div>
          <div style={{ height: 320 }} className="chart-card-glow"><canvas ref={recentActivityRef} /></div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Booking Status</span></div>
          <div style={{ height: 300 }} className="chart-card-glow"><canvas ref={bookingsRef} /></div>
        </div>
        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Top Advertisers</span></div>
          <div style={{ height: 300 }} className="chart-card-glow"><canvas ref={advertisersRef} /></div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Payroll Status</span></div>
          <div style={{ height: 300 }} className="chart-card-glow"><canvas ref={payrollRef} /></div>
        </div>
        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Contracts by Type</span></div>
          <div style={{ height: 300 }} className="chart-card-glow"><canvas ref={adContractsRef} /></div>
        </div>
      </div>

      <div className="g3" style={{ marginBottom: 20 }}>
        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Monthly Expense Trend</span></div>
          <div style={{ height: 280 }} className="chart-card-glow"><canvas ref={monthlyExpenseRef} /></div>
        </div>
        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Budget vs Actual</span></div>
          <div style={{ height: 280 }} className="chart-card-glow"><canvas ref={budgetActualRef} /></div>
        </div>
        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Quarterly Forecast</span></div>
          <div style={{ height: 280 }} className="chart-card-glow"><canvas ref={quarterlyForecastRef} /></div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="card dashboard-card--premium">
          <div className="sec-head"><span className="sec-title">Revenue Composition</span></div>
          <div style={{ height: 260 }}><canvas ref={revenueCompositionRef} /></div>
        </div>
        <div className="card dashboard-card--premium">
          <div className="sec-head"><span className="sec-title">Liquidity Pulse</span></div>
          <div style={{ padding: '18px 20px' }}>
            <div className="dashboard-summary-box">
              <span>Cash reserves</span>
              <strong>{operatingCashFlow.length ? lsl(operatingCashFlowTotal) : 'Loading'}</strong>
            </div>
            <div className="dashboard-summary-grid">
              <div className="dashboard-summary-box">
                <span>Recent inflows</span>
                <strong>{operatingCashFlow.length ? lsl(operatingCashFlow.slice(-1)[0] || 0) : '-'}</strong>
              </div>
              <div className="dashboard-summary-box">
                <span>Recent outflows</span>
                <strong>{investingCashFlow.length ? lsl(investingCashFlow.slice(-1)[0] || 0) : '-'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Total Revenue" value={lsl(summary.totalRevenue)} trend={`${summary.revenueGrowth}%`} icon={DollarSign} accent="var(--gold)" />
        <KPI title="Total Expenses" value={lsl(summary.totalExpenses)} trend={`${summary.totalExpenses > 0 ? ((summary.totalExpenses / Math.max(summary.totalRevenue, 1)) * 100).toFixed(1) : 0}%`} icon={TrendingDown} accent="var(--red)" />
        <KPI title="Net Profit" value={lsl(summary.netProfit)} sub={`${summary.marginPct}% margin`} icon={TrendingUp} accent="var(--green)" valueColor="var(--green)" />
        <KPI title="Outstanding" value={lsl(summary.outstanding)} sub="Accounts receivable" icon={FileText} accent="var(--orange)" />
      </div>

      <div className="g3" style={{ marginBottom: 20 }}>
        <div className="card dashboard-card--premium">
          <div className="sec-head"><span className="sec-title">Profit Momentum</span></div>
          <div style={{ height: 240 }}><canvas ref={profitRef} /></div>
        </div>
        <div className="card dashboard-card--premium">
          <div className="sec-head"><span className="sec-title">Expense Mix</span></div>
          <div style={{ height: 240 }}><canvas ref={expensePieRef} /></div>
        </div>
        <div className="card dashboard-card--premium">
          <div className="sec-head"><span className="sec-title">Margin Pulse</span></div>
          <div style={{ padding: '18px 0 8px' }}>
            <div className="dashboard-summary-box">
              <span>Current margin</span>
              <strong>{summary.marginPct}%</strong>
            </div>
            <div className="dashboard-summary-grid">
              <div className="dashboard-summary-box">
                <span>Outstanding AR</span>
                <strong>{lsl(summary.outstanding)}</strong>
              </div>
              <div className="dashboard-summary-box">
                <span>Revenue growth</span>
                <strong>{summary.revenueGrowth}%</strong>
              </div>
              <div className="dashboard-summary-box">
                <span>Net profit</span>
                <strong>{lsl(summary.netProfit)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFinanceOfficer && financialData && (
        <div className="g4" style={{ marginBottom: 20 }}>
          <KPI title="Cash Flow" value={lsl(operatingCashFlowTotal)} sub="Operating activities" icon={BarChart3} accent="var(--blue)" />
          <KPI title="Total Assets" value={lsl(balanceSheet.totalAssets || 0)} sub="Current & fixed assets" icon={TrendingUp} accent="var(--green)" />
          <KPI title="Total Liabilities" value={lsl(balanceSheet.totalLiabilities || 0)} sub="Current liabilities" icon={TrendingDown} accent="var(--red)" />
          <KPI title="Owner's Equity" value={lsl(balanceSheet.ownersEquity || 0)} sub="Net worth" icon={DollarSign} accent="var(--gold)" />
        </div>
      )}

      {isStationManager && (
        <div className="g3" style={{ marginBottom: 20 }}>
          <KPI title="Departments Overseen" value="4" sub="Finance, sales, operations, compliance" icon={TrendingUp} accent="var(--blue)" />
          <KPI title="Approval Control" value="Full" sub="Invoices, payments, write-offs and budgets" icon={FileText} accent="var(--gold)" />
          <KPI title="Strategic Focus" value={`${summary.marginPct}%`} sub="Station margin and growth oversight" icon={TrendingUp} accent="var(--green)" />
        </div>
      )}

      {isStationManager && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="sec-head">
            <span className="sec-title">Station Manager Control</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                ['users', Users, 'Users'],
                ['history', Clock, 'Login History']
              ].map(([key, Icon, label]) => (
                <button
                  key={key}
                  className={`tab-btn ${managerTab === key ? 'active' : ''}`}
                  style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setManagerTab(key)}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          {managerTab === 'users' ? (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {stationUsers.map(stationUser => (
                  <tr key={stationUser._id || stationUser.id}>
                    <td><b>{stationUser.name}</b></td>
                    <td>{stationUser.email}</td>
                    <td>{stationUser.role}</td>
                    <td>
                      <span style={{ color: stationUser.isActive ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                        {stationUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{stationUser.lastLogin ? new Date(stationUser.lastLogin).toLocaleString() : 'Never'}</td>
                    <td>{stationUser.createdAt ? new Date(stationUser.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map(entry => (
                  <tr key={entry._id}>
                    <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '-'}</td>
                    <td><b>{entry.name || 'Unknown'}</b></td>
                    <td>{entry.email}</td>
                    <td>{entry.role || '-'}</td>
                    <td>
                      <span style={{ color: entry.status === 'SUCCESS' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                        {entry.status}
                      </span>
                    </td>
                    <td>{entry.reason || '-'}</td>
                    <td>{entry.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Revenue vs Expenses (12 Months)</span></div>
          <div style={{ height: 280 }} className="chart-card-glow"><canvas ref={lineRef} /></div>
        </div>

        <div className="dashboard-chart-panel">
          <div className="sec-head"><span className="sec-title">Top Clients by Revenue</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: '0 0 200px', height: 200 }} className="chart-card-glow"><canvas ref={pieRef} /></div>
            <div style={{ flex: 1 }}>
              {topClients.map(c => (
                <div key={c.name} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                    <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{lsl(c.amount)}</span>
                  </div>
                  <div className="prog" style={{ height: 7, borderRadius: 6 }}>
                    <div className="prog-fill" style={{ width: `${Math.min(100, (c.amount / Math.max(summary.totalRevenue, 1)) * 100)}%`, background: 'linear-gradient(90deg, #f5c518, #ffd700)', boxShadow: '0 0 15px rgba(245, 197, 24, 0.7)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isFinanceOfficer && (
        <div className="g3" style={{ marginBottom: 20 }}>
          <div className="dashboard-chart-panel">
            <div className="sec-head"><span className="sec-title">Revenue Sources</span></div>
            <div style={{ height: 280 }} className="chart-card-glow"><canvas ref={revenueSourcesRef} /></div>
          </div>

          <div className="dashboard-chart-panel">
            <div className="sec-head"><span className="sec-title">Cash Flow Trend</span></div>
            <div style={{ height: 280 }} className="chart-card-glow"><canvas ref={cashFlowRef} /></div>
          </div>

          <div className="dashboard-chart-panel">
            <div className="sec-head"><span className="sec-title">Balance Sheet Overview</span></div>
            <div style={{ height: 280 }} className="chart-card-glow"><canvas ref={assetLiabilityRef} /></div>
          </div>
        </div>
      )}

      {isStationManager && (
        <div className="g2" style={{ marginBottom: 20 }}>
          <div className="dashboard-chart-panel">
            <div className="sec-head"><span className="sec-title">Invoice Status Distribution</span></div>
            <div style={{ height: 280 }} className="chart-card-glow"><canvas ref={invoiceStatusRef} /></div>
          </div>

          <div className="dashboard-chart-panel">
            <div className="sec-head"><span className="sec-title">User Login Activity (7 Days)</span></div>
            <div style={{ height: 280 }} className="chart-card-glow"><canvas ref={userActivityRef} /></div>
          </div>
        </div>
      )}

      <div className="g2">
        <div className="card">
          <div className="sec-head"><span className="sec-title">Upcoming Payments</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No upcoming payments within 30 days.</div>
            ) : upcomingPayments.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{p.description}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Due: {p.due}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>{lsl(p.amount)}</div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--orange)' }}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="sec-head"><span className="sec-title">Action Required</span></div>
          <div className="alert-box alert-red" style={{ margin: 0 }}>
            <AlertCircle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ color: 'var(--red)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 2 }}>Overdue invoices are impacting cash flow</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Review outstanding receivables and follow up on late payments immediately.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
