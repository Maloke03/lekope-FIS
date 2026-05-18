// src/utils/invoiceUtils.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LS', {
    style: 'currency',
    currency: 'LSL',
    minimumFractionDigits: 2
  }).format(amount);
};

// Generate Invoice PDF - Fixed version
export const generateInvoicePDF = (invoice, companyDetails) => {
  // Initialize jsPDF
  const doc = new jsPDF();
  
  // Company Logo/Header
  doc.setFillColor(212, 175, 55); // Gold color
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.text('INVOICE', 20, 30);
  
  // Company Info (Right side)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(companyDetails.name, 140, 20);
  doc.text(companyDetails.address, 140, 28);
  doc.text(`Tel: ${companyDetails.phone}`, 140, 36);
  doc.text(`Email: ${companyDetails.email}`, 140, 44);
  
  // Invoice Details
  doc.setFontSize(10);
  doc.text(`Invoice Number: ${invoice.id}`, 20, 65);
  doc.text(`Issue Date: ${invoice.issue}`, 20, 73);
  doc.text(`Due Date: ${invoice.due}`, 20, 81);
  
  // Client Details
  doc.text('Bill To:', 20, 100);
  doc.text(invoice.client, 20, 108);
  if (invoice.clientEmail) doc.text(invoice.clientEmail, 20, 116);
  if (invoice.clientPhone) doc.text(invoice.clientPhone, 20, 124);
  
  // Prepare table data
  const tableData = invoice.items && invoice.items.length > 0 
    ? invoice.items.map(item => [
        item.description,
        item.quantity.toString(),
        formatCurrency(item.rate),
        formatCurrency(item.amount)
      ])
    : [['Radio Advertising Services', '1', formatCurrency(invoice.amount), formatCurrency(invoice.amount)]];
  
  // Add table using autoTable
  doc.autoTable({
    startY: 145,
    head: [['Description', 'Qty', 'Rate (LSL)', 'Amount (LSL)']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [212, 175, 55], 
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 20, right: 20 }
  });
  
  // Get final Y position after table
  const finalY = doc.lastAutoTable.finalY + 10;
  
  // Calculate totals
  const subtotal = invoice.amount;
  const vat = subtotal * 0.15;
  const total = subtotal + vat;
  
  // Add totals
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Subtotal: ${formatCurrency(subtotal)}`, 140, finalY);
  doc.text(`VAT (15%): ${formatCurrency(vat)}`, 140, finalY + 8);
  doc.setFontSize(12);
  doc.setTextColor(212, 175, 55);
  doc.text(`Total Due: ${formatCurrency(total)}`, 140, finalY + 20);
  
  // Payment Instructions
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('Payment Instructions:', 20, finalY + 45);
  doc.text('Bank: First National Bank', 20, finalY + 53);
  doc.text('Account Name: Leloke FM', 20, finalY + 61);
  doc.text('Account Number: 62812345678', 20, finalY + 69);
  doc.text('Reference: Please use invoice number as reference', 20, finalY + 77);
  
  // Terms
  doc.text('Terms & Conditions:', 20, finalY + 95);
  doc.text('Payment is due within 30 days of invoice date.', 20, finalY + 103);
  doc.text('Late payments may incur a 5% monthly interest charge.', 20, finalY + 111);
  
  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text('Thank you for choosing Leloke FM', 105, finalY + 135, { align: 'center' });
  
  // Download PDF
  doc.save(`Invoice_${invoice.id}_${invoice.client}.pdf`);
  return doc;
};

// Generate WhatsApp message
export const generateWhatsAppMessage = (invoice) => {
  const message = `🏢 *LELOKE FM INVOICE* 🎙️

Dear *${invoice.client}*,

Please find attached invoice *${invoice.id}* for the amount of *${formatCurrency(invoice.amount)}*.

📅 Issue Date: ${invoice.issue}
📅 Due Date: ${invoice.due}

💳 *Payment Details:*
Bank: First National Bank
Account: Leloke FM
Account Number: 62812345678
Reference: ${invoice.id}

Thank you for your business!

*Leloke FM Finance Department*`;

  return encodeURIComponent(message);
};

// Send via Email - Opens default email client
export const sendViaEmailClient = (invoice) => {
  const subject = `Invoice ${invoice.id} from Leloke FM`;
  const body = `Dear ${invoice.client},

Please find attached invoice ${invoice.id} for ${formatCurrency(invoice.amount)} due on ${invoice.due}.

Payment Details:
Bank: First National Bank
Account: Leloke FM
Account Number: 62812345678
Reference: ${invoice.id}

Thank you for your business!

Best regards,
Leloke FM Finance Department
Tel: +266 1234 5678
Email: finance@lekopefm.co.ls`;

  window.location.href = `mailto:${invoice.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

// Print Invoice
export const printInvoice = (invoice, companyDetails) => {
  const printWindow = window.open('', '_blank');
  const totalWithVAT = invoice.amount * 1.15;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #d4af37; padding: 20px; margin-bottom: 20px; overflow: hidden; }
        .invoice-title { font-size: 28px; font-weight: bold; float: left; }
        .company-info { float: right; text-align: right; }
        .client-info { margin: 20px 0; padding: 15px; background: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #d4af37; color: #000; }
        .total { text-align: right; margin-top: 20px; padding: 15px; background: #f5f5f5; }
        .footer { margin-top: 40px; font-size: 12px; text-align: center; color: #666; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="invoice-title">INVOICE</div>
        <div class="company-info">
          <h3>${companyDetails.name}</h3>
          <p>${companyDetails.address}<br>
          Tel: ${companyDetails.phone}<br>
          Email: ${companyDetails.email}</p>
        </div>
      </div>
      
      <div class="client-info">
        <p><strong>Invoice #:</strong> ${invoice.id}<br>
        <strong>Issue Date:</strong> ${invoice.issue}<br>
        <strong>Due Date:</strong> ${invoice.due}<br>
        <strong>Client:</strong> ${invoice.client}<br>
        ${invoice.clientEmail ? `<strong>Email:</strong> ${invoice.clientEmail}<br>` : ''}
        ${invoice.clientPhone ? `<strong>Phone:</strong> ${invoice.clientPhone}` : ''}</p>
      </div>
      
      <table>
        <thead>
          <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Radio Advertising Services</td>
            <td>1</td>
            <td>${formatCurrency(invoice.amount)}</td>
            <td>${formatCurrency(invoice.amount)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="total">
        <p>Subtotal: ${formatCurrency(invoice.amount)}<br>
        VAT (15%): ${formatCurrency(invoice.amount * 0.15)}<br>
        <strong>Total: ${formatCurrency(totalWithVAT)}</strong></p>
      </div>
      
      <div class="footer">
        <p>Thank you for choosing Leloke FM</p>
        <p><em>"Commit to the LORD whatever you do, and your plans will succeed." - Proverbs 16:3</em></p>
        <p class="no-print"><button onclick="window.print()">Print</button> <button onclick="window.close()">Close</button></p>
      </div>
    </body>
    </html>
  `);
  
  printWindow.document.close();
};