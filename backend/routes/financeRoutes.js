const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const { protect } = require('../middleware/authMiddleware');
const { isFinanceManager, canViewReports } = require('../middleware/roleMiddleware');

// Get financial summary (dashboard KPIs)
router.get('/summary', protect, canViewReports, async (req, res) => {
  try {
    const invoices = await Invoice.find();
    
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paid = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'WRITTEN_OFF')
      .reduce((sum, inv) => sum + (inv.amount - (inv.paidAmount || 0)), 0);
    const overdue = invoices.filter(inv => inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + (inv.amount - (inv.paidAmount || 0)), 0);
    
    res.json({
      totalInvoiced,
      paid,
      outstanding,
      overdue,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'PAID').length,
      overdueInvoices: invoices.filter(i => i.status === 'OVERDUE').length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Get aging report
router.get('/aging', protect, isFinanceManager, async (req, res) => {
  try {
    const invoices = await Invoice.find({ status: { $nin: ['PAID', 'WRITTEN_OFF'] } });
    const today = new Date();
    
    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days120: 0
    };
    
    invoices.forEach(inv => {
      const dueDate = new Date(inv.due);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const balance = inv.amount - (inv.paidAmount || 0);
      
      if (daysOverdue <= 0) aging.current += balance;
      else if (daysOverdue <= 30) aging.days30 += balance;
      else if (daysOverdue <= 60) aging.days60 += balance;
      else if (daysOverdue <= 90) aging.days90 += balance;
      else aging.days120 += balance;
    });
    
    res.json(aging);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch aging report' });
  }
});

module.exports = router;