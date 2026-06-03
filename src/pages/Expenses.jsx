import React, { useEffect, useRef, useState } from 'react';
import { TrendingDown, AlertTriangle, Clock, Plus, Search, Filter, Download, Edit, Trash2 } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { KPI, Modal, Field, Inp, Sel, Prog } from '../components/common/UI';
import { expenseService } from '../services/expenseService';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/invoiceUtils';
import { getApiErrorMessage, isBrowserOffline, isNetworkError } from '../utils/network';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

Chart.register(...registerables);

const catColors = ['#f5c518', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#14b8a6', '#ef4444'];
const distColors = ['#f5c518', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#14b8a6', '#ef4444'];
const CATEGORIES = ['Salaries', 'Licensing', 'Equipment', 'Utilities', 'Marketing', 'Operations', 'Other'];
const STATUSES = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'];
const APPROVAL_THRESHOLD = 5000;
const DEFAULT_MONTHLY_EXPENSES = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  salaries: [],
  operations: [],
  marketing: [],
  other: []
};

const createDefaultCategories = () =>
  CATEGORIES.map(name => ({ name, actual: 0, budget: 0, used: 0 }));

const normalizeMonthlyExpenses = (monthlyData = DEFAULT_MONTHLY_EXPENSES) => ({
  labels: Array.isArray(monthlyData?.labels) && monthlyData.labels.length ? monthlyData.labels : DEFAULT_MONTHLY_EXPENSES.labels,
  salaries: Array.isArray(monthlyData?.salaries) ? monthlyData.salaries : [],
  operations: Array.isArray(monthlyData?.operations) ? monthlyData.operations : [],
  marketing: Array.isArray(monthlyData?.marketing) ? monthlyData.marketing : [],
  other: Array.isArray(monthlyData?.other) ? monthlyData.other : []
});

const Expenses = () => {
  const barRef = useRef();
  const barChart = useRef();
  const pieRef = useRef();
  const pieChart = useRef();
  
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, budget: 0, budgetUsed: 0, pendingApproval: 0 });
  const [categories, setCategories] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [monthlyExpenses, setMonthlyExpenses] = useState(DEFAULT_MONTHLY_EXPENSES);

  const blank = {
    description: '',
    category: 'Operations',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    vendor: '',
    notes: ''
  };
  const [form, setForm] = useState(blank);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);

      const fetchWithFallback = async (fn, fallback) => {
        if (isBrowserOffline()) return fallback;

        try {
          return await fn();
        } catch (error) {
          if (!isNetworkError(error)) {
            console.warn('Expense API call failed, using fallback:', getApiErrorMessage(error));
          }
          return fallback;
        }
      };

      const [expensesData, summaryData, categoriesData, monthlyData] = await Promise.all([
        fetchWithFallback(() => expenseService.getExpenses(), []),
        fetchWithFallback(() => expenseService.getExpenseSummary(), { total: 0, budget: 0, budgetUsed: 0, pendingApproval: 0 }),
        fetchWithFallback(() => expenseService.getExpenseCategories(), createDefaultCategories()),
        fetchWithFallback(() => expenseService.getMonthlyExpenses(), DEFAULT_MONTHLY_EXPENSES)
      ]);
      
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setSummary(summaryData || { total: 0, budget: 0, budgetUsed: 0, pendingApproval: 0 });
      setCategories(Array.isArray(categoriesData) && categoriesData.length ? categoriesData : createDefaultCategories());
      setMonthlyExpenses(normalizeMonthlyExpenses(monthlyData));
    } catch (error) {
      if (!isNetworkError(error)) {
        console.error('Error loading data:', error);
        toast.error('Failed to load expense data');
      }
      setExpenses([]);
      setSummary({ total: 0, budget: 0, budgetUsed: 0, pendingApproval: 0 });
      setCategories(createDefaultCategories());
      setMonthlyExpenses(DEFAULT_MONTHLY_EXPENSES);
    } finally {
      setLoading(false);
    }
  };

  const updateBarChart = (monthlyData) => {
    if (!barRef.current) return;

    if (barChart.current) {
      barChart.current.destroy();
    }

    const safeMonthlyData = normalizeMonthlyExpenses(monthlyData);
    
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: safeMonthlyData.labels,
        datasets: [
          { label: 'Salaries', data: safeMonthlyData.salaries, backgroundColor: 'rgba(245,197,24,0.8)', borderRadius: 3 },
          { label: 'Operations', data: safeMonthlyData.operations, backgroundColor: 'rgba(249,115,22,0.8)', borderRadius: 3 },
          { label: 'Marketing', data: safeMonthlyData.marketing, backgroundColor: 'rgba(59,130,246,0.8)', borderRadius: 3 },
          { label: 'Other', data: safeMonthlyData.other, backgroundColor: 'rgba(168,85,247,0.8)', borderRadius: 3 },
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
      },
    });
  };

  const updatePieChart = (categoriesData) => {
    if (!pieRef.current) return;

    if (pieChart.current) {
      pieChart.current.destroy();
    }
    
    const safeCategories = Array.isArray(categoriesData) && categoriesData.length ? categoriesData : createDefaultCategories();
    const total = safeCategories.reduce((sum, c) => sum + Number(c.actual || 0), 0);
    const hasExpenseData = total > 0;
    
    pieChart.current = new Chart(pieRef.current, {
      type: 'pie',
      data: {
        labels: hasExpenseData ? safeCategories.map(c => c.name) : ['No expenses'],
        datasets: [{
          data: hasExpenseData ? safeCategories.map(c => Number(c.actual || 0)) : [1],
          backgroundColor: distColors,
          borderColor: '#141f35',
          borderWidth: 2,
          hoverOffset: 4
        }],
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
            callbacks: {
              label: (ctx) => {
                const label = ctx.label || '';
                const value = ctx.parsed || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
              }
            }
          }
        },
      },
    });
  };

  useEffect(() => {
    if (loading) return;
    updateBarChart(monthlyExpenses);
    updatePieChart(categories);
  }, [loading, monthlyExpenses, categories]);

  useEffect(() => {
    loadData();
    return () => {
      if (barChart.current) barChart.current.destroy();
      if (pieChart.current) pieChart.current.destroy();
    };
  }, []);

  const saveExpense = async () => {
    if (!form.description || !form.amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const expenseData = {
        id: `EXP-${Date.now()}`,
        ...form,
        amount: Number(form.amount),
        recordedBy: localStorage.getItem('userId')
      };
      
      if (editMode && selectedExpense) {
        await expenseService.updateExpense(selectedExpense.id, expenseData);
        toast.success('Expense updated successfully!');
      } else {
        await expenseService.createExpense(expenseData);
        toast.success('Expense recorded successfully!');
      }
      
      setAddOpen(false);
      setEditMode(false);
      setSelectedExpense(null);
      setForm(blank);
      loadData();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error(error.response?.data?.error || 'Failed to save expense');
    }
  };

  const deleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseService.deleteExpense(id);
        toast.success('Expense deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense');
      }
    }
  };

  const editExpense = (expense) => {
    setEditMode(true);
    setSelectedExpense(expense);
    setForm({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      status: expense.status,
      vendor: expense.vendor || '',
      notes: expense.notes || ''
    });
    setAddOpen(true);
  };

  const { user } = useAuth();

  const canUpdateStatus = (expense, nextStatus) => {
    if (user?.role === ROLES.AUDITOR) return false;
    if (expense.amount > APPROVAL_THRESHOLD && ['APPROVED', 'PAID'].includes(nextStatus) && user?.role !== ROLES.STATION_MANAGER) {
      return false;
    }
    return true;
  };

  const updateStatus = async (id, newStatus, expense) => {
    if (expense?.amount > APPROVAL_THRESHOLD && ['APPROVED', 'PAID'].includes(newStatus) && user?.role !== ROLES.STATION_MANAGER) {
      toast.error('Only the Station Manager can approve high-value expenses above LSL 5,000');
      return;
    }

    try {
      await expenseService.updateExpense(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      APPROVED: { background: '#d4edda', color: '#155724' },
      PAID: { background: '#d4edda', color: '#155724' },
      PENDING: { background: '#fff3cd', color: '#856404' },
      REJECTED: { background: '#f8d7da', color: '#721c24' }
    };
    return styles[status] || styles.PENDING;
  };

  const filteredExpenses = expenses.filter(expense => {
    if (statusFilter !== 'ALL' && expense.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && expense.category !== categoryFilter) return false;
    if (searchTerm && !expense.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !expense.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading expense data...</div>;
  }

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Expense Tracking</h1>
          <p className="page-sub">Monitor and control operational expenses</p>
        </div>
        {user?.role !== ROLES.AUDITOR && (
          <button className="btn btn-gold" onClick={() => { setEditMode(false); setForm(blank); setAddOpen(true); }}>
            <Plus size={15} /> New Expense
          </button>
        )}
      </div>

      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Total Expenses" value={formatCurrency(summary.total)} icon={TrendingDown} accent="var(--red)" />
        <KPI title="Budget" value={formatCurrency(summary.budget)} icon={TrendingDown} accent="var(--blue)" />
        <KPI title="Budget Used" value={`${summary.budgetUsed}%`} icon={AlertTriangle} accent="var(--orange)" valueColor={summary.budgetUsed > 90 ? 'var(--orange)' : 'var(--text-primary)'} />
        <KPI title="Pending Approval" value={summary.pendingApproval} icon={Clock} accent="var(--gold)" />
      </div>

      {/* Category bars */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="sec-head"><span className="sec-title">Expenses by Category</span></div>
        {categories.map((c, i) => {
          const used = c.used || 0;
          const color = used >= 95 ? '#f97316' : used >= 90 ? '#f5c518' : catColors[i % catColors.length];
          return (
            <div key={c.name} style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{c.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${color}20`, color }}>
                  {used.toFixed(1)}% of budget
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                {formatCurrency(c.actual)} / {formatCurrency(c.budget)}
              </div>
              <Prog value={used} color={color} />
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="sec-head"><span className="sec-title">Monthly Expense Trend</span></div>
          <div style={{ height: 230 }}><canvas ref={barRef} /></div>
        </div>
        <div className="card">
          <div className="sec-head"><span className="sec-title">Expense Distribution</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: '0 0 160px', height: 160 }}><canvas ref={pieRef} /></div>
            <div style={{ flex: 1 }}>
              {categories.map((c, i) => {
                const total = categories.reduce((sum, cat) => sum + cat.actual, 0);
                const percentage = total > 0 ? ((c.actual / total) * 100).toFixed(1) : 0;
                return (
                  <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: distColors[i % distColors.length], display: 'inline-block' }} />
                      {c.name}
                    </span>
                    <span style={{ color: distColors[i % distColors.length], fontWeight: 600 }}>{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Expenses table */}
      <div className="card">
        <div className="sec-head">
          <span className="sec-title">All Expenses</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '6px 10px 6px 30px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', fontSize: '0.8rem', width: 150 }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="icon-btn" onClick={loadData}><Download size={16} /></button>
          </div>
        </div>
        
        <table className="tbl">
          <thead>
            <tr>
              <th>Expense ID</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(e => (
              <tr key={e.id}>
                <td style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '0.82rem' }}>{e.id}</td>
                <td><b>{e.description}</b></td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{e.category}</td>
                <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(e.amount)}</td>
                <td style={{ fontSize: '0.8rem' }}>{e.date}</td>
                <td>
                  <select
                    value={e.status}
                    onChange={(val) => updateStatus(e.id, val.target.value, e)}
                    className="badge"
                    style={getStatusStyle(e.status)}
                    disabled={user?.role === ROLES.AUDITOR}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s} disabled={!canUpdateStatus(e, s)}>{s}</option>
                    ))}
                  </select>
                  {e.amount > APPROVAL_THRESHOLD && user?.role !== ROLES.STATION_MANAGER && (
                    <div style={{ marginTop: 4, color: '#f97316', fontSize: '0.72rem' }}>
                      Requires Station Manager approval
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {user?.role !== ROLES.AUDITOR && (
                      <>
                        <button className="icon-btn" onClick={() => editExpense(e)}><Edit size={14} /></button>
                        <button className="icon-btn" onClick={() => deleteExpense(e.id)}><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
         </table>
        
        {filteredExpenses.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No expenses found
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditMode(false); setForm(blank); }} title={editMode ? "Edit Expense" : "New Expense"}>
        <div className="form-grid">
          <Field label="Description" span={2}>
            <Inp value={form.description} placeholder="Expense description" onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Category">
            <Sel value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Sel>
          </Field>
          <Field label="Amount (LSL)">
            <Inp type="number" value={form.amount} placeholder="15000" onChange={e => setForm({ ...form, amount: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Date">
            <Inp type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Status">
            <Sel value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </Sel>
          </Field>
        </div>
        <Field label="Vendor">
          <Inp value={form.vendor} placeholder="Vendor name (optional)" onChange={e => setForm({ ...form, vendor: e.target.value })} />
        </Field>
        <Field label="Notes">
          <Inp value={form.notes} placeholder="Additional notes (optional)" onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => { setAddOpen(false); setEditMode(false); setForm(blank); }}>Cancel</button>
          <button className="btn btn-gold" onClick={saveExpense}>{editMode ? "Update Expense" : "Add Expense"}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Expenses;
