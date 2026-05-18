import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, Calendar, Plus } from 'lucide-react';
import { KPI, Badge, Modal, Field, Inp, Sel } from '../components/common/UI';
import { ROLES, useAuth } from '../contexts/AuthContext';
import { advertiserService } from '../services/advertiserService';
import { lsl } from '../utils/helpers';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const blankAdvertiser = {
  name: '',
  industry: '',
  status: 'Active',
  contactEmail: '',
  contactPhone: '',
  campaigns: 0,
  billed: 0,
  notes: ''
};

const Advertisers = () => {
  const { user } = useAuth();
  const isAuditor = user?.role === ROLES.AUDITOR;
  const [advertisers, setAdvertisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(blankAdvertiser);

  const loadAdvertisers = async () => {
    try {
      setLoading(true);
      const data = await advertiserService.getAdvertisers();
      setAdvertisers(data);
    } catch (error) {
      toast.error('Failed to load advertisers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvertisers();
  }, []);

  const createAdvertiser = async () => {
    if (!form.name || !form.industry) {
      toast.error('Name and industry are required');
      return;
    }

    try {
      const advertiser = {
        id: `ADV-${Date.now()}`,
        ...form,
        campaigns: Number(form.campaigns),
        billed: Number(form.billed)
      };
      await advertiserService.createAdvertiser(advertiser);
      toast.success('Advertiser added successfully');
      setForm(blankAdvertiser);
      setAddOpen(false);
      loadAdvertisers();
    } catch (error) {
      toast.error(error.message || 'Failed to create advertiser');
    }
  };

  const totalAdvertisers = advertisers.length;
  const activeAdvertisers = advertisers.filter(a => a.status === 'Active').length;
  const totalBilled = advertisers.reduce((sum, a) => sum + (a.billed || 0), 0);
  const campaignCount = advertisers.reduce((sum, a) => sum + (a.campaigns || 0), 0);

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={2500} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Advertisers</h1>
          <p className="page-sub">Manage advertiser accounts, campaign status and invoice exposure.</p>
        </div>
        {!isAuditor && (
          <button className="btn btn-gold" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> New Advertiser
          </button>
        )}
      </div>

      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Advertiser Accounts" value={totalAdvertisers} icon={Users} accent="var(--gold)" />
        <KPI title="Active Clients" value={activeAdvertisers} icon={CheckCircle} accent="var(--green)" />
        <KPI title="Total Billed" value={lsl(totalBilled)} icon={FileText} accent="var(--blue)" />
        <KPI title="Live Campaigns" value={campaignCount} icon={Calendar} accent="var(--purple)" />
      </div>

      <div className="card">
        <div className="sec-head"><span className="sec-title">Advertiser Portfolio</span></div>
        {loading ? (
          <div style={{ padding: 20 }}>Loading advertisers...</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Advertiser</th>
                <th>Industry</th>
                <th>Campaigns</th>
                <th>Billing</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {advertisers.map(ad => (
                <tr key={ad.id}>
                  <td><b>{ad.name}</b></td>
                  <td>{ad.industry}</td>
                  <td>{ad.campaigns}</td>
                  <td style={{ fontFamily:'var(--font-display)', fontWeight:700 }}>{lsl(ad.billed)}</td>
                  <td><Badge status={ad.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Advertiser">
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
          <Field label="Advertiser Name"><Inp value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Industry"><Inp value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></Field>
          <Field label="Contact Email"><Inp type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></Field>
          <Field label="Contact Phone"><Inp value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} /></Field>
          <Field label="Status"><Sel value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Prospective">Prospective</option>
            <option value="Completed">Completed</option>
          </Sel></Field>
          <Field label="Campaigns"><Inp type="number" value={form.campaigns} onChange={e => setForm({ ...form, campaigns: e.target.value })} /></Field>
          <Field label="Total Billed"><Inp type="number" value={form.billed} onChange={e => setForm({ ...form, billed: e.target.value })} /></Field>
          <Field label="Notes" span={2}><Inp value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn btn-gold" onClick={createAdvertiser}>Save Advertiser</button>
        </div>
      </Modal>
    </div>
  );
};

export default Advertisers;
