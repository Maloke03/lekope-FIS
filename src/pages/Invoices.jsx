import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Plus, Trash2, DollarSign, CheckCircle, ShieldCheck } from 'lucide-react';
import { KPI, Modal, Field, Inp, Sel } from '../components/common/UI';
import PaymentModal from '../components/invoices/PaymentModal';
import InvoiceActions from '../components/invoices/InvoiceActions';
import { invoiceService } from '../services/invoiceService';
import { formatCurrency } from '../utils/invoiceUtils';
import { ROLES, useAuth } from '../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProofNotice, setPaymentProofNotice] = useState(null);
  const { user, hasRole } = useAuth();
  const isAuditor = user?.role === ROLES.AUDITOR;
  
  const blank = { 
    client: '', 
    clientEmail: '',
    clientPhone: '',
    issue: new Date().toISOString().split('T')[0], 
    due: '', 
    status: 'DRAFT',
    items: [{ description: 'Radio Advertising Service', quantity: 1, rate: '', amount: 0 }]
  };
  const [form, setForm] = useState(blank);

  const calculateItems = (items = form.items) => {
    return items.map(item => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return { ...item, quantity, rate, amount: quantity * rate };
    });
  };

  const formItems = calculateItems();
  const formAmount = formItems.reduce((sum, item) => sum + item.amount, 0);

  const updateLineItem = (index, field, value) => {
    const items = form.items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    ));
    setForm({ ...form, items });
  };

  const addLineItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, rate: '', amount: 0 }]
    });
  };

  const removeLineItem = (index) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index) });
  };

  // Load invoices on mount
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (id) => {
    try {
      const updated = await invoiceService.updateInvoice(id, { status: 'PAID' });
      toast.success('Invoice marked as paid');
      loadInvoices();
      window.dispatchEvent(new CustomEvent('invoicesUpdated', { detail: { invoice: updated } }));
    } catch (error) {
      toast.error('Failed to update invoice');
    }
  };

  const recordPayment = async (paymentData) => {
    try {
      const updated = await invoiceService.recordPayment(selectedInvoice.id, paymentData);
      const latestPayment = updated.payments?.[updated.payments.length - 1];
      const proofHash = latestPayment?.blockchainProof?.blockHash;
      const message = proofHash ? `Payment secured on internal ledger: ${proofHash.slice(0, 12)}...` : 'Payment recorded successfully';
      setPaymentProofNotice(proofHash ? { invoiceId: updated.id, proofHash } : null);
      toast.success(message);
      loadInvoices();
      setShowPaymentModal(false);
      window.dispatchEvent(new CustomEvent('invoicesUpdated', { detail: { invoice: updated } }));
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const verifyLedger = async (id) => {
    try {
      const ledger = await invoiceService.verifyLedger(id);
      if (ledger.valid) {
        setPaymentProofNotice({ invoiceId: id, proofHash: ledger.ledgerTip });
        toast.success(`Ledger verified: ${ledger.ledgerTip.slice(0, 12)}...`);
      } else {
        toast.error('Ledger verification failed');
      }
    } catch (error) {
      toast.error('Failed to verify ledger');
    }
  };

  const writeOffInvoice = async (id, reason) => {
    try {
      const updated = await invoiceService.writeOff(id, reason);
      toast.warning('Invoice written off as bad debt');
      loadInvoices();
      window.dispatchEvent(new CustomEvent('invoicesUpdated', { detail: { invoice: updated } }));
    } catch (error) {
      toast.error('Failed to write off invoice');
    }
  };

  const deleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceService.deleteInvoice(id);
        toast.success('Invoice deleted');
        loadInvoices();
        window.dispatchEvent(new CustomEvent('invoicesUpdated', { detail: { invoiceId: id, deleted: true } }));
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const saveInvoice = async () => {
    const items = calculateItems();
    const amount = items.reduce((sum, item) => sum + item.amount, 0);

    if (!form.client || !form.due || amount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const newInvoice = {
        id: `INV-${Date.now()}`,
        ...form,
        items,
        amount,
        paidAmount: 0,
      };
      
      await invoiceService.createInvoice(newInvoice);
      toast.success('Invoice created successfully');
      setAddOpen(false);
      setForm(blank);
      loadInvoices();
      window.dispatchEvent(new CustomEvent('invoicesUpdated', { detail: { invoice: newInvoice } }));
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  // Calculate KPIs
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paid = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0);
  const outstanding = invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'WRITTEN_OFF').reduce((sum, inv) => sum + (inv.amount - (inv.paidAmount || 0)), 0);
  const overdue = invoices.filter(inv => inv.status === 'OVERDUE').reduce((sum, inv) => sum + (inv.amount - (inv.paidAmount || 0)), 0);
  
  // Check for overdue invoices
  const checkOverdue = async () => {
    const today = new Date();
    const overdueUpdates = invoices
      .filter(inv => inv.status !== 'PAID' && inv.status !== 'WRITTEN_OFF' && inv.status !== 'OVERDUE' && new Date(inv.due) < today)
      .map(inv => invoiceService.updateInvoice(inv.id, { status: 'OVERDUE' }));

    if (overdueUpdates.length > 0) {
      try {
        await Promise.all(overdueUpdates);
        loadInvoices();
        window.dispatchEvent(new CustomEvent('invoicesUpdated', { detail: { overdue: true } }));
      } catch (error) {
        console.error('Failed to update overdue invoices:', error);
      }
    }
  };
  
  useEffect(() => {
    if (invoices.length) {
      checkOverdue();
    }
  }, [invoices]);

  const filters = ['ALL', 'DRAFT', 'SENT', 'PENDING', 'PAID', 'OVERDUE', 'WRITTEN_OFF'];
  const filtered = invoices.filter(inv => {
    if (filter !== 'ALL' && inv.status !== filter) return false;
    if (searchTerm && !inv.client.toLowerCase().includes(searchTerm.toLowerCase()) && !inv.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusStyle = (status) => {
    const styles = {
      PAID: { background: '#d4edda', color: '#155724' },
      OVERDUE: { background: '#f8d7da', color: '#721c24' },
      PENDING: { background: '#fff3cd', color: '#856404' },
      SENT: { background: '#d1ecf1', color: '#0c5460' },
      DRAFT: { background: '#e2e3e5', color: '#383d41' },
      WRITTEN_OFF: { background: '#f5c6cb', color: '#721c24' },
      PARTIAL: { background: '#d4edda', color: '#155724' }
    };
    return styles[status] || styles.DRAFT;
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading invoices...</div>;
  }

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={5000} style={{ zIndex: 9999 }} />
      
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22}}>
        <div>
          <h1 className="page-h">Invoicing &amp; Billing</h1>
          <p className="page-sub">Create and manage client invoices, track payments, and handle collections</p>
        </div>
        {(hasRole('FINANCE_OFFICER') || hasRole('MARKETING_OFFICER')) && (
          <button className="btn btn-gold" onClick={() => setAddOpen(true)}>
            <Plus size={15}/> Create Invoice
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="g4" style={{marginBottom:20}}>
        <KPI title="Total Invoiced" value={formatCurrency(totalInvoiced)} icon={FileText} accent="var(--gold)"/>
        <KPI title="Paid" value={formatCurrency(paid)} icon={CheckCircle} accent="var(--green)" valueColor="var(--green)"/>
        <KPI title="Outstanding" value={formatCurrency(outstanding)} icon={DollarSign} accent="var(--orange)" valueColor="var(--orange)"/>
        <KPI title="Overdue" value={formatCurrency(overdue)} icon={AlertCircle} accent="var(--red)" valueColor="var(--red)"/>
      </div>

      {/* Invoices table */}
      <div className="card">
        <div className="sec-head invoice-table-head">
          <span className="sec-title">All Invoices</span>
          <div className="invoice-table-tools">
            <div className="invoice-filter-tabs">
              {filters.map(f => (
                <button 
                  key={f} 
                  className={`tab-btn ${filter===f?'active':''}`} 
                  style={{padding:'5px 10px',marginBottom:0,fontSize:'0.72rem'}} 
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              className="invoice-search"
              type="text"
              placeholder="Search by client or invoice #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {paymentProofNotice && (
          <div className="invoice-ledger-notice">
            <ShieldCheck size={17} />
            <div>
              <strong>Payment secured for {paymentProofNotice.invoiceId}</strong>
              <span>{paymentProofNotice.proofHash}</span>
            </div>
            <button className="icon-btn" onClick={() => setPaymentProofNotice(null)}>Dismiss</button>
          </div>
        )}

        <div className="invoice-table-wrap">
        <table className="tbl invoice-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Issue</th>
              <th>Due</th>
              <th className="num">Amount</th>
              <th className="num">Paid</th>
              <th className="num">Balance</th>
              <th>Ledger</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => {
              const balance = inv.amount - (inv.paidAmount || 0);
              return (
                <tr key={inv.id}>
                  <td className="invoice-id">{inv.id}</td>
                  <td className="invoice-client">
                    <b>{inv.client}</b>
                    {inv.clientEmail && <span>{inv.clientEmail}</span>}
                  </td>
                  <td className="date">{inv.issue}</td>
                  <td className={inv.status === 'OVERDUE' ? 'date overdue' : 'date'}>{inv.due}</td>
                  <td className="num strong">{formatCurrency(inv.amount)}</td>
                  <td className="num paid">{formatCurrency(inv.paidAmount || 0)}</td>
                  <td className={balance > 0 ? 'num balance outstanding' : 'num balance settled'}>{formatCurrency(balance)}</td>
                  <td>
                    {inv.blockchainLedgerTip ? (
                        <span className="badge ledger-badge secured" title={inv.blockchainLedgerTip}>Secured</span>
                      ) : (
                        <span className="badge ledger-badge empty">None</span>
                      )}
                  </td>
                  <td>
                    <span className="badge" style={getStatusStyle(inv.status)}>
                      {inv.status === 'PARTIAL' ? 'PARTIAL' : inv.status}
                    </span>
                  </td>
                  <td className="invoice-actions-cell">
                    <InvoiceActions 
                      invoice={inv}
                      readOnly={isAuditor}
                      onStatusChange={markPaid}
                      onDelete={deleteInvoice}
                      onRecordPayment={(inv) => {
                        setSelectedInvoice(inv);
                        setShowPaymentModal(true);
                        }}
                        onVerifyLedger={verifyLedger}
                      />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {/* Overdue alert */}
        {overdue > 0 && (
          <div className="alert-box alert-red" style={{marginTop:16}}>
            <AlertCircle size={16} color="var(--red)" style={{flexShrink:0}}/>
            <div>
              <div style={{color:'var(--red)',fontWeight:700,marginBottom:2}}>Overdue Invoices Alert</div>
              <div style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>
                You have {invoices.filter(i=>i.status==='OVERDUE').length} overdue invoice(s) totaling {formatCurrency(overdue)}. 
                Please follow up with clients immediately.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create New Invoice">
        <div className="form-grid">
          <Field label="Client Name *" span={2}>
            <Inp value={form.client} placeholder="Client name" onChange={e=>setForm({...form,client:e.target.value})}/>
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Client Email">
            <Inp type="email" value={form.clientEmail} placeholder="client@example.com" onChange={e=>setForm({...form,clientEmail:e.target.value})}/>
          </Field>
          <Field label="Client Phone">
            <Inp value={form.clientPhone} placeholder="+266 1234 5678" onChange={e=>setForm({...form,clientPhone:e.target.value})}/>
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Issue Date">
            <Inp type="date" value={form.issue} onChange={e=>setForm({...form,issue:e.target.value})}/>
          </Field>
          <Field label="Due Date">
            <Inp type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/>
          </Field>
        </div>
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Invoice Items</div>
          {form.items.map((item, index) => {
            const lineAmount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
            return (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 90px 120px 120px auto', gap: 8, alignItems: 'end', marginBottom: 8 }}>
                <Field label={index === 0 ? 'Description' : ''}>
                  <Inp value={item.description} placeholder="Radio Advertising Service" onChange={e=>updateLineItem(index,'description',e.target.value)}/>
                </Field>
                <Field label={index === 0 ? 'Qty' : ''}>
                  <Inp type="number" min="1" value={item.quantity} onChange={e=>updateLineItem(index,'quantity',e.target.value)}/>
                </Field>
                <Field label={index === 0 ? 'Rate' : ''}>
                  <Inp type="number" min="0" value={item.rate} placeholder="50000" onChange={e=>updateLineItem(index,'rate',e.target.value)}/>
                </Field>
                <Field label={index === 0 ? 'Line Total' : ''}>
                  <Inp value={formatCurrency(lineAmount)} disabled />
                </Field>
                <button className="btn btn-ghost" style={{ padding: '8px 10px' }} onClick={() => removeLineItem(index)} disabled={form.items.length === 1}>
                  <Trash2 size={14}/>
                </button>
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <button className="btn btn-ghost" onClick={addLineItem}><Plus size={14}/> Add Item</button>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--gold)' }}>
              Total: {formatCurrency(formAmount)}
            </div>
          </div>
        </div>
        <div className="form-grid">
          <Field label="Status">
            <Sel value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              <option>DRAFT</option>
              <option>PENDING</option>
              <option>SENT</option>
            </Sel>
          </Field>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn btn-gold" onClick={saveInvoice}>Create Invoice</button>
        </div>
      </Modal>

      {/* Payment Modal */}
      {selectedInvoice && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onRecordPayment={recordPayment}
        />
      )}
    </div>
  );
};

export default Invoices;
