import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { KPI, Modal, Field, Inp, Sel, Badge } from '../components/common/UI';
import { userService } from '../services/userService';
import { ROLES, useAuth } from '../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.FINANCE_OFFICER,
    isActive: true
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const saveUser = async () => {
    if (!form.name || !form.email || (!editMode && !form.password)) {
      toast.error('Name, email and password are required');
      return;
    }

    try {
      if (editMode && selectedUser) {
        const updateData = {
          name: form.name,
          role: form.role,
          isActive: form.isActive
        };
        await userService.updateUser(selectedUser._id, updateData);
        toast.success('User updated successfully');
      } else {
        await userService.createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role
        });
        toast.success('User account created successfully');
      }

      setAddOpen(false);
      setEditMode(false);
      setSelectedUser(null);
      setForm({ name: '', email: '', password: '', role: ROLES.FINANCE_OFFICER, isActive: true });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save user');
    }
  };

  const editUser = (userRecord) => {
    setEditMode(true);
    setSelectedUser(userRecord);
    setForm({
      name: userRecord.name,
      email: userRecord.email,
      password: '',
      role: userRecord.role,
      isActive: userRecord.isActive ?? true
    });
    setAddOpen(true);
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user account?')) return;
    try {
      await userService.deleteUser(id);
      toast.success('User deleted');
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={2500} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">User Management</h1>
          <p className="page-sub">Create accounts, assign roles and manage user access.</p>
        </div>
        {user?.role === ROLES.STATION_MANAGER && (
          <button className="btn btn-gold" onClick={() => { setEditMode(false); setSelectedUser(null); setForm({ name: '', email: '', password: '', role: ROLES.FINANCE_OFFICER, isActive: true }); setAddOpen(true); }}>
            <Plus size={15} /> New User
          </button>
        )}
      </div>

      <div className="g3" style={{ marginBottom: 20 }}>
        <KPI title="Total Users" value={users.length} icon={Users} accent="var(--gold)" />
        <KPI title="Active Accounts" value={users.filter(u => u.isActive).length} icon={ShieldCheck} accent="var(--green)" />
        <KPI title="Manager Roles" value={users.filter(u => u.role === ROLES.STATION_MANAGER).length} icon={Users} accent="var(--blue)" />
      </div>

      <div className="card">
        <div className="sec-head" style={{ justifyContent: 'space-between' }}>
          <span className="sec-title">All Users</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', width: 220 }}
            />
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((record) => (
              <tr key={record._id}>
                <td>{record.name}</td>
                <td>{record.email}</td>
                <td>{record.role}</td>
                <td><Badge status={record.isActive ? 'Active' : 'Inactive'} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="icon-btn" onClick={() => editUser(record)}><Pencil size={14} /></button>
                    <button className="icon-btn" onClick={() => deleteUser(record._id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editMode ? 'Edit User' : 'Create User'}>
        <div className="form-grid">
          <Field label="Name" span={2}>
            <Inp value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email" span={2}>
            <Inp type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
        {!editMode && (
          <Field label="Password" span={2}>
            <Inp type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
        )}
        <div className="form-grid">
          <Field label="Role">
            <Sel value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value={ROLES.STATION_MANAGER}>Station Manager</option>
              <option value={ROLES.FINANCE_OFFICER}>Finance Officer</option>
              <option value={ROLES.MARKETING_OFFICER}>Marketing Officer</option>
              <option value={ROLES.STAFF}>Staff Member</option>
              <option value={ROLES.AUDITOR}>Auditor</option>
            </Sel>
          </Field>
          <Field label="Active">
            <Sel value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Sel>
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn btn-gold" onClick={saveUser}>{editMode ? 'Save changes' : 'Create user'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
