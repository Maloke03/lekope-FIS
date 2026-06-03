import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, Plus, Edit, Trash2, Eye, Search, Download } from 'lucide-react';
import { KPI, Badge, Modal, Field, Inp, Sel } from '../components/common/UI';
import { taxService } from '../services/taxService';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TAX_TYPES = [
  'PAYE (Employees)', 
  'VAT Return', 
  'NSSF Contributions', 
  'Corporate Tax (Est.)', 
  'Withholding Tax', 
  'SDL', 
  'COSOMA Licensing', 
  'Broadcasting Licence Fee'
];

const Tax = () => {
  const [items, setItems] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalDue: 0,
    totalPaid: 0,
    totalOverdue: 0,
    upcomingTotal: 0,
    pendingCount: 0,
    paidCount: 0,
    overdueCount: 0,
    upcomingCount: 0,
    complianceScore: 0
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const blank = { 
    type: 'PAYE (Employees)', 
    period: '', 
    amount: '', 
    dueDate: '', 
    status: 'Pending',
    paymentReference: '',
    notes: ''
  };
  const [form, setForm] = useState(blank);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [taxData, summaryData, regulationsData] = await Promise.all([
        taxService.getTax(),
        taxService.getTaxSummary(),
        taxService.getRegulations()
      ]);
      
      setItems(taxData);
      setSummary(summaryData);
      setRegulations(regulationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load tax data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const markAsPaid = async (id) => {
    const paymentRef = prompt('Enter payment reference/invoice number:');
    if (paymentRef === null) return;
    
    try {
      await taxService.markAsPaid(id, paymentRef);
      toast.success('Tax obligation marked as paid');
      loadData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Failed to mark as paid');
    }
  };

  const saveTax = async () => {
    if (!form.type || !form.amount || !form.period || !form.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const taxData = {
        id: `TAX${Date.now()}`,
        ...form,
        amount: Number(form.amount)
      };
      
      if (editMode && selectedTax) {
        await taxService.updateTax(selectedTax.id, taxData);
        toast.success('Tax obligation updated successfully!');
      } else {
        await taxService.createTax(taxData);
        toast.success('Tax obligation added successfully!');
      }
      
      setAddOpen(false);
      setEditMode(false);
      setSelectedTax(null);
      setForm(blank);
      loadData();
    } catch (error) {
      console.error('Error saving tax:', error);
      toast.error(error.response?.data?.error || 'Failed to save tax obligation');
    }
  };

  const deleteTax = async (id) => {
    if (window.confirm('Are you sure you want to delete this tax obligation?')) {
      try {
        await taxService.deleteTax(id);
        toast.success('Tax obligation deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting tax:', error);
        toast.error('Failed to delete tax obligation');
      }
    }
  };

  const editTax = (tax) => {
    setEditMode(true);
    setSelectedTax(tax);
    setForm({
      type: tax.type,
      period: tax.period,
      amount: tax.amount,
      dueDate: tax.dueDate,
      status: tax.status,
      paymentReference: tax.paymentReference || '',
      notes: tax.notes || ''
    });
    setAddOpen(true);
  };

  const updateRegulationStatus = async (id, newStatus) => {
    try {
      await taxService.updateRegulation(id, { status: newStatus });
      toast.success('Regulation status updated');
      loadData();
    } catch (error) {
      console.error('Error updating regulation:', error);
      toast.error('Failed to update regulation status');
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

  const exportLraReport = () => {
    const rows = [
      ['Lekope FM LRA Tax Compliance Report'],
      ['Generated', new Date().toLocaleDateString()],
      [],
      ['Summary'],
      ['Total Due', summary.totalDue],
      ['Total Paid', summary.totalPaid],
      ['Total Overdue', summary.totalOverdue],
      ['Upcoming Total', summary.upcomingTotal],
      ['Compliance Score', `${summary.complianceScore}%`],
      [],
      ['Obligations'],
      ['Tax Type', 'Period', 'Amount', 'Due Date', 'Status', 'Payment Reference', 'Notes']
    ];

    items.forEach((item) => rows.push([
      item.type,
      item.period,
      item.amount,
      item.dueDate,
      new Date(item.dueDate) < new Date() && item.status === 'Pending' ? 'Overdue' : item.status,
      item.paymentReference || '',
      item.notes || ''
    ]));

    rows.push([]);
    rows.push(['Regulatory Register']);
    rows.push(['Regulation', 'Category', 'Status', 'Description']);
    regulations.forEach((regulation) => rows.push([
      regulation.name,
      regulation.category,
      regulation.status,
      regulation.description
    ]));

    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadFile(csv, `lra-tax-report-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  };

  const getStatusColor = (status) => {
    const colors = {
      'Paid': '#22c55e',
      'Pending': '#f97316',
      'Overdue': '#ef4444',
      'Filed': '#3b82f6',
      'Review': '#a855f7'
    };
    return colors[status] || '#6c757d';
  };

  const getRegulationColor = (status) => {
    const colors = {
      'Compliant': '#22c55e',
      'Review': '#f97316',
      'Non-Compliant': '#ef4444',
      'Pending': '#3b82f6'
    };
    return colors[status] || '#6c757d';
  };

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (searchTerm && !item.type.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.period.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading tax data...</div>;
  }

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Tax &amp; Compliance</h1>
          <p className="page-sub">Statutory obligations, regulatory compliance &amp; filing tracker</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={exportLraReport}>
            <Download size={14} /> LRA Report
          </button>
          <button className="btn btn-gold" onClick={() => { setEditMode(false); setForm(blank); setAddOpen(true); }}>
            <Plus size={15} /> Add Obligation
          </button>
        </div>
      </div>

      {/* Alert for upcoming obligations */}
      {summary.upcomingTotal > 0 && (
        <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid #f9731633', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={16} color="var(--orange)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <span style={{ color: 'var(--orange)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {formatCurrency(summary.upcomingTotal)} 
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {' '}in tax obligations due within the next 90 days ({summary.upcomingCount} items). Ensure funds are provisioned.
            </span>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Total Due" value={formatCurrency(summary.totalDue)} sub={`${summary.pendingCount} pending items`} icon={Clock} accent="var(--orange)" />
        <KPI title="Filed &amp; Paid" value={formatCurrency(summary.totalPaid)} sub="Completed obligations" icon={CheckCircle} accent="var(--green)" />
        <KPI title="Pending Items" value={summary.pendingCount} sub="Requires action" icon={AlertTriangle} accent="var(--red)" />
        <KPI title="Compliance Score" value={`${summary.complianceScore}%`} sub="Based on filed returns" icon={ShieldCheck} accent="var(--blue)" />
      </div>

      {/* Tax schedule */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="sec-head">
          <span className="sec-title">Tax &amp; Statutory Obligations</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '6px 10px 6px 30px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', width: 150 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'Pending', 'Paid'].map(f => (
                <button 
                  key={f} 
                  className={`tab-btn ${filter === f ? 'active' : ''}`} 
                  style={{ padding: '5px 11px', marginBottom: 0, fontSize: '0.75rem' }} 
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <table className="tbl">
          <thead>
            <tr>
              <th>Tax Type</th>
              <th>Period</th>
              <th style={{ textAlign: 'right' }}>Amount Due</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const isOverdue = t.status === 'Pending' && new Date(t.dueDate) < new Date();
              return (
                <tr key={t.id}>
                  <td><b>{t.type}</b></td>
                  <td style={{ fontSize: '0.82rem' }}>{t.period}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, color: isOverdue ? 'var(--red)' : (t.status === 'Pending' ? 'var(--orange)' : 'var(--text-primary)') }}>
                    {formatCurrency(t.amount)}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: isOverdue ? 'var(--red)' : (t.status === 'Pending' ? 'var(--orange)' : 'var(--text-muted)') }}>
                    {t.dueDate}
                  </td>
                  <td>
                    <Badge status={isOverdue ? 'Overdue' : t.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="icon-btn" onClick={() => editTax(t)}><Edit size={14} /></button>
                      {t.status === 'Pending' && (
                        <button className="icon-btn" onClick={() => markAsPaid(t.id)}><CheckCircle size={14} color="#22c55e" /></button>
                      )}
                      <button className="icon-btn" onClick={() => deleteTax(t.id)}><Trash2 size={14} color="#ef4444" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No tax obligations found
          </div>
        )}
      </div>

      {/* Regulatory Compliance Register */}
      <div className="card">
        <div className="sec-head">
          <span className="sec-title">Regulatory Compliance Register</span>
          <button className="icon-btn" onClick={loadData}><Eye size={16} /></button>
        </div>
        
        <table className="tbl">
          <thead>
            <tr>
              <th>Regulation / Act</th>
              <th>Description</th>
              <th>Category</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {regulations.map(r => (
              <tr key={r._id}>
                <td><b>{r.name}</b></td>
                <td style={{ fontSize: '0.82rem', maxWidth: 440, lineHeight: 1.5 }}>{r.description}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: r.category === 'Tax' ? '#f9731620' : r.category === 'Broadcasting' ? '#f5c51820' : '#3b82f620',
                    color: r.category === 'Tax' ? '#f97316' : r.category === 'Broadcasting' ? '#f5c518' : '#3b82f6'
                  }}>
                    {r.category}
                  </span>
                </td>
                <td>
                  <select
                    value={r.status}
                    onChange={(e) => updateRegulationStatus(r._id, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: `1px solid ${getRegulationColor(r.status)}`,
                      background: `${getRegulationColor(r.status)}20`,
                      color: getRegulationColor(r.status),
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Compliant">✓ Compliant</option>
                    <option value="Review">⚠ Review</option>
                    <option value="Non-Compliant">✗ Non-Compliant</option>
                    <option value="Pending">⏱ Pending</option>
                  </select>
                </td>
                <td>
                  {r.status === 'Review' && (
                    <span style={{ fontSize: '0.7rem', color: '#f97316' }}>Action required</span>
                  )}
                  {r.status === 'Compliant' && (
                    <span style={{ fontSize: '0.7rem', color: '#22c55e' }}>All good</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Tax Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditMode(false); setForm(blank); }} title={editMode ? "Edit Tax Obligation" : "Add Tax Obligation"}>
        <div className="form-grid">
          <Field label="Tax Type" span={2}>
            <Sel value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
            </Sel>
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Period">
            <Inp value={form.period} placeholder="e.g. Q2 2026, March 2026" onChange={e => setForm({ ...form, period: e.target.value })} />
          </Field>
          <Field label="Due Date">
            <Inp type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Amount (LSL)">
            <Inp type="number" value={form.amount} placeholder="15000" onChange={e => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Status">
            <Sel value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option>Pending</option>
              <option>Paid</option>
              <option>Filed</option>
            </Sel>
          </Field>
        </div>
        <Field label="Notes">
          <Inp value={form.notes} placeholder="Additional notes" onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>
        
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => { setAddOpen(false); setEditMode(false); setForm(blank); }}>Cancel</button>
          <button className="btn btn-gold" onClick={saveTax}>{editMode ? "Update Obligation" : "Add Obligation"}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Tax;
