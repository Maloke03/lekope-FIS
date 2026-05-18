import React, { useState } from 'react';
import { Modal } from '../common/UI';
import { formatCurrency } from '../../utils/invoiceUtils';

const PaymentModal = ({ isOpen, onClose, invoice, onRecordPayment }) => {
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'CASH',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'MOMO', label: 'Mobile Money' },
    { value: 'CREDIT_CARD', label: 'Credit Card' }
  ];

  const handleSubmit = () => {
    if (!paymentData.amount || paymentData.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    const remaining = invoice.amount - (invoice.paidAmount || 0);
    if (paymentData.amount > remaining) {
      alert(`Payment amount cannot exceed remaining balance of ${formatCurrency(remaining)}`);
      return;
    }
    
    onRecordPayment(paymentData);
    onClose();
  };

  const remainingBalance = invoice.amount - (invoice.paidAmount || 0);
  const isFullPayment = paymentData.amount >= remainingBalance;

  return (
    <Modal open={isOpen} onClose={onClose} title={`Record Payment - ${invoice.id}`}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-hover)', padding: 15, borderRadius: 8, marginBottom: 15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Client:</span>
            <strong>{invoice.client}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Total Amount:</span>
            <strong style={{ color: 'var(--gold)' }}>{formatCurrency(invoice.amount)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Already Paid:</span>
            <strong style={{ color: 'var(--green)' }}>{formatCurrency(invoice.paidAmount || 0)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Remaining:</span>
            <strong style={{ color: 'var(--orange)' }}>{formatCurrency(remainingBalance)}</strong>
          </div>
        </div>
        
        <div className="form-grid">
          <div>
            <label>Payment Amount *</label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
              placeholder="Enter amount"
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--border)' }}
            />
          </div>
          
          <div>
            <label>Payment Method *</label>
            <select
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--border)' }}
            >
              {paymentMethods.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label>Reference/Transaction ID</label>
            <input
              type="text"
              value={paymentData.reference}
              onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
              placeholder="Optional"
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--border)' }}
            />
          </div>
          
          <div>
            <label>Payment Date</label>
            <input
              type="date"
              value={paymentData.date}
              onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--border)' }}
            />
          </div>
          
          <div style={{ gridColumn: 'span 2' }}>
            <label>Notes</label>
            <textarea
              rows="3"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              placeholder="Optional notes"
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--border)' }}
            />
          </div>
        </div>
        
        {isFullPayment && (
          <div style={{ marginTop: 15, padding: 10, background: '#d4edda', borderRadius: 4, color: '#155724' }}>
            ✓ This will mark the invoice as FULLY PAID
          </div>
        )}
      </div>
      
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-gold" onClick={handleSubmit}>Record Payment</button>
      </div>
    </Modal>
  );
};

export default PaymentModal;