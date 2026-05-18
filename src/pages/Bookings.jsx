import React, { useState, useEffect } from 'react';
import { Calendar, Megaphone, TrendingUp, CheckCircle, Plus } from 'lucide-react';
import { KPI, Badge, Modal, Field, Inp, Sel } from '../components/common/UI';
import { ROLES, useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import { lsl } from '../utils/helpers';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const blankBooking = {
  client: '',
  campaign: '',
  spots: 0,
  due: '',
  status: 'Pending',
  type: 'Radio Spots',
  notes: ''
};

const Bookings = () => {
  const { user } = useAuth();
  const isAuditor = user?.role === ROLES.AUDITOR;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(blankBooking);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookings();
      setBookings(data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const createBooking = async () => {
    if (!form.client || !form.campaign || !form.due) {
      toast.error('Client, campaign, and due date are required');
      return;
    }

    try {
      const booking = {
        id: `BK-${Date.now()}`,
        ...form,
        spots: Number(form.spots)
      };
      await bookingService.createBooking(booking);
      toast.success('Booking created successfully');
      setForm(blankBooking);
      setAddOpen(false);
      loadBookings();
    } catch (error) {
      toast.error(error.message || 'Failed to create booking');
    }
  };

  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const totalSpots = bookings.reduce((sum, b) => sum + (b.spots || 0), 0);
  const upcomingCount = bookings.filter(b => b.status !== 'Delivered').length;

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={2500} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Bookings</h1>
          <p className="page-sub">Track airtime bookings, delivery dates, and campaign progress.</p>
        </div>
        {!isAuditor && (
          <button className="btn btn-gold" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> New Booking
          </button>
        )}
      </div>

      <div className="g4" style={{marginBottom:20}}>
        <KPI title="Total Bookings" value={totalBookings} icon={Calendar} accent="var(--gold)" />
        <KPI title="Confirmed" value={confirmedCount} icon={CheckCircle} accent="var(--green)" />
        <KPI title="Spots Booked" value={totalSpots.toLocaleString()} icon={Megaphone} accent="var(--blue)" />
        <KPI title="Upcoming" value={upcomingCount} icon={TrendingUp} accent="var(--purple)" />
      </div>

      <div className="card">
        <div className="sec-head"><span className="sec-title">Booking Pipeline</span></div>
        {loading ? (
          <div style={{ padding: 20 }}>Loading bookings...</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Client</th>
                <th>Campaign</th>
                <th>Spots</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td style={{color:'var(--gold)',fontFamily:'var(--font-display)'}}>{b.id}</td>
                  <td>{b.client}</td>
                  <td>{b.campaign}</td>
                  <td>{b.spots}</td>
                  <td>{b.due}</td>
                  <td><Badge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Booking">
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
          <Field label="Client"><Inp value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} /></Field>
          <Field label="Campaign"><Inp value={form.campaign} onChange={e => setForm({ ...form, campaign: e.target.value })} /></Field>
          <Field label="Spots"><Inp type="number" value={form.spots} onChange={e => setForm({ ...form, spots: e.target.value })} /></Field>
          <Field label="Due Date"><Inp type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} /></Field>
          <Field label="Status"><Sel value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Delivered">Delivered</option>
            <option value="Planned">Planned</option>
            <option value="Cancelled">Cancelled</option>
          </Sel></Field>
          <Field label="Booking Type"><Sel value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="Radio Spots">Radio Spots</option>
            <option value="Sponsorship">Sponsorship</option>
            <option value="Jingle + Spots">Jingle + Spots</option>
            <option value="Programme Sponsorship">Programme Sponsorship</option>
          </Sel></Field>
          <Field label="Notes" span={2}><Inp value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn btn-gold" onClick={createBooking}>Save Booking</button>
        </div>
      </Modal>
    </div>
  );
};

export default Bookings;
