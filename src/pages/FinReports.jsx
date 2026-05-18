import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, DollarSign, TrendingDown, FileText, Download, Calendar, RefreshCw } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { reportService } from '../services/reportService';
import { lsl } from '../utils/helpers';

Chart.register(...registerables);

const reportTiles = [
  { title:'Income Statement (P&L)', sub:'Profit and Loss statement for current period', icon:TrendingUp, color:'var(--green)' },
  { title:'Balance Sheet', sub:'Financial position and net worth', icon:DollarSign, color:'var(--gold)' },
  { title:'Cash Flow Statement', sub:'Operating, investing, and financing activities', icon:TrendingDown, color:'var(--blue)' },
  { title:'Budget Variance Report', sub:'Actual vs budgeted performance', icon:FileText, color:'var(--purple)' },
];

const FinReports = () => {
  const cfRef = useRef(); const cfChart = useRef();
  const revPieRef = useRef(); const revPieChart = useRef();
  const expBarRef = useRef(); const expBarChart = useRef();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await reportService.getFinancials();
      setReportData(data);
    } catch (error) {
      console.error('Failed to load financial reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!reportData) return;

    cfChart.current?.destroy();
    cfChart.current = new Chart(cfRef.current, {
      type: 'bar',
      data: {
        labels: reportData.cashFlowData.labels,
        datasets: [
          {
            label: 'Operating Activities',
            data: reportData.cashFlowData.operating,
            backgroundColor: reportData.cashFlowData.operating.map(v => v >= 0 ? 'rgba(34,197,94,0.65)' : 'rgba(239,68,68,0.65)'),
            borderColor: reportData.cashFlowData.operating.map(v => v >= 0 ? '#22c55e' : '#ef4444'),
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Investing Activities',
            data: reportData.cashFlowData.investing,
            backgroundColor: 'rgba(96,165,250,0.75)',
            borderColor: '#60a5fa',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Financing Activities',
            data: reportData.cashFlowData.financing,
            backgroundColor: 'rgba(245,197,24,0.75)',
            borderColor: '#f5c518',
            borderWidth: 1,
            borderRadius: 4
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
            callbacks: {
              label: ctx => ` LSL ${ctx.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
          y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } }
        }
      }
    });

    // Revenue Sources Pie
    revPieChart.current?.destroy();
    revPieChart.current = new Chart(revPieRef.current, {
      type: 'doughnut',
      data: {
        labels: reportData.incomeStatement.revenue.map(r => r.name),
        datasets: [{
          data: reportData.incomeStatement.revenue.map(r => r.amount),
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
            callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toLocaleString()}` }
          }
        }
      }
    });

    // Expense Categories Bar
    expBarChart.current?.destroy();
    expBarChart.current = new Chart(expBarRef.current, {
      type: 'bar',
      data: {
        labels: reportData.incomeStatement.expenses.map(e => e.name),
        datasets: [{
          label: 'Expenses',
          data: reportData.incomeStatement.expenses.map(e => e.amount),
          backgroundColor: 'rgba(239,68,68,0.8)',
          borderColor: '#ef4444',
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
            callbacks: { label: ctx => ` LSL ${ctx.parsed.y.toLocaleString()}` }
          }
        },
        scales: {
          x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } },
          y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` } }
        }
      }
    });

    return () => {
      cfChart.current?.destroy();
      revPieChart.current?.destroy();
      expBarChart.current?.destroy();
    };
  }, [reportData]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading financial reports...</div>;
  }

  if (!reportData) {
    return <div style={{ padding: 40, textAlign: 'center' }}>No report data available.</div>;
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Financial Reports</h1>
          <p className="page-sub">Comprehensive financial statements and analysis</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm"><Calendar size={14} />March 2026</button>
          <button className="btn btn-ghost btn-sm" onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Reload
          </button>
          <button className="btn btn-gold"><Download size={14} />Export All</button>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 22 }}>
        {reportTiles.map((r) => (
          <div key={r.title} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', cursor: 'pointer' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <r.icon size={18} color={r.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>{r.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.sub}</div>
            </div>
            <Download size={15} color="var(--text-muted)" />
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)', marginBottom: 18 }}>Income Statement - March 2026</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 10 }}>Revenue</div>
          {reportData.incomeStatement.revenue.map((r) => (
            <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', paddingLeft: 8 }}>{r.name}</span>
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>{lsl(r.amount)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-primary)' }}>Total Revenue</span>
            <span style={{ color: 'var(--gold)', fontSize: '1rem' }}>{lsl(reportData.incomeStatement.totalRevenue)}</span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 10 }}>Expenses</div>
          {reportData.incomeStatement.expenses.map((e) => (
            <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', paddingLeft: 8 }}>{e.name}</span>
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>{lsl(e.amount)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-primary)' }}>Total Expenses</span>
            <span style={{ color: 'var(--red)', fontSize: '1rem' }}>{lsl(reportData.incomeStatement.totalExpenses)}</span>
          </div>
        </div>

        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid #22c55e33', borderRadius: 10, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--green)', fontSize: '1rem', marginBottom: 3 }}>Net Profit</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Profit Margin: {reportData.incomeStatement.margin}%</div>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--green)' }}>{lsl(reportData.incomeStatement.netProfit)}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)', marginBottom: 18 }}>Balance Sheet - As of March 31, 2026</div>
        <div className="g2">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 14 }}>Assets</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Current Assets</div>
            {Object.entries(reportData.balanceSheet.currentAssets).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: 12 }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lsl(v)}</span>
              </div>
            ))}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '14px 0 8px' }}>Fixed Assets</div>
            {Object.entries(reportData.balanceSheet.fixedAssets).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: 12 }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lsl(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', marginTop: 4, borderTop: '1px solid var(--border)' }}>
              <span>Total Assets</span><span>{lsl(reportData.balanceSheet.totalAssets)}</span>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 14 }}>Liabilities & Equity</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Current Liabilities</div>
            {Object.entries(reportData.balanceSheet.currentLiab).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: 12 }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lsl(v)}</span>
              </div>
            ))}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '14px 0 8px' }}>Long-term Liabilities</div>
            {Object.entries(reportData.balanceSheet.longTermLiab).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: 12 }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lsl(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--red)', borderTop: '1px solid var(--border)', marginTop: 4 }}>
              <span>Total Liabilities</span><span>{lsl(reportData.balanceSheet.totalLiabilities)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--green)' }}>
              <span>Owner's Equity</span><span>{lsl(reportData.balanceSheet.ownersEquity)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)', marginBottom: 18 }}>Cash Flow Statement (6 Months)</div>
        <div style={{ height: 280 }}><canvas ref={cfRef} /></div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, justifyContent: 'center' }}>
          {[['Operating Activities', '#22c55e'], ['Investing Activities', '#60a5fa'], ['Financing Activities', '#f5c518']].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#8ba0bc' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      <div className="g2" style={{ marginTop: 16 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)', marginBottom: 18 }}>Revenue Sources</div>
          <div style={{ height: 300 }}><canvas ref={revPieRef} /></div>
        </div>

        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)', marginBottom: 18 }}>Expense Categories</div>
          <div style={{ height: 300 }}><canvas ref={expBarRef} /></div>
        </div>
      </div>
    </div>
  );
};

export default FinReports;