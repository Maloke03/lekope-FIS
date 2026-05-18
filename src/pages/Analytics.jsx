import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { analyticsService } from '../services/analyticsService';
import { lsl } from '../utils/helpers';

Chart.register(...registerables);

const Analytics = () => {
  const profitRef = useRef(); const profitChart = useRef();
  const pieRef = useRef(); const pieChart = useRef();
  const radarRef = useRef(); const radarChart = useRef();
  const qtrRef = useRef(); const qtrChart = useRef();

  const emptyAnalytics = {
    kpis: {
      revenueGrowth: 0,
      profitMargin: 0,
      operatingEfficiency: 0,
      clientAcquisitionCost: 0
    },
    profitTrend: { labels: [], revenue: [], expenses: [], profit: [] },
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

  const safeData = {
    ...emptyAnalytics,
    ...data,
    kpis: { ...emptyAnalytics.kpis, ...(data?.kpis || {}) },
    profitTrend: { ...emptyAnalytics.profitTrend, ...(data?.profitTrend || {}) },
    quarterlyPerformance: { ...emptyAnalytics.quarterlyPerformance, ...(data?.quarterlyPerformance || {}) },
    topClients: data?.topClients || [],
    scorecard: data?.scorecard || [],
    insights: data?.insights || []
  };

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

    return () => {
      profitChart.current?.destroy();
      pieChart.current?.destroy();
      radarChart.current?.destroy();
      qtrChart.current?.destroy();
    };
  }, [data]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading analytics...</div>;
  }

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

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)' }}>Profitability Trend</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Revenue, expenses, and profit over the last 8 months</div>
          </div>
        </div>
        <div style={{ height: 300 }}><canvas ref={profitRef} /></div>
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