import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Zap, RefreshCw, DollarSign, BarChart3, Users, AlertCircle } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { analyticsService } from '../services/analyticsService';
import { lsl } from '../utils/helpers';

Chart.register(...registerables);

const Analytics = () => {
  const profitRef = useRef(); const profitChart = useRef();
  const pieRef = useRef(); const pieChart = useRef();
  const radarRef = useRef(); const radarChart = useRef();
  const qtrRef = useRef(); const qtrChart = useRef();
  const sourceRef = useRef(); const sourceChart = useRef();
  const budgetRef = useRef(); const budgetChart = useRef();
  const forecastRef = useRef(); const forecastChart = useRef();
  const cashProjectionRef = useRef(); const cashProjectionChart = useRef();

  const emptyAnalytics = {
    kpis: {
      revenueGrowth: 0,
      profitMargin: 0,
      operatingEfficiency: 0,
      clientAcquisitionCost: 0
    },
    profitTrend: { labels: [], revenue: [], expenses: [], profit: [] },
    revenueSources: [],
    expenseCategories: [],
    arAging: [],
    financeSummary: {
      cashPosition: 0,
      workingCapital: 0,
      cashRunwayMonths: 0,
      receivablesOutstanding: 0,
      currentPayables: 0
    },
    forecast: { labels: [], revenue: [], expenses: [], profit: [] },
    forecastSummary: { nextQuarterRevenue: 0, nextQuarterExpenses: 0, projectedProfit: 0 },
    financialProjections: {
      cashFlow: { labels: [], openingCash: 0, inflows: [], outflows: [], net: [], closingCash: [] },
      receivables: { outstanding: 0, expectedCollections: 0, collectionRisk: 0, buckets: [] },
      budgetBurn: {
        annualBudget: 0,
        spentToDate: 0,
        remaining: 0,
        monthlySpendRate: 0,
        projectedYearEndSpend: 0,
        projectedVariance: 0,
        exhaustionMonth: 'N/A'
      },
      revenueMix: [],
      expenseCategories: [],
      workingCapital: { labels: [], values: [], outlook: [] },
      taxReserve: { vatRate: 0, projectedVatReserve: 0, projectedNetAfterVat: 0 }
    },
    topClients: [],
    scorecard: [],
    quarterlyPerformance: { labels: [], revenue: [], profit: [], margins: [] },
    insights: []
  };

  const [data, setData] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const overview = await analyticsService.getOverview();
      setData(overview || emptyAnalytics);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setData(emptyAnalytics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const financialProjectionDefaults = emptyAnalytics.financialProjections;
  const incomingProjections = data?.financialProjections || {};

  const safeData = {
    ...emptyAnalytics,
    ...data,
    kpis: { ...emptyAnalytics.kpis, ...(data?.kpis || {}) },
    profitTrend: { ...emptyAnalytics.profitTrend, ...(data?.profitTrend || {}) },
    revenueSources: data?.revenueSources || [],
    expenseCategories: data?.expenseCategories || [],
    arAging: data?.arAging || [],
    financeSummary: { ...emptyAnalytics.financeSummary, ...(data?.financeSummary || {}) },
    forecast: { ...emptyAnalytics.forecast, ...(data?.forecast || {}) },
    forecastSummary: { ...emptyAnalytics.forecastSummary, ...(data?.forecastSummary || {}) },
    financialProjections: {
      ...financialProjectionDefaults,
      ...incomingProjections,
      cashFlow: { ...financialProjectionDefaults.cashFlow, ...(incomingProjections.cashFlow || {}) },
      receivables: { ...financialProjectionDefaults.receivables, ...(incomingProjections.receivables || {}) },
      budgetBurn: { ...financialProjectionDefaults.budgetBurn, ...(incomingProjections.budgetBurn || {}) },
      revenueMix: incomingProjections.revenueMix || [],
      expenseCategories: incomingProjections.expenseCategories || [],
      workingCapital: { ...financialProjectionDefaults.workingCapital, ...(incomingProjections.workingCapital || {}) },
      taxReserve: { ...financialProjectionDefaults.taxReserve, ...(incomingProjections.taxReserve || {}) }
    },
    quarterlyPerformance: { ...emptyAnalytics.quarterlyPerformance, ...(data?.quarterlyPerformance || {}) },
    topClients: data?.topClients || [],
    scorecard: data?.scorecard || [],
    insights: data?.insights || []
  };
  const signedLsl = (value = 0) => `LSL ${Number(value || 0).toLocaleString('en-LS')}`;

  useEffect(() => {
    if (!data) return;

    profitChart.current?.destroy();
    profitChart.current = new Chart(profitRef.current, {
      type: 'line',
      data: {
        labels: safeData.profitTrend.labels,
        datasets: [
          {
            label: 'Revenue',
            data: safeData.profitTrend.revenue,
            borderColor: '#8ba0bc44',
            backgroundColor: 'transparent',
            tension: 0.4,
            fill: false,
            pointBackgroundColor: '#8ba0bc',
            pointRadius: 4,
            borderWidth: 1.5,
            borderDash: [3, 3]
          },
          {
            label: 'Expenses',
            data: safeData.profitTrend.expenses,
            borderColor: '#ef444444',
            backgroundColor: 'transparent',
            tension: 0.4,
            fill: false,
            pointBackgroundColor: '#ef4444',
            pointRadius: 4,
            borderWidth: 1.5,
            borderDash: [3, 3]
          },
          {
            label: 'Net Profit',
            data: safeData.profitTrend.profit,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.15)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#22c55e',
            pointRadius: 5,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 16, usePointStyle: true } },
          tooltip: {
            backgroundColor: '#141f35',
            borderColor: '#1e2e48',
            borderWidth: 1,
            titleColor: '#eef2f8',
            bodyColor: '#8ba0bc',
            callbacks: {
              label: ctx => ` LSL ${ctx.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e4855', drawBorder: false }, ticks: { color: '#8ba0bc' } },
          y: { grid: { color: '#1e2e4855', drawBorder: false }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, min: 0 }
        }
      }
    });

    pieChart.current?.destroy();
    pieChart.current = new Chart(pieRef.current, {
      type: 'pie',
      data: {
        labels: safeData.topClients.map(c => c.name),
        datasets: [{
          data: safeData.topClients.map(c => c.amount),
          backgroundColor: ['#f5c518', '#c49b10', '#8a6d0a', '#4a6080', '#263d60'],
          borderColor: '#141f35',
          borderWidth: 2,
          hoverOffset: 6
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
            callbacks: {
              label: ctx => ` ${lsl(ctx.parsed)}`
            }
          }
        }
      }
    });

    radarChart.current?.destroy();
    radarChart.current = new Chart(radarRef.current, {
      type: 'radar',
      data: {
        labels: safeData.scorecard.map(s => s.axis),
        datasets: [{
          label: 'Performance',
          data: safeData.scorecard.map(s => s.val),
          borderColor: '#f5c518',
          backgroundColor: 'rgba(245,197,24,0.25)',
          pointBackgroundColor: '#f5c518',
          pointRadius: 4,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#141f35', borderColor: '#1e2e48', borderWidth: 1, titleColor: '#eef2f8', bodyColor: '#8ba0bc' }
        },
        scales: {
          r: {
            grid: { color: '#1e2e48' },
            ticks: { color: '#8ba0bc', backdropColor: 'transparent', stepSize: 25 },
            pointLabels: { color: '#8ba0bc', font: { family: 'DM Sans', size: 11 } },
            angleLines: { color: '#1e2e48' },
            min: 0,
            max: 100
          }
        }
      }
    });

    qtrChart.current?.destroy();
    qtrChart.current = new Chart(qtrRef.current, {
      type: 'bar',
      data: {
        labels: safeData.quarterlyPerformance.labels,
        datasets: [
          { label: 'Revenue', data: safeData.quarterlyPerformance.revenue, backgroundColor: 'rgba(245,197,24,0.25)', borderRadius: 4 },
          { label: 'Profit', data: safeData.quarterlyPerformance.profit, backgroundColor: 'rgba(34,197,94,0.8)', borderRadius: 4 }
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
            callbacks: {
              label: ctx => ` LSL ${ctx.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e4855' }, ticks: { color: '#8ba0bc' } },
          y: { grid: { color: '#1e2e4855' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, min: 0 }
        }
      }
    });

    sourceChart.current?.destroy();
    sourceChart.current = new Chart(sourceRef.current, {
      type: 'doughnut',
      data: {
        labels: safeData.revenueSources.map(r => r.name),
        datasets: [{
          data: safeData.revenueSources.map(r => r.amount),
          backgroundColor: ['#f5c518', '#3b82f6', '#22c55e', '#a855f7', '#64748b'],
          borderColor: '#141f35',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8ba0bc', boxWidth: 10, padding: 10 } },
          tooltip: {
            backgroundColor: '#141f35',
            borderColor: '#1e2e48',
            borderWidth: 1,
            titleColor: '#eef2f8',
            bodyColor: '#8ba0bc',
            callbacks: {
              label: (ctx) => `${ctx.label}: ${lsl(ctx.parsed)} (${safeData.revenueSources[ctx.dataIndex]?.pct || 0}%)`
            }
          }
        }
      }
    });

    budgetChart.current?.destroy();
    budgetChart.current = new Chart(budgetRef.current, {
      type: 'bar',
      data: {
        labels: safeData.expenseCategories.map(c => c.category),
        datasets: [
          { label: 'Actual', data: safeData.expenseCategories.map(c => c.actual), backgroundColor: 'rgba(239,68,68,0.65)', borderRadius: 4 },
          { label: 'Budget', data: safeData.expenseCategories.map(c => c.budget), backgroundColor: 'rgba(34,197,94,0.55)', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8ba0bc', boxWidth: 12, padding: 14 } },
          tooltip: {
            backgroundColor: '#141f35',
            borderColor: '#1e2e48',
            borderWidth: 1,
            titleColor: '#eef2f8',
            bodyColor: '#8ba0bc',
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${lsl(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e4855' }, ticks: { color: '#8ba0bc' } },
          y: { grid: { color: '#1e2e4855' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, beginAtZero: true }
        }
      }
    });

    forecastChart.current?.destroy();
    forecastChart.current = new Chart(forecastRef.current, {
      type: 'line',
      data: {
        labels: safeData.forecast.labels,
        datasets: [
          {
            label: 'Projected Revenue',
            data: safeData.forecast.revenue,
            borderColor: '#f5c518',
            backgroundColor: 'rgba(245,197,24,0.15)',
            tension: 0.35,
            fill: false,
            pointRadius: 4,
            borderWidth: 2
          },
          {
            label: 'Projected Expense',
            data: safeData.forecast.expenses,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.15)',
            tension: 0.35,
            fill: false,
            pointRadius: 4,
            borderWidth: 2
          },
          {
            label: 'Projected Profit',
            data: safeData.forecast.profit,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.15)',
            tension: 0.35,
            fill: true,
            pointRadius: 4,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8ba0bc', boxWidth: 12, padding: 14 } },
          tooltip: {
            backgroundColor: '#141f35',
            borderColor: '#1e2e48',
            borderWidth: 1,
            titleColor: '#eef2f8',
            bodyColor: '#8ba0bc',
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${lsl(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e4855' }, ticks: { color: '#8ba0bc' } },
          y: { grid: { color: '#1e2e4855' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, beginAtZero: true }
        }
      }
    });

    cashProjectionChart.current?.destroy();
    if (cashProjectionRef.current) {
      cashProjectionChart.current = new Chart(cashProjectionRef.current, {
        type: 'bar',
        data: {
          labels: safeData.financialProjections.cashFlow.labels,
          datasets: [
            {
              label: 'Cash Inflows',
              data: safeData.financialProjections.cashFlow.inflows,
              backgroundColor: 'rgba(34,197,94,0.65)',
              borderRadius: 4
            },
            {
              label: 'Cash Outflows',
              data: safeData.financialProjections.cashFlow.outflows,
              backgroundColor: 'rgba(239,68,68,0.6)',
              borderRadius: 4
            },
            {
              type: 'line',
              label: 'Net Cash Flow',
              data: safeData.financialProjections.cashFlow.net,
              borderColor: '#60a5fa',
              backgroundColor: 'rgba(96,165,250,0.12)',
              tension: 0.35,
              fill: false,
              pointRadius: 4,
              borderWidth: 2
            },
            {
              type: 'line',
              label: 'Closing Cash',
              data: safeData.financialProjections.cashFlow.closingCash,
              borderColor: '#f5c518',
              backgroundColor: 'rgba(245,197,24,0.12)',
              tension: 0.35,
              fill: false,
              pointRadius: 4,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8ba0bc', boxWidth: 12, padding: 14 } },
            tooltip: {
              backgroundColor: '#141f35',
              borderColor: '#1e2e48',
              borderWidth: 1,
              titleColor: '#eef2f8',
              bodyColor: '#8ba0bc',
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${signedLsl(ctx.parsed.y)}`
              }
            }
          },
          scales: {
            x: { grid: { color: '#1e2e4855' }, ticks: { color: '#8ba0bc' } },
            y: { grid: { color: '#1e2e4855' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } }
          }
        }
      });
    }

    return () => {
      profitChart.current?.destroy();
      pieChart.current?.destroy();
      radarChart.current?.destroy();
      qtrChart.current?.destroy();
      sourceChart.current?.destroy();
      budgetChart.current?.destroy();
      forecastChart.current?.destroy();
      cashProjectionChart.current?.destroy();
    };
  }, [data]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading analytics...</div>;
  }

  const projections = safeData.financialProjections;
  const cashFlowProjection = projections.cashFlow;
  const budgetBurn = projections.budgetBurn;
  const receivablesProjection = projections.receivables;
  const taxReserve = projections.taxReserve;
  const finalClosingCash = cashFlowProjection.closingCash.length
    ? cashFlowProjection.closingCash[cashFlowProjection.closingCash.length - 1]
    : 0;
  const finalWorkingCapital = projections.workingCapital.values.length
    ? projections.workingCapital.values[projections.workingCapital.values.length - 1]
    : 0;
  const varianceColor = budgetBurn.projectedVariance >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Financial Analytics</h1>
          <p className="page-sub">Deep insights and trend analysis for data-driven decisions</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} /> Reload
        </button>
      </div>

      <div className="g4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TrendingUp size={14} color="var(--green)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Revenue Growth Rate</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--green)' }}>
            {safeData.kpis.revenueGrowth > 0 ? `+${safeData.kpis.revenueGrowth}%` : `${safeData.kpis.revenueGrowth}%`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>vs last month</div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TrendingUp size={14} color="var(--green)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Profit Margin</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--green)' }}>{safeData.kpis.profitMargin}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>vs prior period</div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Zap size={14} color="var(--green)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Operating Efficiency</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--green)' }}>{safeData.kpis.operatingEfficiency}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>realized operating margin</div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TrendingDown size={14} color="var(--red)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Client Acquisition Cost</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{lsl(safeData.kpis.clientAcquisitionCost)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>average cost per active client</div>
        </div>
      </div>

      <div className="g4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <DollarSign size={14} color="var(--green)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cash Position</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>{lsl(safeData.financeSummary.cashPosition)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>Available cash after payables</div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <BarChart3 size={14} color="var(--green)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cash Runway</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>{safeData.financeSummary.cashRunwayMonths} months</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>Projected coverage at current expense pace</div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Users size={14} color="var(--gold)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Working Capital</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' }}>{lsl(safeData.financeSummary.workingCapital)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>Receivables plus cash minus payables</div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <AlertCircle size={14} color="var(--red)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Receivables Aging</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {safeData.arAging.map((bucket) => (
              <div key={bucket.bucket} style={{ padding: 10, borderRadius: 10, background: 'var(--bg-hover)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bucket.bucket}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{lsl(bucket.amount)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>{bucket.count} invoices</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)' }}>Profitability Trend</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Revenue, expenses, and profit over the last 8 months</div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Forecasted next quarter revenue: {lsl(safeData.forecastSummary.nextQuarterRevenue)}</div>
        </div>
        <div style={{ height: 300 }}><canvas ref={profitRef} /></div>
      </div>

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', marginBottom: 16 }}>Revenue Source Mix</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: '0 0 220px', height: 220 }}><canvas ref={sourceRef} /></div>
            <div style={{ flex: 1 }}>
              {safeData.revenueSources.map((source) => (
                <div key={source.name} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{source.name}</span>
                    <span style={{ color: 'var(--gold)' }}>{source.pct}%</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>{lsl(source.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', marginBottom: 16 }}>Expense vs Budget</div>
          <div style={{ height: 260 }}><canvas ref={budgetRef} /></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)' }}>Next Quarter Forecast</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Projected revenue, expenses, and profit for the next 3 months</div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Revenue: {lsl(safeData.forecastSummary.nextQuarterRevenue)} • Expenses: {lsl(safeData.forecastSummary.nextQuarterExpenses)}
          </div>
        </div>
        <div style={{ height: 300 }}><canvas ref={forecastRef} /></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', marginBottom: 16 }}>Financial Projections</div>
        <div className="g4">
          <div style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--bg-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <DollarSign size={14} color="var(--green)" />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Six-Month Closing Cash</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: finalClosingCash >= 0 ? 'var(--green)' : 'var(--red)' }}>{signedLsl(finalClosingCash)}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>after projected inflows and outflows</div>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--bg-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <TrendingUp size={14} color="var(--blue)" />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Expected Collections</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{lsl(receivablesProjection.expectedCollections)}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>from open receivables</div>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--bg-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <BarChart3 size={14} color={varianceColor} />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Budget Variance</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: varianceColor }}>{signedLsl(budgetBurn.projectedVariance)}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>projected year-end position</div>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--bg-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <AlertCircle size={14} color="var(--orange)" />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>VAT Reserve</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--gold)' }}>{lsl(taxReserve.projectedVatReserve)}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{Math.round((taxReserve.vatRate || 0) * 100)}% of next quarter revenue</div>
          </div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)' }}>Cash Flow Projection</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Projected inflows, outflows, net cash flow, and closing cash over six months</div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Opening: {lsl(cashFlowProjection.openingCash)}</div>
          </div>
          <div style={{ height: 300 }}><canvas ref={cashProjectionRef} /></div>
        </div>

        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', marginBottom: 16 }}>Budget Burn & Working Capital</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              ['Annual budget', lsl(budgetBurn.annualBudget), 'var(--text-primary)'],
              ['Spent to date', lsl(budgetBurn.spentToDate), 'var(--red)'],
              ['Monthly spend rate', lsl(budgetBurn.monthlySpendRate), 'var(--orange)'],
              ['Projected year-end spend', lsl(budgetBurn.projectedYearEndSpend), 'var(--text-primary)'],
              ['Budget exhaustion', budgetBurn.exhaustionMonth, budgetBurn.projectedVariance >= 0 ? 'var(--green)' : 'var(--red)'],
              ['Six-month working capital', signedLsl(finalWorkingCapital), finalWorkingCapital >= 0 ? 'var(--green)' : 'var(--red)']
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', marginBottom: 16 }}>Revenue Stream Projection</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {projections.revenueMix.length ? projections.revenueMix.slice(0, 6).map((stream) => (
              <div key={stream.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stream.name}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)' }}>{lsl(stream.projectedQuarterAmount)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, stream.share)}%`, height: '100%', background: '#f5c518' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{stream.share}% of projected quarter revenue</div>
              </div>
            )) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No revenue stream projection available.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', marginBottom: 16 }}>Expense Category Projection</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {projections.expenseCategories.length ? projections.expenseCategories.slice(0, 6).map((category) => (
              <div key={category.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{category.category}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--red)' }}>{lsl(category.projectedQuarterAmount)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, category.share)}%`, height: '100%', background: '#ef4444' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{category.share}% of projected quarter expenses</div>
              </div>
            )) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No expense category projection available.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)' }}>Receivables Collection Projection</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Expected collections and risk by aging bucket</div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Risk: {lsl(receivablesProjection.collectionRisk)}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          {receivablesProjection.buckets.map((bucket) => (
            <div key={bucket.bucket} style={{ padding: 14, borderRadius: 8, background: 'var(--bg-hover)' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{bucket.bucket}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>{lsl(bucket.expectedCollection)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>{bucket.collectionRate}% collection</span>
                <span>{lsl(bucket.riskAmount)} risk</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', marginBottom: 16 }}>Revenue by Top Clients</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: '0 0 200px', height: 200 }}><canvas ref={pieRef} /></div>
            <div style={{ flex: 1 }}>
              {safeData.topClients.map((c, i) => {
                const colors = ['#f5c518', '#c49b10', '#8a6d0a', '#4a6080', '#263d60'];
                return (
                  <div key={c.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i], display: 'inline-block' }} />
                        {c.name}
                      </span>
                      <span style={{ color: colors[i], fontFamily: 'var(--font-display)', fontWeight: 600 }}>{lsl(c.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', marginBottom: 16 }}>Performance Scorecard</div>
          <div style={{ height: 240 }}><canvas ref={radarRef} /></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', marginBottom: 16 }}>Quarterly Performance Comparison</div>
        <div style={{ height: 220 }}><canvas ref={qtrRef} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginTop: 16 }}>
          {safeData.quarterlyPerformance.labels.map((q, i) => (
            <div key={q} style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{q}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--gold)' }}>{safeData.quarterlyPerformance.margins[i]}%</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Margin</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', marginBottom: 16 }}>Key Insights</div>
        <div className="g2">
          {safeData.insights.map((ins) => (
            <div key={ins.title} style={{ background: ins.bg, border: `1px solid ${ins.border}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '0.9rem', color: ins.color }}>{ins.icon}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: ins.color, fontSize: '0.9rem' }}>{ins.title}</span>
              </div>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{ins.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
