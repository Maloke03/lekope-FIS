import React, { useEffect, useRef, useState } from 'react';
import { DollarSign, Calendar, TrendingUp, Plus, Search, Filter, Download, MoreVertical, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { KPI, Modal, Field, Inp, Sel } from '../components/common/UI';
import { revenueService } from '../services/revenueService';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

Chart.register(...registerables);

const Revenue = () => {
  const barRef = useRef();
  const barChart = useRef();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalYTD: 0, avgGrowth: 0, activeContracts: 0 });
  const [streams, setStreams] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const blank = { 
    client: '', 
    type: 'Advertising', 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    status: 'PENDING',
    description: '',
    invoiceId: ''
  };
  const [form, setForm] = useState(blank);

  const TYPES = ['Advertising', 'Sponsorship', 'Event Sponsorship', 'Digital', 'Other'];
  const STATUSES = ['PENDING', 'COMPLETED', 'OVERDUE'];

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      const [revenueData, summaryData, streamsData, monthlyData] = await Promise.all([
        revenueService.getRevenue(),
        revenueService.getRevenueSummary(),
        revenueService.getRevenueStreams(),
        revenueService.getMonthlyRevenue()
      ]);
      
      setTxns(revenueData);
      setSummary(summaryData);
      setStreams(streamsData);
      setMonthlyData(monthlyData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const updateChart = (data) => {
    // Guard: ensure canvas ref exists and has data
    if (!barRef.current || !data) {
      return;
    }

    if (barChart.current) {
      barChart.current.destroy();
    }
    
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          { label: 'Advertising', data: data.advertising, backgroundColor: 'rgba(245,197,24,0.8)', borderRadius: 3 },
          { label: 'Sponsorships', data: data.sponsorships, backgroundColor: 'rgba(59,130,246,0.75)', borderRadius: 3 },
          { label: 'Events', data: data.events, backgroundColor: 'rgba(34,197,94,0.75)', borderRadius: 3 },
          { label: 'Digital', data: data.digital, backgroundColor: 'rgba(96,165,250,0.8)', borderRadius: 3 },
        ],
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
          y: { 
            grid: { color: '#1e2e48' }, 
            ticks: { color: '#8ba0bc', callback: v => `${(v / 1000).toFixed(0)}k` },
            min: 0 
          }
        },
        interaction: { mode: 'index' },
      },
    });
  };

  useEffect(() => {
    loadData();
    return () => {
      if (barChart.current) {
        barChart.current.destroy();
      }
    };
  }, []);

  // Initialize chart when data is loaded and canvas is ready
  useEffect(() => {
    if (monthlyData && barRef.current) {
      updateChart(monthlyData);
    }
    return () => {
      if (barChart.current) {
        barChart.current.destroy();
      }
    };
  }, [monthlyData]);

  const saveRevenue = async () => {
    if (!form.client || !form.amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const revenueData = {
        id: `REV-${Date.now()}`,
        ...form,
        amount: Number(form.amount)
      };
      
      if (editMode && selectedTransaction) {
        await revenueService.updateRevenue(selectedTransaction.id, revenueData);
        toast.success('Revenue transaction updated successfully!');
      } else {
        await revenueService.createRevenue(revenueData);
        toast.success('Revenue recorded successfully!');
      }
      
      setAddOpen(false);
      setEditMode(false);
      setSelectedTransaction(null);
      setForm(blank);
      loadData(); // Refresh all data
    } catch (error) {
      console.error('Error saving revenue:', error);
      toast.error(error.response?.data?.error || 'Failed to save revenue transaction');
    }
  };

  const deleteRevenue = async (id) => {
    if (window.confirm('Are you sure you want to delete this revenue transaction?')) {
      try {
        await revenueService.deleteRevenue(id);
        toast.success('Revenue transaction deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting revenue:', error);
        toast.error('Failed to delete revenue transaction');
      }
    }
  };

  const editRevenue = (transaction) => {
    setEditMode(true);
    setSelectedTransaction(transaction);
    setForm({
      client: transaction.client,
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      status: transaction.status,
      description: transaction.description || '',
      invoiceId: transaction.invoiceId || ''
    });
    setAddOpen(true);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await revenueService.updateRevenue(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      COMPLETED: { background: '#d4edda', color: '#155724' },
      PENDING: { background: '#fff3cd', color: '#856404' },
      OVERDUE: { background: '#f8d7da', color: '#721c24' }
    };
    return styles[status] || styles.PENDING;
  };

  const filteredTxns = txns.filter(txn => 
    txn.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading revenue data...</div>;
  }

  const totalMax = streams.length > 0 ? Math.max(...streams.map(s => s.amount)) : 0;

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Revenue Management</h1>
          <p className="page-sub">Track and analyze all revenue streams</p>
        </div>
        <button className="btn btn-gold" onClick={() => { setEditMode(false); setForm(blank); setAddOpen(true); }}>
          <Plus size={15} /> Record Revenue
        </button>
      </div>

      {/* KPIs */}
      <div className="g3" style={{ marginBottom: 20 }}>
        <KPI title="Total Revenue (YTD)" value={formatCurrency(summary.totalYTD)} icon={DollarSign} accent="var(--gold)" />
        <KPI title="Average Growth" value={`+${summary.avgGrowth}%`} icon={TrendingUp} accent="var(--green)" valueColor="var(--green)" />
        <KPI title="Active Contracts" value={summary.activeContracts} icon={Calendar} accent="var(--blue)" />
      </div>

      {/* Revenue streams */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="sec-head"><span className="sec-title">Revenue Streams</span></div>
        {streams.map(s => {
          const widthPct = totalMax > 0 ? (s.amount / totalMax) * 100 : 0;
          return (
            <div key={s.name} style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '16px 18px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{s.name}</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: s.growth >= 0 ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                  color: s.growth >= 0 ? 'var(--green)' : 'var(--red)'
                }}>
                  {s.growth >= 0 ? '+' : ''}{s.growth}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                  {formatCurrency(s.amount)}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.txns} transactions</span>
              </div>
              <div className="prog" style={{ height: 5 }}>
                <div className="prog-fill" style={{ width: `${widthPct}%`, background: 'var(--gold)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="sec-head"><span className="sec-title">Monthly Revenue by Source</span></div>
        <div style={{ height: 260 }}><canvas ref={barRef} /></div>
      </div>

      {/* Transactions table */}
      <div className="card">
        <div className="sec-head">
          <span className="sec-title">Recent Transactions</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '6px 10px 6px 30px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', fontSize: '0.8rem', width: 200 }}
              />
            </div>
            <button className="icon-btn" onClick={loadData}><Download size={16} /></button>
          </div>
        </div>
        
        <table className="tbl">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Client</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTxns.map(t => (
              <tr key={t.id}>
                <td style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '0.82rem' }}>{t.id}</td>
                <td><b>{t.client}</b></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{t.type}</td>
                <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(t.amount)}</td>
                <td style={{ fontSize: '0.8rem' }}>{t.date}</td>
                <td>
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                    className="badge"
                    style={getStatusStyle(t.status)}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s} style={{ background: 'var(--bg-surface)' }}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="icon-btn" onClick={() => editRevenue(t)}><Edit size={14} /></button>
                    <button className="icon-btn" onClick={() => deleteRevenue(t.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredTxns.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No revenue transactions found
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditMode(false); setForm(blank); }} title={editMode ? "Edit Revenue Transaction" : "Record Revenue"}>
        <div className="form-grid">
          <Field label="Client" span={2}>
            <Inp value={form.client} placeholder="Client name" onChange={e => setForm({ ...form, client: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Type">
            <Sel value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </Sel>
          </Field>
          <Field label="Status">
            <Sel value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </Sel>
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Amount (LSL)">
            <Inp type="number" value={form.amount} placeholder="45000" onChange={e => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Date">
            <Inp type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>
        <Field label="Description">
          <Inp value={form.description} placeholder="Optional description" onChange={e => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Invoice ID">
          <Inp value={form.invoiceId} placeholder="Associated invoice ID (optional)" onChange={e => setForm({ ...form, invoiceId: e.target.value })} />
        </Field>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => { setAddOpen(false); setEditMode(false); setForm(blank); }}>Cancel</button>
          <button className="btn btn-gold" onClick={saveRevenue}>{editMode ? "Update Revenue" : "Record Revenue"}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Revenue;