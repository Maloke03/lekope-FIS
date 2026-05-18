import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { KPI, Modal, Field, Inp, Sel, Badge } from '../components/common/UI';
import { bankReconciliationService } from '../services/bankReconciliationService';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BankReconciliation = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'CREDIT',
    status: 'UNMATCHED',
    matchedWith: '',
    notes: ''
  });

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await bankReconciliationService.getEntries();
      setEntries(data);
    } catch (error) {
      console.error('Error loading bank entries:', error);
      toast.error('Failed to load bank reconciliation entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const saveEntry = async () => {
    if (!form.description || !form.amount || !form.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        id: editMode && selectedEntry ? selectedEntry.id : `BR-${Date.now()}`,
        ...form,
        amount: Number(form.amount),
      };

      if (editMode && selectedEntry) {
        await bankReconciliationService.updateEntry(selectedEntry.id, payload);
        toast.success('Bank reconciliation entry updated');
      } else {
        await bankReconciliationService.createEntry(payload);
        toast.success('Bank reconciliation entry created');
      }

      setAddOpen(false);
      setEditMode(false);
      setSelectedEntry(null);
      setForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'CREDIT',
        status: 'UNMATCHED',
        matchedWith: '',
        notes: ''
      });
      loadEntries();
    } catch (error) {
      console.error('Error saving bank entry:', error);
      toast.error('Failed to save bank reconciliation entry');
    }
  };

  const editEntry = (entry) => {
    setEditMode(true);
    setSelectedEntry(entry);
    setForm({
      date: entry.date,
      description: entry.description,
      amount: entry.amount,
      type: entry.type,
      status: entry.status,
      matchedWith: entry.matchedWith || '',
      notes: entry.notes || ''
    });
    setAddOpen(true);
  };

  const deleteEntry = async (id) => {
    if (!window.confirm('Delete this bank reconciliation entry?')) return;
    try {
      await bankReconciliationService.deleteEntry(id);
      toast.success('Bank reconciliation entry deleted');
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete bank entry');
    }
  };

  const matchedCount = entries.filter(e => e.status === 'MATCHED').length;
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const unmatchedAmount = entries.filter(e => e.status === 'UNMATCHED').reduce((sum, e) => sum + e.amount, 0);
  const filteredEntries = entries.filter(entry =>
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.matchedWith?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading bank reconciliation...</div>;
  }

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Bank Reconciliation</h1>
          <p className="page-sub">Match bank statement items to invoices, expenses and payroll records</p>
        </div>
        <button className="btn btn-gold" onClick={() => { setEditMode(false); setSelectedEntry(null); setForm({ date: new Date().toISOString().split('T')[0], description: '', amount: '', type: 'CREDIT', status: 'UNMATCHED', matchedWith: '', notes: '' }); setAddOpen(true); }}>
          <Plus size={15} /> Add Bank Entry
        </button>
      </div>

      <div className="g3" style={{ marginBottom: 20 }}>
        <KPI title="Total Entries" value={entries.length} icon={FileText} accent="var(--gold)" />
        <KPI title="Matched Items" value={matchedCount} icon={CheckCircle} accent="var(--green)" />
        <KPI title="Unmatched Amount" value={formatCurrency(unmatchedAmount)} icon={XCircle} accent="var(--red)" />
      </div>

      <div className="card">
        <div className="sec-head" style={{ justifyContent: 'space-between' }}>
          <span className="sec-title">Bank Statement Entries</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', width: 220 }}
            />
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Entry ID</th>
              <th>Description</th>
              <th>Date</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Status</th>
              <th>Matched With</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(entry => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>{entry.description}</td>
                <td>{entry.date}</td>
                <td>{entry.type}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)' }}>{formatCurrency(entry.amount)}</td>
                <td>
                  <Badge status={entry.status === 'MATCHED' ? 'Paid' : 'Pending'} />
                </td>
                <td>{entry.matchedWith || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="icon-btn" onClick={() => editEntry(entry)}><Edit size={14} /></button>
                    <button className="icon-btn" onClick={() => deleteEntry(entry.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editMode ? 'Edit Bank Entry' : 'Add Bank Entry'}>
        <div className="form-grid">
          <Field label="Date" span={2}>
            <Inp type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Type" span={2}>
            <Sel value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
            </Sel>
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Description" span={2}>
            <Inp value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Amount" span={2}>
            <Inp type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Status">
            <Sel value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="UNMATCHED">UNMATCHED</option>
              <option value="MATCHED">MATCHED</option>
            </Sel>
          </Field>
          <Field label="Matched With">
            <Inp value={form.matchedWith} onChange={e => setForm({ ...form, matchedWith: e.target.value })} placeholder="Invoice / Expense / Payroll ID" />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Notes" span={2}>
            <Inp value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn btn-gold" onClick={saveEntry}>{editMode ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default BankReconciliation;
