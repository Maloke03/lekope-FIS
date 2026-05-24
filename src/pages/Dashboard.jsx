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
import { ROLES, useAuth } from '../contexts/AuthContext';
import { lsl, statusStyle } from '../utils/helpers';
import API_URL from '../config/apiConfig';
import dashboardAccent from '../images/landing-hero.jpg';
import financeDash1 from '../images/finance_dash1.jpg';
import financeDash2 from '../images/finance_dash2.jpg';
import financeDash3 from '../images/finance_dash3.jpg';

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
  const bookingsRef = useRef(); const bookingsChart = useRef();
  const advertisersRef = useRef(); const advertisersChart = useRef();
  const payrollRef = useRef(); const payrollChart = useRef();
  const adContractsRef = useRef(); const adContractsChart = useRef();

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
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [managerTab, setManagerTab] = useState('users');
  const [stationUsers, setStationUsers] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [financialData, setFinancialData] = useState(null);

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

      const [revSummary, expSummary, revenueMonthly, expenseMonthly, invoices, allRevenue, finData, bookingsData, advertisersData, adContractsData, payrollSummaryData] = await Promise.all([
        revenueService.getRevenueSummary(),
        expenseService.getExpenseSummary(),
        revenueService.getMonthlyRevenue(),
        expenseService.getMonthlyExpenses(),
        invoiceService.getInvoices(),
        revenueService.getRevenue(),
        reportService.getFinancials(),
        bookingService.getBookings(),
        advertiserService.getAdvertisers(),
        advertiserService.getAdContracts(),
        payrollService.getPayrollSummary()
      ]);

      const totalRevenue = Number(revSummary.totalRevenue || 0);
      const totalExpenses = Number(expSummary.total || 0);
      const netProfit = totalRevenue - totalExpenses;
      const marginPct = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
      const revenueGrowth = Number(revSummary.avgGrowth || 0);

      const labels = revenueMonthly.labels && revenueMonthly.labels.length ? revenueMonthly.labels : expenseMonthly.labels;
      const revenueSeries = labels.map((_, idx) => {
        const advertising = revenueMonthly.advertising?.[idx] || 0;
        const sponsorships = revenueMonthly.sponsorships?.[idx] || 0;
        const events = revenueMonthly.events?.[idx] || 0;
        const digital = revenueMonthly.digital?.[idx] || 0;
        return advertising + sponsorships + events + digital;
      });
      const expensesSeries = labels.map((_, idx) => {
        const salaries = expenseMonthly.salaries?.[idx] || 0;
        const operations = expenseMonthly.operations?.[idx] || 0;
        const marketing = expenseMonthly.marketing?.[idx] || 0;
        const other = expenseMonthly.other?.[idx] || 0;
        return salaries + operations + marketing + other;
      });

      setSummary({
        totalRevenue,
        totalExpenses,
        netProfit,
        marginPct,
        outstanding: invoices.reduce((sum, inv) => sum + (inv.amount - (inv.paidAmount || 0)), 0),
        revenueGrowth
      });

      setMonthlyTrend({
        labels: labels || [],
        revenue: revenueSeries,
        expenses: expensesSeries,
        profit: revenueSeries.map((value, index) => value - (expensesSeries[index] || 0))
      });

      setTopClients(buildTopClients(allRevenue));
      setBookings(bookingsData || []);
      setAdvertisers(advertisersData || []);
      setAdContracts(adContractsData || []);
      setPayrollSummary(payrollSummaryData || null);
      setUpcomingPayments(buildUpcomingPayments(invoices));
      setFinancialData(finData);

      if (isStationManager) {
        const token = localStorage.getItem('authToken');
        const headers = { Authorization: `Bearer ${token}` };
        const [usersResponse, historyResponse] = await Promise.all([
          axios.get(`${API_URL}/users`, { headers }),
          axios.get(`${API_URL}/login-history`, { headers })
        ]);

        setStationUsers(usersResponse.data || []);
        setLoginHistory(historyResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!monthlyTrend.labels.length) return;

    lineChart.current?.destroy();
    lineChart.current = new Chart(lineRef.current, {
      type: 'line',
      data: {
        labels: monthlyTrend.labels,
        datasets: [
          {
            label: 'Revenue',
            data: monthlyTrend.revenue,
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
            data: monthlyTrend.expenses,
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
            callbacks: { label: ctx => ` LSL ${ctx.parsed.y.toLocaleString()}` }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
          y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, min: 0 }
        }
      }
    });

    pieChart.current?.destroy();
    pieChart.current = new Chart(pieRef.current, {
      type: 'pie',
      data: {
        labels: topClients.map(c => c.name),
        datasets: [{
          data: topClients.map(c => c.amount),
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

    // Profit Trend Chart
    profitChart.current?.destroy();
    profitChart.current = new Chart(profitRef.current, {
      type: 'bar',
      data: {
        labels: monthlyTrend.labels,
        datasets: [{
          label: 'Net Profit',
          data: monthlyTrend.profit,
          backgroundColor: monthlyTrend.profit.map(v => v >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'),
          borderColor: monthlyTrend.profit.map(v => v >= 0 ? '#22c55e' : '#ef4444'),
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
            callbacks: { label: ctx => `Profit: LSL ${ctx.parsed.y.toLocaleString()}` }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
          y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } }
        }
      }
    });

    // Expense Breakdown Pie
    if (financialData?.incomeStatement?.expenses) {
      expensePieChart.current?.destroy();
      expensePieChart.current = new Chart(expensePieRef.current, {
        type: 'doughnut',
        data: {
          labels: financialData.incomeStatement.expenses.map(e => e.name),
          datasets: [{
            data: financialData.incomeStatement.expenses.map(e => e.amount),
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
    if (isFinanceOfficer && financialData?.incomeStatement?.revenue) {
      revenueSourcesChart.current?.destroy();
      revenueSourcesChart.current = new Chart(revenueSourcesRef.current, {
        type: 'pie',
        data: {
          labels: financialData.incomeStatement.revenue.map(r => r.name),
          datasets: [{
            data: financialData.incomeStatement.revenue.map(r => r.amount),
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
    if (isFinanceOfficer && financialData?.cashFlowData) {
      cashFlowChart.current?.destroy();
      cashFlowChart.current = new Chart(cashFlowRef.current, {
        type: 'line',
        data: {
          labels: financialData.cashFlowData.labels,
          datasets: [
            {
              label: 'Operating Cash Flow',
              data: financialData.cashFlowData.operating,
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
              data: financialData.cashFlowData.investing,
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
              callbacks: { label: ctx => ` LSL ${ctx.parsed.y.toLocaleString()}` }
            }
          },
          scales: {
            x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
            y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } }
          }
        }
      });
    }

    // Invoice Status Chart (Station Manager)
    if (isStationManager && upcomingPayments.length > 0) {
      const statusCounts = upcomingPayments.reduce((acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      }, {});

      invoiceStatusChart.current?.destroy();
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
    if (isFinanceOfficer && financialData?.balanceSheet) {
      assetLiabilityChart.current?.destroy();
      assetLiabilityChart.current = new Chart(assetLiabilityRef.current, {
        type: 'bar',
        data: {
          labels: ['Assets', 'Liabilities', 'Equity'],
          datasets: [{
            label: 'Amount',
            data: [
              financialData.balanceSheet.totalAssets,
              financialData.balanceSheet.totalLiabilities,
              financialData.balanceSheet.ownersEquity
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
              callbacks: { label: ctx => `${ctx.label}: LSL ${ctx.parsed.y.toLocaleString()}` }
            }
          },
          scales: {
            x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
            y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } }
          }
        }
      });
    }

    // User Activity Chart (Station Manager)
    if (isStationManager && loginHistory.length > 0) {
      const activityByDay = loginHistory.reduce((acc, entry) => {
        const date = new Date(entry.createdAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const labels = Object.keys(activityByDay).slice(-7); // Last 7 days
      const data = labels.map(date => activityByDay[date]);

      userActivityChart.current?.destroy();
      userActivityChart.current = new Chart(userActivityRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Login Activity',
            data,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139,92,246,0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#8b5cf6',
            pointRadius: 4,
            borderWidth: 2
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
              callbacks: { label: ctx => `${ctx.parsed.y} logins` }
            }
          },
          scales: {
            x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
            y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } }
          }
        }
      });
    }

    if (topClients.length > 0) {
      revenueCompositionChart.current?.destroy();
      revenueCompositionChart.current = new Chart(revenueCompositionRef.current, {
        type: 'bar',
        data: {
          labels: topClients.map(c => c.name),
          datasets: [{
            label: 'Client revenue',
            data: topClients.map(c => c.amount),
            backgroundColor: topClients.map((_, index) => [
              '#f5c518', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899'
            ][index % 5]),
            borderColor: '#141f35',
            borderWidth: 1,
            borderRadius: 6
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
              callbacks: { label: ctx => `${ctx.label}: ${lsl(ctx.parsed.y)}` }
            }
          },
          scales: {
            x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
            y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, beginAtZero: true }
          }
        }
      });
    }

    const bookingStatusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});
    const bookingLabels = Object.keys(bookingStatusCounts);
    const bookingCounts = bookingLabels.map(label => bookingStatusCounts[label]);

    bookingsChart.current?.destroy();
    bookingsChart.current = new Chart(bookingsRef.current, {
      type: 'bar',
      data: {
        labels: bookingLabels,
        datasets: [{
          label: 'Bookings',
          data: bookingCounts,
          backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
          borderColor: '#141f35',
          borderWidth: 1,
          borderRadius: 8
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
            callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}` }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
          y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' }, beginAtZero: true }
        }
      }
    });

    const advertiserTotals = adContracts.reduce((acc, contract) => {
      if (!contract.advertiser) return acc;
      acc[contract.advertiser] = (acc[contract.advertiser] || 0) + Number(contract.amount || 0);
      return acc;
    }, {});
    const topAdvertiserEntries = Object.entries(advertiserTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const advertiserLabels = topAdvertiserEntries.map(([name]) => name);
    const advertiserValues = topAdvertiserEntries.map(([, value]) => value);

    advertisersChart.current?.destroy();
    advertisersChart.current = new Chart(advertisersRef.current, {
      type: 'bar',
      data: {
        labels: advertiserLabels,
        datasets: [{
          label: 'Campaign value',
          data: advertiserValues,
          backgroundColor: 'rgba(59,130,246,0.8)',
          borderColor: '#141f35',
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
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
            callbacks: { label: ctx => `LSL ${lsl(ctx.parsed.x)}` }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } },
          y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } }
        }
      }
    });

    if (payrollSummary) {
      payrollChart.current?.destroy();
      payrollChart.current = new Chart(payrollRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Paid', 'Pending'],
          datasets: [{
            data: [payrollSummary.paid || 0, payrollSummary.pending || 0],
            backgroundColor: ['#10b981', '#f59e0b'],
            borderColor: '#141f35',
            borderWidth: 2,
            hoverOffset: 6
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
              callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} employees` }
            }
          }
        }
      });
    }

    const adContractTotals = adContracts.reduce((acc, contract) => {
      const status = contract.status || 'Unknown';
      acc[status] = (acc[status] || 0) + Number(contract.amount || 0);
      return acc;
    }, {});
    const contractStatusLabels = Object.keys(adContractTotals);
    const contractStatusValues = contractStatusLabels.map(label => adContractTotals[label]);

    adContractsChart.current?.destroy();
    adContractsChart.current = new Chart(adContractsRef.current, {
      type: 'bar',
      data: {
        labels: contractStatusLabels,
        datasets: [{
          label: 'Ad contract value',
          data: contractStatusValues,
          backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'],
          borderColor: '#141f35',
          borderWidth: 1,
          borderRadius: 8
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
            callbacks: { label: ctx => `LSL ${lsl(ctx.parsed.y)}` }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
          y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, beginAtZero: true }
        }
      }
    });

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
      bookingsChart.current?.destroy();
      advertisersChart.current?.destroy();
      payrollChart.current?.destroy();
      adContractsChart.current?.destroy();
    };
  }, [monthlyTrend, topClients, financialData, isFinanceOfficer, isStationManager, upcomingPayments, loginHistory, bookings, adContracts, payrollSummary]);

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
  const contractValueTotal = adContracts.reduce((sum, contract) => sum + Number(contract.amount || 0), 0);

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

      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Bookings" value={bookingCount} sub="Total campaign bookings" icon={BarChart3} accent="var(--blue)" />
        <KPI title="Advertisers" value={advertiserCount} sub="Active partners" icon={Users} accent="var(--green)" />
        <KPI title="Payroll Spend" value={lsl(payrollGross)} sub={`Current payroll ${payrollSummary?.month || ''}`} icon={DollarSign} accent="var(--gold)" />
        <KPI title="Ad Contracts" value={lsl(contractValueTotal)} sub={`${totalContracts} contracts`} icon={FileText} accent="var(--orange)" />
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
          <div className="sec-head"><span className="sec-title">Ad Contract Value by Status</span></div>
          <div style={{ height: 300 }} className="chart-card-glow"><canvas ref={adContractsRef} /></div>
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
