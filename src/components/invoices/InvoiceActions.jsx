// src/components/invoices/InvoiceActions.jsx
import React, { useState } from 'react';
import { Eye, Send, DollarSign, FileText, Trash2, Printer, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { formatCurrency, generateInvoicePDF, generateWhatsAppMessage, sendViaEmailClient, printInvoice } from '../../utils/invoiceUtils';

const InvoiceActions = ({ invoice, onStatusChange, onDelete, onRecordPayment, onVerifyLedger, readOnly = false }) => {
  const [showWriteOff, setShowWriteOff] = useState(false);
  const [writeOffReason, setWriteOffReason] = useState('');

  const companyDetails = {
    name: 'Leloke FM',
    address: '123 Main Street, Maseru, Lesotho',
    phone: '+266 1234 5678',
    email: 'finance@lekopefm.co.ls'
  };

  const handlePDFDownload = () => {
    generateInvoicePDF(invoice, companyDetails);
  };

  const handlePrint = () => {
    printInvoice(invoice, companyDetails);
  };

  const handleWhatsApp = () => {
    const message = generateWhatsAppMessage(invoice);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    sendViaEmailClient(invoice);
  };

  const handleWriteOff = () => {
    if (writeOffReason) {
      onStatusChange(invoice.id, 'WRITTEN_OFF', { reason: writeOffReason });
      setShowWriteOff(false);
      setWriteOffReason('');
    }
  };

  const getAvailableActions = () => {
    const actions = [];
    
    actions.push({ icon: Eye, label: 'View', onClick: () => {}, color: 'var(--text-secondary)' });
    actions.push({ icon: FileText, label: 'PDF', onClick: handlePDFDownload, color: 'var(--gold)' });
    actions.push({ icon: Printer, label: 'Print', onClick: handlePrint, color: '#6c757d' });

    if (invoice.blockchainLedgerTip && onVerifyLedger) {
      actions.push({
        icon: ShieldCheck,
        label: 'Verify',
        onClick: () => onVerifyLedger(invoice.id),
        color: 'var(--green)'
      });
    }
    
    if (invoice.status !== 'PAID' && invoice.status !== 'WRITTEN_OFF') {
      if (invoice.clientEmail) {
        actions.push({ icon: Send, label: 'Email', onClick: handleEmail, color: '#4a90e2' });
      }
      actions.push({ icon: Send, label: 'WhatsApp', onClick: handleWhatsApp, color: '#25D366' });
    }

    if (!readOnly) {
      if (invoice.status !== 'PAID' && invoice.status !== 'WRITTEN_OFF') {
        const remaining = invoice.amount - (invoice.paidAmount || 0);
        actions.push({ 
          icon: DollarSign, 
          label: `Pay (${formatCurrency(remaining)})`, 
          onClick: () => onRecordPayment(invoice),
          color: 'var(--green)'
        });
      }

      if (invoice.status === 'PENDING' || invoice.status === 'SENT') {
        actions.push({ 
          icon: CheckCircle, 
          label: 'Paid', 
          onClick: () => onStatusChange(invoice.id, 'PAID'),
          color: '#28a745'
        });
      }

      if ((invoice.status === 'OVERDUE' || invoice.status === 'PENDING') && invoice.status !== 'WRITTEN_OFF') {
        actions.push({ 
          icon: AlertTriangle, 
          label: 'Write Off', 
          onClick: () => setShowWriteOff(true),
          color: '#dc3545'
        });
      }

      if (invoice.status === 'DRAFT') {
        actions.push({ 
          icon: Trash2, 
          label: 'Delete', 
          onClick: () => onDelete(invoice.id),
          color: '#dc3545'
        });
      }
    }
    
    return actions;
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {getAvailableActions().map((action, idx) => (
          <button
            key={idx}
            className="icon-btn"
            onClick={action.onClick}
            title={action.label}
            style={{ color: action.color }}
          >
            <action.icon size={14} />
            <span style={{ fontSize: '10px', marginLeft: 3 }}>{action.label}</span>
          </button>
        ))}
      </div>
      
      {/* Write Off Modal */}
      {showWriteOff && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            padding: 24,
            borderRadius: 8,
            width: 400,
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <AlertTriangle size={24} color="#dc3545" />
              <h3>Write Off Invoice</h3>
            </div>
            
            <p>Write off invoice <strong>{invoice.id}</strong> for <strong>{formatCurrency(invoice.amount)}</strong>?</p>
            
            <textarea
              placeholder="Reason for write-off"
              value={writeOffReason}
              onChange={(e) => setWriteOffReason(e.target.value)}
              rows="3"
              style={{
                width: '100%',
                padding: 8,
                marginBottom: 20,
                borderRadius: 4,
                border: '1px solid var(--border)'
              }}
            />
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowWriteOff(false)}>Cancel</button>
              <button 
                className="btn" 
                onClick={handleWriteOff}
                style={{ background: '#dc3545', color: 'white' }}
                disabled={!writeOffReason}
              >
                Confirm Write Off
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoiceActions;
