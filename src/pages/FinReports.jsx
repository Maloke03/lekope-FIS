import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, DollarSign, TrendingDown, FileText, Download, Calendar, RefreshCw, BookOpen, ListChecks, Scale } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import { reportService } from '../services/reportService';
import { lsl } from '../utils/helpers';

Chart.register(...registerables);

const reportTiles = [
  { title:'Income Statement (P&L)', sub:'Profit and Loss statement for current period', icon:TrendingUp, color:'var(--green)' },
  { title:'Balance Sheet', sub:'Financial position and net worth', icon:DollarSign, color:'var(--gold)' },
  { title:'Trial Balance', sub:'Debit and credit control totals', icon:Scale, color:'var(--blue)' },
  { title:'General Ledger', sub:'Account-by-account double-entry activity', icon:BookOpen, color:'var(--purple)' },
  { title:'Journal Entries', sub:'Transaction register with debit and credit sides', icon:ListChecks, color:'var(--orange)' },
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

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportReportsJSON = () => {
    if (!reportData) return;
    const jsonData = JSON.stringify(reportData, null, 2);
    downloadFile(jsonData, `financial-reports-${new Date().toISOString().slice(0,10)}.json`, 'application/json');
  };

  const exportReportsCSV = () => {
    if (!reportData) return;

    const rows = [];
    rows.push(['Lekope FM Financial Report', `Date: ${new Date().toLocaleDateString()}`]);
    rows.push([]);
    rows.push(['Income Statement']);
    reportData.incomeStatement.revenue.forEach((item) => rows.push([item.name, item.amount]));
    rows.push([]);
    rows.push(['Expenses']);
    reportData.incomeStatement.expenses.forEach((item) => rows.push([item.name, item.amount]));
    rows.push([]);
    rows.push(['Balance Sheet - Current Assets']);
    Object.entries(reportData.balanceSheet.currentAssets).forEach(([key, value]) => rows.push([key, value]));
    rows.push([]);
    rows.push(['Balance Sheet - Fixed Assets']);
    Object.entries(reportData.balanceSheet.fixedAssets).forEach(([key, value]) => rows.push([key, value]));
    rows.push([]);
    rows.push(['Balance Sheet Totals']);
    rows.push(['Total Assets', reportData.balanceSheet.totalAssets]);
    rows.push(['Total Liabilities', reportData.balanceSheet.totalLiabilities]);
    rows.push(['Owner\'s Equity', reportData.balanceSheet.ownersEquity]);
    rows.push([]);
    rows.push(['Trial Balance']);
    rows.push(['Account', 'Debit', 'Credit']);
    (reportData.trialBalance?.accounts || []).forEach((row) => rows.push([row.account, row.debit, row.credit]));
    rows.push(['Totals', reportData.trialBalance?.totals?.debit || 0, reportData.trialBalance?.totals?.credit || 0]);
    rows.push([]);
    rows.push(['Journal Entries']);
    rows.push(['Date', 'Source', 'Description', 'Debit Account', 'Credit Account', 'Amount', 'Status']);
    (reportData.journalEntries || []).forEach((entry) => rows.push([
      entry.date,
      entry.source,
      entry.description,
      entry.debit?.account || '',
      entry.credit?.account || '',
      entry.amount,
      entry.status
    ]));

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadFile(csv, `financial-reports-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportReportsPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF({ orientation: 'portrait' });
    const dateLabel = new Date().toLocaleDateString();
    const marginLeft = 16;
    let y = 18;

    doc.setFontSize(18);
    doc.text('Lekope FM Financial Report', marginLeft, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Date: ${dateLabel}`, marginLeft, y);
    y += 12;

    doc.setFontSize(12);
    doc.text('Income Statement', marginLeft, y);
    y += 8;
    reportData.incomeStatement.revenue.forEach((item) => {
      doc.text(`${item.name}`, marginLeft, y);
      doc.text(`${lsl(item.amount)}`, 180, y, { align: 'right' });
      y += 7;
    });
    y += 6;
    doc.text('Expenses', marginLeft, y);
    y += 8;
    reportData.incomeStatement.expenses.forEach((item) => {
      doc.text(`${item.name}`, marginLeft, y);
      doc.text(`${lsl(item.amount)}`, 180, y, { align: 'right' });
      y += 7;
    });
    y += 10;
    doc.setFontSize(12);
    doc.text('Balance Sheet', marginLeft, y);
    y += 8;
    Object.entries(reportData.balanceSheet.currentAssets).forEach(([key, value]) => {
      doc.text(`${key}`, marginLeft, y);
      doc.text(`${lsl(value)}`, 180, y, { align: 'right' });
      y += 7;
    });
    y += 4;
    Object.entries(reportData.balanceSheet.fixedAssets).forEach(([key, value]) => {
      doc.text(`${key}`, marginLeft, y);
      doc.text(`${lsl(value)}`, 180, y, { align: 'right' });
      y += 7;
    });
    y += 8;
    doc.setFontSize(11);
    doc.text('Totals', marginLeft, y);
    y += 7;
    doc.text('Total Assets', marginLeft, y);
    doc.text(`${lsl(reportData.balanceSheet.totalAssets)}`, 180, y, { align: 'right' });
    y += 7;
    doc.text('Total Liabilities', marginLeft, y);
    doc.text(`${lsl(reportData.balanceSheet.totalLiabilities)}`, 180, y, { align: 'right' });
    y += 7;
    doc.text('Owner\'s Equity', marginLeft, y);
    doc.text(`${lsl(reportData.balanceSheet.ownersEquity)}`, 180, y, { align: 'right' });
    y += 10;

    const doubleEntry = reportData.doubleEntryStatus || {};
    doc.setFontSize(12);
    doc.text('Double-Entry Control', marginLeft, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Debits: ${lsl(doubleEntry.debitTotal || 0)}`, marginLeft, y);
    y += 6;
    doc.text(`Total Credits: ${lsl(doubleEntry.creditTotal || 0)}`, marginLeft, y);
    y += 6;
    doc.text(`Difference: ${lsl(doubleEntry.difference || 0)}`, marginLeft, y);
    y += 6;
    doc.text(`Status: ${doubleEntry.balanced ? 'Balanced' : 'Review required'}`, marginLeft, y);
    doc.save(`financial-report-${new Date().toISOString().slice(0,10)}.pdf`);
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

  const trialBalance = reportData.trialBalance || { accounts: [], totals: { debit: 0, credit: 0, difference: 0 }, balanced: false };
  const generalLedger = reportData.generalLedger || [];
  const journalEntries = reportData.journalEntries || [];
  const doubleEntryStatus = reportData.doubleEntryStatus || {
    balanced: trialBalance.balanced,
    debitTotal: trialBalance.totals.debit,
    creditTotal: trialBalance.totals.credit,
    difference: trialBalance.totals.difference,
    journalEntryCount: journalEntries.length
  };

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
          <button className="btn btn-ghost btn-sm" onClick={exportReportsPDF} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> PDF
          </button>
          <button className="btn btn-ghost btn-sm" onClick={exportReportsCSV} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> CSV
          </button>
          <button className="btn btn-gold" onClick={exportReportsJSON} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> JSON
          </button>
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

      <div className="g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)', marginBottom: 14 }}>Double-Entry Control</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {[
              ['Debit Total', lsl(doubleEntryStatus.debitTotal || 0), 'var(--blue)'],
              ['Credit Total', lsl(doubleEntryStatus.creditTotal || 0), 'var(--green)'],
              ['Difference', lsl(doubleEntryStatus.difference || 0), Math.abs(doubleEntryStatus.difference || 0) < 1 ? 'var(--green)' : 'var(--red)'],
              ['Journal Entries', doubleEntryStatus.journalEntryCount || 0, 'var(--gold)']
            ].map(([label, value, color]) => (
              <div key={label} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-hover)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color, fontSize: '1.05rem' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: doubleEntryStatus.balanced ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${doubleEntryStatus.balanced ? '#22c55e33' : '#ef444433'}`, color: doubleEntryStatus.balanced ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
            {doubleEntryStatus.balanced ? 'Balanced trial balance' : 'Review required: debits and credits do not agree'}
          </div>
        </div>

        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)', marginBottom: 14 }}>Trial Balance - {trialBalance.period || reportData.period?.label || 'Current Period'}</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Account</th>
                <th style={{ textAlign: 'right' }}>Debit</th>
                <th style={{ textAlign: 'right' }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.accounts.slice(0, 12).map((account) => (
                <tr key={account.account}>
                  <td>{account.account}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)' }}>{account.debit ? lsl(account.debit) : '-'}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)' }}>{account.credit ? lsl(account.credit) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 800 }}>Totals</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{lsl(trialBalance.totals.debit || 0)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{lsl(trialBalance.totals.credit || 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)', marginBottom: 14 }}>General Ledger Snapshot</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Account</th>
                <th>Normal</th>
                <th style={{ textAlign: 'right' }}>Debit</th>
                <th style={{ textAlign: 'right' }}>Credit</th>
                <th style={{ textAlign: 'right' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {generalLedger.slice(0, 8).map((ledger) => (
                <tr key={ledger.account}>
                  <td>{ledger.account}</td>
                  <td>{ledger.normalBalance}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)' }}>{ledger.debitTotal ? lsl(ledger.debitTotal) : '-'}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)' }}>{ledger.creditTotal ? lsl(ledger.creditTotal) : '-'}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{lsl(ledger.balance || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!generalLedger.length && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No ledger activity for this period.</div>}
        </div>

        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)', marginBottom: 14 }}>Journal Entry Register</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Debit</th>
                <th>Credit</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.slice(0, 8).map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.source}</td>
                  <td>{entry.debit?.account}</td>
                  <td>{entry.credit?.account}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{lsl(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!journalEntries.length && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No journal entries for this period.</div>}
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
