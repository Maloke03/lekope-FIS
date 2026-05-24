import React, { useEffect, useState } from 'react';
import { Clock, Activity, Search } from 'lucide-react';
import { KPI } from '../components/common/UI';
import { auditService } from '../services/auditService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AuditLog = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await auditService.getLoginHistory();
      setEntries(data);
    } catch (error) {
      toast.error('Failed to load audit history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const filteredEntries = entries.filter((entry) => {
    const term = searchTerm.toLowerCase();
    return (
      entry.email?.toLowerCase().includes(term) ||
      entry.status?.toLowerCase().includes(term) ||
      entry.reason?.toLowerCase().includes(term) ||
      entry.ipAddress?.toLowerCase().includes(term)
    );
  });

  const formatDate = (value) => new Date(value).toLocaleString();

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={2500} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Audit Log</h1>
          <p className="page-sub">Review system access history and login activity.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={loadEntries}><Activity size={14} /> Refresh</button>
        </div>
      </div>

      <div className="g3" style={{ marginBottom: 20 }}>
        <KPI title="Total Entries" value={entries.length} icon={Clock} accent="var(--gold)" />
        <KPI title="Failed Logins" value={entries.filter(e => e.status === 'FAILED').length} icon={Activity} accent="var(--red)" />
        <KPI title="Successful Logins" value={entries.filter(e => e.status === 'SUCCESS').length} icon={Activity} accent="var(--green)" />
      </div>

      <div className="card">
        <div className="sec-head" style={{ justifyContent: 'space-between' }}>
          <span className="sec-title">Login History</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Filter by email, status, IP or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', width: 260 }}
            />
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User / Email</th>
              <th>Status</th>
              <th>Reason</th>
              <th>IP Address</th>
              <th>Agent</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr key={entry._id}>
                <td>{formatDate(entry.createdAt)}</td>
                <td>{entry.user?.name || entry.email || 'Unknown'}</td>
                <td>{entry.status}</td>
                <td>{entry.reason || 'N/A'}</td>
                <td>{entry.ipAddress || 'N/A'}</td>
                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.userAgent || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;
