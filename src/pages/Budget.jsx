import React, { useEffect, useRef, useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Target, AlertTriangle, Pencil, Download, Plus, RefreshCw } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { KPI, Prog } from '../components/common/UI';
import { budgetService } from '../services/budgetService';
import { lsl, pct, statusStyle } from '../utils/helpers';

Chart.register(...registerables);

const Budget = () => {
  const forecastRef = useRef(); const forecastChart = useRef();
  const bvaRef = useRef(); const bvaChart = useRef();
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await budgetService.getBudgetSummary();
      setBudgetData(data);
    } catch (error) {
      console.error('Error loading budget summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!budgetData) return;

    forecastChart.current?.destroy();
    forecastChart.current = new Chart(forecastRef.current, {
      type: 'line',
      data: {
        labels: budgetData.quarterlyForecast.labels,
        datasets: [
          { label: 'Budget', data: budgetData.quarterlyForecast.budget, borderColor: '#4a6080', borderDash: [5, 4], tension: 0.3, pointBackgroundColor: '#4a6080', pointRadius: 5, borderWidth: 1.5, fill: false },
          { label: 'Actual', data: budgetData.quarterlyForecast.actual, borderColor: '#f5c518', tension: 0.3, pointBackgroundColor: '#f5c518', pointRadius: 5, borderWidth: 2, fill: false },
          { label: 'Forecast', data: budgetData.quarterlyForecast.forecast, borderColor: '#60a5fa', borderDash: [3, 3], tension: 0.3, pointBackgroundColor: '#60a5fa', pointRadius: 5, borderWidth: 1.5, fill: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } }, tooltip: { backgroundColor: '#141f35', borderColor: '#1e2e48', borderWidth: 1, titleColor: '#eef2f8', bodyColor: '#8ba0bc', callbacks: { label: ctx => ctx.parsed.y ? ` LSL ${ctx.parsed.y.toLocaleString()}` : ' N/A' } } },
        scales: { x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } }, y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, min: 0 } }
      }
    });

    bvaChart.current?.destroy();
    bvaChart.current = new Chart(bvaRef.current, {
      type: 'bar',
      data: {
        labels: budgetData.budgetVsActual.labels,
        datasets: [
          { label: 'Budget', data: budgetData.budgetVsActual.budget, backgroundColor: 'rgba(74,96,128,0.5)', borderRadius: 3 },
          { label: 'Actual', data: budgetData.budgetVsActual.actual, backgroundColor: 'rgba(245,197,24,0.8)', borderRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8ba0bc', font: { family: 'DM Sans' }, boxWidth: 12, padding: 14 } }, tooltip: { backgroundColor: '#141f35', borderColor: '#1e2e48', borderWidth: 1, titleColor: '#eef2f8', bodyColor: '#8ba0bc', callbacks: { label: ctx => ` LSL ${ctx.parsed.y.toLocaleString()}` } } },
        scales: { x: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc' } }, y: { grid: { color: '#1e2e48' }, ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` }, min: 0 } }
      }
    });

    return () => { forecastChart.current?.destroy(); bvaChart.current?.destroy(); };
  }, [budgetData]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading budget data...</div>;
  }

  if (!budgetData) {
    return <div style={{ padding: 40, textAlign: 'center' }}>No budget data available.</div>;
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Budget Management</h1>
          <p className="page-sub">Plan and monitor budget allocations</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm"><Download size={14} />Export</button>
          <button className="btn btn-ghost btn-sm" onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Reload
          </button>
          <button className="btn btn-gold"><Plus size={15} />New Budget</button>
        </div>
      </div>

      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Total Budget" value={lsl(budgetData.budgetSummary.total)} icon={DollarSign} accent="var(--blue)" />
        <KPI title="Total Spent" value={lsl(budgetData.budgetSummary.spent)} icon={TrendingDown} accent="var(--red)" />
        <KPI title="Remaining" value={lsl(budgetData.budgetSummary.remaining)} icon={TrendingUp} accent="var(--green)" valueColor="var(--green)" />
        <KPI title="Utilization" value={`${budgetData.budgetSummary.utilization}%`} icon={Target} accent="var(--gold)" valueColor="var(--gold)" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="sec-head">
          <span className="sec-title">Budget by Department</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: '0.85rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>View All</button>
        </div>
        {budgetData.deptBudgets.map((d) => {
          const usedPct = pct(d.spent, d.budget);
          const barColor = usedPct >= 93 ? '#f5c518' : usedPct >= 85 ? '#f5c518' : '#22c55e';
          return (
            <div key={d.dept} style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '16px 18px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{d.dept}</span>
                  <span className="badge" style={statusStyle(d.status)}>{d.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{Math.round(usedPct)}%</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>utilized</span>
                  <button className="icon-btn"><Pencil size={13} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                <span>Budget <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{lsl(d.budget)}</span></span>
                <span>Spent <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{lsl(d.spent)}</span></span>
                <span>Remaining <span style={{ color: 'var(--green)', fontWeight: 600 }}>{lsl(d.remaining)}</span></span>
              </div>
              <Prog value={usedPct} color={barColor} />
            </div>
          );
        })}
      </div>

      <div className="g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="sec-head"><span className="sec-title">Quarterly Forecast</span></div>
          <div style={{ height: 250 }}><canvas ref={forecastRef} /></div>
        </div>
        <div className="card">
          <div className="sec-head"><span className="sec-title">Budget vs Actual</span></div>
          <div style={{ height: 250 }}><canvas ref={bvaRef} /></div>
        </div>
      </div>

      <div className="alert-box alert-warn">
        <AlertTriangle size={16} color="var(--orange)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ color: 'var(--orange)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 2 }}>Budget Alert</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Sales & Marketing department is at high utilization. Consider reviewing spending or adjusting allocations for the next quarter.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;
