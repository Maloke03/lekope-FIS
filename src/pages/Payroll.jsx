import React, { useState, useEffect } from 'react';
import { Users, DollarSign, CreditCard, AlertCircle, Plus, CheckCircle, Edit, Trash2, Calendar, Search, X } from 'lucide-react';
import { KPI, Badge, Modal, Field, Inp, Sel, Prog } from '../components/common/UI';
import { payrollService } from '../services/payrollService';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../contexts/AuthContext';

const DEPT_COLORS = { 
  Broadcasting: '#f5c518', 
  Sales: '#22c55e', 
  Finance: '#3b82f6', 
  Technical: '#a855f7', 
  Management: '#f97316' 
};

const DEPTS = ['Broadcasting', 'Sales', 'Finance', 'Technical', 'Management'];

const Payroll = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalGross: 0,
    totalTax: 0,
    totalNSSF: 0,
    totalNet: 0,
    employeeCount: 0,
    pending: 0,
    paid: 0,
    deptSummary: [],
    statutoryRemittance: {}
  });
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('run');

  const blank = { 
    name: '', 
    role: '', 
    department: 'Broadcasting', 
    gross: '', 
    tax: '', 
    nssf: '', 
    net: '', 
    status: 'Pending',
    bankAccount: '',
    notes: ''
  };
  const [form, setForm] = useState(blank);

  // Get current month and year
  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYearNum = currentDate.getFullYear();

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const month = selectedMonth || currentMonthName;
      const year = selectedYear || currentYearNum;
      
      const [payrollData, summaryData, monthsData] = await Promise.all([
        payrollService.getPayroll(month, year),
        payrollService.getPayrollSummary(),
        payrollService.getPayrollMonths()
      ]);
      
      setStaff(payrollData);
      setSummary(summaryData);
      setMonths(monthsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const autoCalc = (gross) => {
    const g = Number(gross) || 0;
    const tax = Math.round(g * 0.12);
    const nssf = Math.round(g * 0.03);
    const net = g - tax - nssf;
    return { tax, nssf, net };
  };

  const saveEmployee = async () => {
    if (!form.name || !form.gross) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const calculations = autoCalc(form.gross);
      const employeeData = {
        id: `PAY${Date.now()}`,
        ...form,
        gross: Number(form.gross),
        tax: calculations.tax,
        nssf: calculations.nssf,
        net: calculations.net,
        month: selectedMonth || currentMonthName,
        year: selectedYear || currentYearNum
      };
      
      if (editMode && selectedEmployee) {
        await payrollService.updatePayroll(selectedEmployee.id, employeeData);
        toast.success('Employee updated successfully!');
      } else {
        await payrollService.createPayroll(employeeData);
        toast.success('Employee added to payroll successfully!');
      }
      
      setAddOpen(false);
      setEditMode(false);
      setSelectedEmployee(null);
      setForm(blank);
      loadData();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(error.response?.data?.error || 'Failed to save employee');
    }
  };

  const deleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to remove this employee from payroll?')) {
      try {
        await payrollService.deletePayroll(id);
        toast.success('Employee removed from payroll');
        loadData();
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to delete employee');
      }
    }
  };

  const editEmployee = (employee) => {
    setEditMode(true);
    setSelectedEmployee(employee);
    setForm({
      name: employee.name,
      role: employee.role,
      department: employee.department,
      gross: employee.gross,
      tax: employee.tax,
      nssf: employee.nssf,
      net: employee.net,
      status: employee.status,
      bankAccount: employee.bankAccount || '',
      notes: employee.notes || ''
    });
    setAddOpen(true);
  };

  const markAsPaid = async (id) => {
    try {
      await payrollService.updateStatus(id, 'Paid');
      toast.success('Employee marked as paid');
      loadData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Failed to update status');
    }
  };

  const markAllPaid = async () => {
    if (window.confirm('Mark all pending employees as paid for this month?')) {
      try {
        await payrollService.markAllAsPaid();
        toast.success('All pending employees marked as paid');
        loadData();
      } catch (error) {
        console.error('Error marking all as paid:', error);
        toast.error('Failed to mark all as paid');
      }
    }
  };

  const handleMonthChange = (e) => {
    const [month, year] = e.target.value.split('|');
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const totalGross = staff.reduce((s, p) => s + p.gross, 0);
  const totalTax = staff.reduce((s, p) => s + p.tax, 0);
  const totalNSSF = staff.reduce((s, p) => s + p.nssf, 0);
  const totalNet = staff.reduce((s, p) => s + p.net, 0);
  const pending = staff.filter(p => p.status === 'Pending').length;

  const filteredStaff = staff.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading payroll data...</div>;
  }

  // Staff member view - personal payslips only
  if (user?.role === 'STAFF') {
    return (
      <div className="page">
        <ToastContainer position="top-right" autoClose={3000} />
        
        <div style={{ marginBottom: 22 }}>
          <h1 className="page-h">My Payslips</h1>
          <p className="page-sub">View your salary details and payment history</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 30 }}>
          <KPI title="Current Month Gross" value={formatCurrency(6000)} icon={DollarSign} color="#f5c518" />
          <KPI title="Tax Deducted" value={formatCurrency(900)} icon={CreditCard} color="#ef4444" />
          <KPI title="NSSF Contribution" value={formatCurrency(300)} icon={Users} color="#f97316" />
          <KPI title="Net Pay" value={formatCurrency(4800)} icon={CheckCircle} color="#22c55e" />
        </div>

        <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: 15, color: 'var(--text-primary)' }}>Recent Payslips</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span>March 2026</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(4800)}</span>
              <Badge status="Paid" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span>February 2026</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(4800)}</span>
              <Badge status="Paid" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span>January 2026</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(4800)}</span>
              <Badge status="Paid" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Payroll Management</h1>
          <p className="page-sub">Staff salaries, PAYE, NSSF deductions &amp; net pay</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedMonth ? `${selectedMonth}|${selectedYear}` : ''}
              onChange={handleMonthChange}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)' }}
            >
              <option value="">Current Month ({currentMonthName} {currentYearNum})</option>
              {months.map(m => (
                <option key={`${m.month}|${m.year}`} value={`${m.month}|${m.year}`}>
                  {m.month} {m.year} ({m.count} employees)
                </option>
              ))}
            </select>
          </div>
          {user?.role !== 'AUDITOR' && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={markAllPaid}>
                <CheckCircle size={14} /> Mark All Paid
              </button>
              <button className="btn btn-gold" onClick={() => { setEditMode(false); setForm(blank); setAddOpen(true); }}>
                <Plus size={15} /> Add Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Gross Payroll" value={formatCurrency(totalGross)} sub={`${staff.length} employees`} icon={Users} accent="var(--gold)" />
        <KPI title="PAYE Deducted" value={formatCurrency(totalTax)} sub="12% of gross" icon={DollarSign} accent="var(--red)" />
        <KPI title="NSSF Deducted" value={formatCurrency(totalNSSF)} sub="3% of gross" icon={DollarSign} accent="var(--orange)" />
        <KPI title="Net Disbursed" value={formatCurrency(totalNet)} sub={`${pending} pending`} icon={CreditCard} accent="var(--green)" valueColor="var(--green)" />
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {[
          ['run', 'Payroll Run'],
          ['dept', 'By Department'],
          ['summary', 'Pay Summary']
        ].map(([id, label]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── PAYROLL RUN ── */}
      {tab === 'run' && (
        <div className="card">
          <div className="sec-head">
            <span className="sec-title">
              {selectedMonth || currentMonthName} {selectedYear || currentYearNum} Payroll Run
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '6px 10px 6px 30px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', width: 200 }}
                />
              </div>
              {pending > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.1)', border: '1px solid #f9731633', borderRadius: 6, padding: '5px 10px' }}>
                  <AlertCircle size={13} color="#f97316" />
                  <span style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 600 }}>
                    {pending} pending payment{pending > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <table className="tbl">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Department</th>
                <th style={{ textAlign: 'right' }}>Gross</th>
                <th style={{ textAlign: 'right' }}>PAYE (12%)</th>
                <th style={{ textAlign: 'right' }}>NSSF (3%)</th>
                <th style={{ textAlign: 'right' }}>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(p => (
                <tr key={p.id}>
                  <td><b>{p.name}</b></td>
                  <td style={{ fontSize: '0.82rem' }}>{p.role}</td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${DEPT_COLORS[p.department]}18`,
                      color: DEPT_COLORS[p.department]
                    }}>
                      {p.department}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {formatCurrency(p.gross)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', color: 'var(--red)' }}>
                    ({formatCurrency(p.tax)})
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', color: 'var(--orange)' }}>
                    ({formatCurrency(p.nssf)})
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--green)', fontSize: '0.95rem' }}>
                    {formatCurrency(p.net)}
                  </td>
                  <td>
                    <select
                      value={p.status}
                      onChange={(e) => markAsPaid(p.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: `1px solid ${p.status === 'Paid' ? '#22c55e' : '#f97316'}`,
                        background: p.status === 'Paid' ? '#22c55e20' : '#f9731620',
                        color: p.status === 'Paid' ? '#22c55e' : '#f97316',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Pending" style={{ background: '#fff', color: '#f97316' }}>Pending</option>
                      <option value="Paid" style={{ background: '#fff', color: '#22c55e' }}>Paid</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {user?.role !== 'AUDITOR' && (
                        <>
                          <button className="icon-btn" onClick={() => editEmployee(p)}><Edit size={14} /></button>
                          <button className="icon-btn" onClick={() => deleteEmployee(p.id)}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-hover)' }}>
                <td colSpan={3} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', padding: '12px 14px' }}>
                  TOTALS
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, padding: '12px 14px' }}>
                  {formatCurrency(totalGross)}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--red)', padding: '12px 14px' }}>
                  ({formatCurrency(totalTax)})
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--orange)', padding: '12px 14px' }}>
                  ({formatCurrency(totalNSSF)})
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green)', fontSize: '1.05rem', padding: '12px 14px' }}>
                  {formatCurrency(totalNet)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
          
          {filteredStaff.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              No employees found for this month
            </div>
          )}
        </div>
      )}

      {/* ── BY DEPARTMENT ── */}
      {tab === 'dept' && (
        <div className="card">
          <div className="sec-head"><span className="sec-title">Payroll by Department</span></div>
          {summary.deptSummary.map(d => {
            const pct = summary.totalGross > 0 ? Math.round((d.total / summary.totalGross) * 100) : 0;
            return (
              <div key={d.dept} style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: DEPT_COLORS[d.dept], display: 'inline-block' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.dept}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.count} staff</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(d.total)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pct}%</span>
                  </div>
                </div>
                <Prog value={pct} color={DEPT_COLORS[d.dept]} />
              </div>
            );
          })}
        </div>
      )}

      {/* ── PAY SUMMARY ── */}
      {tab === 'summary' && (
        <div className="g2">
          <div className="card">
            <div className="sec-head"><span className="sec-title">Payroll Breakdown</span></div>
            {[
              ['Gross Payroll', summary.totalGross, 'var(--text-primary)', 100],
              ['PAYE Deductions', summary.totalTax, 'var(--red)', summary.totalGross > 0 ? Math.round((summary.totalTax / summary.totalGross) * 100) : 0],
              ['NSSF Contributions', summary.totalNSSF, 'var(--orange)', summary.totalGross > 0 ? Math.round((summary.totalNSSF / summary.totalGross) * 100) : 0],
              ['Net Disbursed', summary.totalNet, 'var(--green)', summary.totalGross > 0 ? Math.round((summary.totalNet / summary.totalGross) * 100) : 0],
            ].map(([label, val, color, pct]) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color }}>{formatCurrency(val)}</span>
                </div>
                <Prog value={pct} color={color} />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{pct}% of gross</div>
              </div>
            ))}
          </div>
          
          <div className="card">
            <div className="sec-head"><span className="sec-title">Statutory Remittance</span></div>
            {[
              { label: 'PAYE to LRA', amount: summary.totalTax, due: `${selectedMonth || currentMonthName} ${selectedYear || currentYearNum}`, status: pending > 0 ? 'Pending' : 'Ready' },
              { label: 'NSSF Contribution', amount: summary.totalNSSF, due: `${selectedMonth || currentMonthName} ${selectedYear || currentYearNum}`, status: pending > 0 ? 'Pending' : 'Ready' },
              { label: 'Previous PAYE (Jan)', amount: 7680, due: 'February 2026', status: 'Paid' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{r.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Due: {r.due}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(r.amount)}</div>
                  <Badge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditMode(false); setForm(blank); }} title={editMode ? "Edit Employee" : "Add Employee to Payroll"}>
        <div className="form-grid">
          <Field label="Full Name" span={2}>
            <Inp value={form.name} placeholder="Full name" onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Role">
            <Inp value={form.role} placeholder="e.g. Radio Presenter" onChange={e => setForm({ ...form, role: e.target.value })} />
          </Field>
          <Field label="Department">
            <Sel value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </Sel>
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Gross Salary (LSL)">
            <Inp 
              type="number" 
              value={form.gross} 
              placeholder="12000" 
              onChange={e => {
                const calc = autoCalc(e.target.value);
                setForm({ ...form, gross: e.target.value, ...calc });
              }}
            />
          </Field>
          <Field label="Bank Account">
            <Inp value={form.bankAccount} placeholder="Bank account number" onChange={e => setForm({ ...form, bankAccount: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="PAYE (12%)">
            <Inp type="number" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} />
          </Field>
          <Field label="NSSF (3%)">
            <Inp type="number" value={form.nssf} onChange={e => setForm({ ...form, nssf: e.target.value })} />
          </Field>
        </div>
        <Field label="Notes">
          <Inp value={form.notes} placeholder="Additional notes" onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>
        
        {form.gross && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e33', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: 'var(--green)' }}>
            Net Pay: <strong>{formatCurrency(Number(form.gross) - Number(form.tax || 0) - Number(form.nssf || 0))}</strong>
          </div>
        )}
        
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => { setAddOpen(false); setEditMode(false); setForm(blank); }}>Cancel</button>
          <button className="btn btn-gold" onClick={saveEmployee}>{editMode ? "Update Employee" : "Add to Payroll"}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Payroll;