import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { KPI, Modal, Field, Inp, Sel } from '../components/common/UI';
import { rateCardService } from '../services/rateCardService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth, ROLES } from '../contexts/AuthContext';

const defaultRates = [
  { id: 'RATE-1', name: 'Morning Drive', description: '05:30 AM – 08:00 AM slot', category: 'Prime Time', rate: 9000 },
  { id: 'RATE-2', name: 'Midday', description: '08:00 AM – 12:00 PM slot', category: 'Daytime', rate: 6800 },
  { id: 'RATE-3', name: 'Afternoon', description: '12:00 PM – 04:00 PM slot', category: 'Daytime', rate: 6200 },
  { id: 'RATE-4', name: 'Drive Home', description: '04:00 PM – 07:00 PM slot', category: 'Prime Time', rate: 9800 },
  { id: 'RATE-5', name: 'Evening', description: '07:00 PM – 10:00 PM slot', category: 'Off Peak', rate: 4200 },
];

const RateCard = () => {
  const { user } = useAuth();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'Prime Time', rate: '' });

  const loadRates = async () => {
    try {
      setLoading(true);
      const data = await rateCardService.getRates();
      setRates(data.length ? data : defaultRates);
    } catch (error) {
      setRates(defaultRates);
      toast.warn('Rate card service unavailable. Using local default rates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const openNewRate = () => {
    setEditMode(false);
    setSelectedRate(null);
    setForm({ name: '', description: '', category: 'Prime Time', rate: '' });
    setShowModal(true);
  };

  const editRate = (rateItem) => {
    setEditMode(true);
    setSelectedRate(rateItem);
    setForm({
      name: rateItem.name,
      description: rateItem.description,
      category: rateItem.category,
      rate: rateItem.rate
    });
    setShowModal(true);
  };

  const saveRate = async () => {
    if (!form.name || !form.rate) {
      toast.error('Please complete the rate card item first.');
      return;
    }

    try {
      const data = {
        name: form.name,
        description: form.description,
        category: form.category,
        rate: Number(form.rate)
      };

      if (editMode && selectedRate) {
        await rateCardService.updateRate(selectedRate.id, data);
        toast.success('Rate card item updated successfully.');
      } else {
        await rateCardService.createRate({ id: `RATE-${Date.now()}`, ...data });
        toast.success('Rate card item created successfully.');
      }

      setShowModal(false);
      setEditMode(false);
      setSelectedRate(null);
      loadRates();
    } catch (error) {
      console.error('Rate card save error:', error);
      toast.error('Failed to save rate card item. Check permissions or backend connection.');
    }
  };

  const deleteRate = async (rateId) => {
    if (!window.confirm('Delete this rate card item?')) return;
    try {
      await rateCardService.deleteRate(rateId);
      toast.success('Rate card item deleted successfully.');
      loadRates();
    } catch (error) {
      console.error('Rate card delete error:', error);
      toast.error('Failed to delete rate card item.');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading rate card...</div>;
  }

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Rate Card Management</h1>
          <p className="page-sub">Configure airtime slot rates, add rate items, and keep pricing aligned with campaigns.</p>
        </div>
        <button className="btn btn-gold" onClick={openNewRate}>
          <Plus size={15} /> New Rate
        </button>
      </div>

      <div className="g3" style={{ marginBottom: 20 }}>
        <KPI title="Rate Items" value={rates.length} icon={Plus} accent="var(--gold)" />
        <KPI title="Default Prime Rate" value={`LSL ${rates[0]?.rate?.toLocaleString() || '0'}`} icon={TrendingUp} accent="var(--green)" />
        <KPI title="Station Manager Only" value={user?.role === ROLES.STATION_MANAGER ? 'Enabled' : 'Restricted'} icon={Edit} accent="var(--blue)" />
      </div>

      <div className="card">
        <div className="sec-head">
          <span className="sec-title">Rate Card Items</span>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage published slot pricing and campaign rate definitions.</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Rate (LSL)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.id}>
                <td><strong>{rate.name}</strong></td>
                <td>{rate.category}</td>
                <td>{rate.description}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)' }}>{Number(rate.rate).toLocaleString('en-LS')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="icon-btn" onClick={() => editRate(rate)}><Edit size={14} /></button>
                    <button className="icon-btn" onClick={() => deleteRate(rate.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditMode(false); setSelectedRate(null); }} title={editMode ? 'Edit Rate Item' : 'New Rate Item'}>
        <div className="form-grid">
          <Field label="Slot Name" span={2}>
            <Inp value={form.name} placeholder="Morning Drive" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Category">
            <Sel value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Prime Time</option>
              <option>Daytime</option>
              <option>Off Peak</option>
              <option>Special Campaign</option>
            </Sel>
          </Field>
          <Field label="Rate (LSL)">
            <Inp type="number" value={form.rate} placeholder="8800" onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </Field>
        </div>
        <Field label="Description" span={2}>
          <Inp value={form.description} placeholder="05:30 AM – 08:00 AM slot" onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => { setShowModal(false); setEditMode(false); setSelectedRate(null); }}>Cancel</button>
          <button className="btn btn-gold" onClick={saveRate}>{editMode ? 'Save Changes' : 'Create Rate'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default RateCard;
