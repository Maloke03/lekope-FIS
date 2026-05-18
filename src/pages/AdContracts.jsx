import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Eye, TrendingUp, Radio, Calendar, Tag, Bell, FileText } from 'lucide-react';
import { KPI, Badge, Modal, Prog, Field, Inp, Sel } from '../components/common/UI';
import { ROLES, useAuth } from '../contexts/AuthContext';
import { invoiceService } from '../services/invoiceService';
import { lsl, fmtDate } from '../utils/helpers';

const initialContracts = [
  { id:'ADC001', client:'Standard Lesotho Bank', campaign:'Spring Promo',       type:'Radio Spots',   spots:120, aired:95,  startDate:'2026-03-01', endDate:'2026-03-31', value:45000,  ratePerSpot:375, status:'Active'    },
  { id:'ADC002', client:'Vodacom Lesotho',       campaign:'Summer Campaign',     type:'Sponsorship',   spots:150, aired:30,  startDate:'2026-03-10', endDate:'2026-04-10', value:60000,  ratePerSpot:400, status:'Active'    },
  { id:'ADC003', client:'Maluti Brewery',        campaign:'Beer Festival',       type:'Radio Spots',   spots:90,  aired:90,  startDate:'2026-02-15', endDate:'2026-03-15', value:35000,  ratePerSpot:389, status:'Completed' },
  { id:'ADC004', client:'NUL',                   campaign:'Enrollment Drive',    type:'Radio Spots',   spots:80,  aired:0,   startDate:'2026-03-20', endDate:'2026-04-30', value:25000,  ratePerSpot:313, status:'Pending'   },
  { id:'ADC005', client:'Shoprite Lesotho',      campaign:'Easter Sales',        type:'Jingle + Spots',spots:60,  aired:42,  startDate:'2026-03-01', endDate:'2026-04-05', value:28000,  ratePerSpot:467, status:'Active'    },
  { id:'ADC006', client:'Econet Telecom',        campaign:'Brand Awareness',     type:'Sponsorship',   spots:100, aired:100, startDate:'2026-02-01', endDate:'2026-02-28', value:38000,  ratePerSpot:380, status:'Completed' },
  { id:'ADC007', client:'Lesotho Post Bank',     campaign:'Digital Banking Push',type:'Radio Spots',   spots:75,  aired:0,   startDate:'2026-04-01', endDate:'2026-04-30', value:22000,  ratePerSpot:293, status:'Upcoming'  },
];

const AD_TYPES = ['Radio Spots','Sponsorship','Jingle + Spots','Programme Sponsorship','Outside Broadcast','Digital Streaming'];
const TIME_SLOTS = ['Morning Drive (05:30–08:00)','Mid-Morning (08:00–11:00)','Midday (11:00–14:00)','Afternoon Drive (15:00–18:00)','Evening (18:00–21:00)','Weekend Special'];

const AdContracts = () => {
  const { user } = useAuth();
  const isAuditor = user?.role === ROLES.AUDITOR;
  const [contracts, setContracts] = useState(initialContracts);
  const [addOpen, setAddOpen]     = useState(false);
  const [viewItem, setViewItem]   = useState(null);
  const [filter, setFilter]       = useState('all');
  const blank = { client:'', campaign:'', type:'Radio Spots', spots:'', aired:0, startDate:'', endDate:'', value:'', ratePerSpot:'', status:'Pending' };
  const [form, setForm]           = useState(blank);
  const [invoices, setInvoices]   = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(true);

  const totalValue   = contracts.reduce((s,c) => s + c.value, 0);
  const activeVal    = contracts.filter(c=>c.status==='Active').reduce((s,c)=>s+c.value, 0);
  const totalSpots   = contracts.reduce((s,c) => s + c.spots, 0);
  const totalAired   = contracts.reduce((s,c) => s + c.aired, 0);
  const rateValues   = invoices.flatMap(inv => inv.items || []).map(item => item.rate || 0);
  const uniqueRates  = new Set(rateValues).size;
  const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING' || inv.status === 'SENT').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE').length;
  const reminderCount = pendingInvoices + overdueInvoices;

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter);

  const save = () => {
    if (!form.client || !form.value) return;
    setContracts([{ id:`ADC${Date.now()}`, ...form, spots:Number(form.spots), aired:0, value:Number(form.value), ratePerSpot:Number(form.ratePerSpot||0) }, ...contracts]);
    setAddOpen(false); setForm(blank);
  };

  const loadInvoices = async () => {
    try {
      setInvoiceLoading(true);
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();

    const handleUpdate = () => loadInvoices();
    window.addEventListener('invoicesUpdated', handleUpdate);
    return () => window.removeEventListener('invoicesUpdated', handleUpdate);
  }, []);

  const statusColor = { Active:'var(--green)', Completed:'var(--blue)', Pending:'var(--orange)', Upcoming:'var(--purple)' };

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22}}>
        <div>
          <h1 className="page-h">Ad Contracts &amp; Airtime</h1>
          <p className="page-sub">Manage advertising campaigns, spot bookings &amp; airtime revenue</p>
        </div>
        {!isAuditor && (
          <button className="btn btn-gold" onClick={() => setAddOpen(true)}><Plus size={15}/>New Contract</button>
        )}
      </div>

      {/* Marketing Officer landing summary */}
      <div className="g3" style={{ marginBottom: 20 }}>
        <KPI
          title="Rate Card"
          value={`${uniqueRates} tiers`}
          sub="Active pricing packages"
          icon={Megaphone}
          accent="var(--gold)"
        />
        <KPI
          title="Invoice Status"
          value={`${pendingInvoices} pending`}
          sub={`${overdueInvoices} soon due`}
          icon={FileText}
          accent="var(--blue)"
        />
        <KPI
          title="Payment Reminders"
          value={`${reminderCount} reminders`}
          sub="Follow up with clients"
          icon={Calendar}
          accent="var(--purple)"
        />
      </div>

      {/* KPIs */}
      <div className="g4" style={{marginBottom:20}}>
        <KPI title="Total Contract Value" value={lsl(totalValue)}       sub="All campaigns"           icon={Megaphone}  accent="var(--gold)"   />
        <KPI title="Active Campaigns"     value={contracts.filter(c=>c.status==='Active').length} sub={lsl(activeVal)+' active value'} icon={Radio} accent="var(--green)" />
        <KPI title="Spots Booked"         value={totalSpots.toLocaleString()}  sub="Total across all campaigns" icon={Calendar}   accent="var(--blue)"   />
        <KPI title="Spots Aired"          value={totalAired.toLocaleString()}  sub={`${Math.round((totalAired/totalSpots)*100)}% delivery rate`} icon={TrendingUp} accent="var(--purple)" />
      </div>

      <div className="g4" style={{marginBottom:20}}>
        <KPI title="Rate Card" value={invoiceLoading ? 'Loading...' : uniqueRates} sub="Distinct invoice rates" icon={Tag} accent="var(--pink)" />
        <KPI title="Invoice Status" value={invoiceLoading ? 'Loading...' : pendingInvoices} sub="Pending invoices" icon={FileText} accent="var(--cyan)" />
        <KPI title="Payment Reminders" value={invoiceLoading ? 'Loading...' : reminderCount} sub="Invoices needing follow-up" icon={Bell} accent="var(--orange)" />
      </div>

      {/* Delivery progress */}
      <div className="card" style={{marginBottom:16}}>
        <div className="sec-head">
          <span className="sec-title">Overall Spots Delivery</span>
          <span style={{fontFamily:'var(--font-display)',fontWeight:700,color:'var(--text-muted)',fontSize:'0.85rem'}}>{Math.round((totalAired/totalSpots)*100)}% delivered</span>
        </div>
        <Prog value={(totalAired/totalSpots)*100} color="var(--gold)" height={10}/>
        <div style={{display:'flex',gap:20,marginTop:10,fontSize:'0.78rem',color:'var(--text-muted)'}}>
          <span><span style={{color:'var(--gold)'}}>● </span>Aired: {totalAired} spots</span>
          <span><span style={{color:'var(--border-light)'}}>● </span>Remaining: {totalSpots - totalAired} spots</span>
        </div>
      </div>

      {/* Contracts table */}
      <div className="card">
        <div className="sec-head">
          <span className="sec-title">All Contracts</span>
          <div style={{display:'flex',gap:4}}>
            {['all','Active','Pending','Upcoming','Completed'].map(f => (
              <button key={f} className={`tab-btn ${filter===f?'active':''}`} style={{padding:'5px 10px',marginBottom:0,fontSize:'0.72rem'}} onClick={() => setFilter(f)}>
                {f==='all'?'All':f}
              </button>
            ))}
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Contract ID</th><th>Client</th><th>Campaign</th><th>Type</th>
              <th>Duration</th><th style={{textAlign:'right'}}>Value</th>
              <th>Spots</th><th>Delivery</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const delivPct = c.spots > 0 ? Math.round((c.aired/c.spots)*100) : 0;
              return (
                <tr key={c.id}>
                  <td style={{color:'var(--gold)',fontFamily:'var(--font-display)',fontSize:'0.8rem'}}>{c.id}</td>
                  <td><b>{c.client}</b></td>
                  <td style={{fontSize:'0.82rem'}}>{c.campaign}</td>
                  <td><span style={{fontSize:'0.75rem',fontWeight:600,color:'var(--blue)'}}>{c.type}</span></td>
                  <td style={{fontSize:'0.78rem'}}>
                    <div>{fmtDate(c.startDate)}</div>
                    <div style={{color:'var(--text-muted)'}}>→ {fmtDate(c.endDate)}</div>
                  </td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-display)',fontWeight:700,color:'var(--text-primary)'}}>{lsl(c.value)}</td>
                  <td style={{fontFamily:'var(--font-display)',fontSize:'0.85rem'}}>
                    <span style={{color:'var(--text-primary)'}}>{c.aired}</span>
                    <span style={{color:'var(--text-muted)'}}>/{c.spots}</span>
                  </td>
                  <td style={{width:110}}>
                    <Prog value={delivPct} color={delivPct>=90?'var(--green)':delivPct>=50?'var(--gold)':'var(--orange)'} height={5}/>
                    <span style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>{delivPct}%</span>
                  </td>
                  <td><Badge status={c.status}/></td>
                  <td>
                    <button className="icon-btn" onClick={() => setViewItem(c)}><Eye size={14}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Contract — ${viewItem?.id}`}>
        {viewItem && (
          <div>
            <div style={{background:'var(--bg-hover)',borderRadius:10,padding:'14px 16px',marginBottom:18}}>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'1.1rem',color:'var(--gold)',marginBottom:2}}>{lsl(viewItem.value)}</div>
              <div style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>{viewItem.campaign} — {viewItem.client}</div>
            </div>
            {[
              ['Client',      viewItem.client],
              ['Campaign',    viewItem.campaign],
              ['Type',        viewItem.type],
              ['Start Date',  fmtDate(viewItem.startDate)],
              ['End Date',    fmtDate(viewItem.endDate)],
              ['Contract Value', lsl(viewItem.value)],
              ['Rate/Spot',   lsl(viewItem.ratePerSpot)],
              ['Spots Booked', viewItem.spots],
              ['Spots Aired',  viewItem.aired],
              ['Delivery',    `${Math.round((viewItem.aired/viewItem.spots)*100)}%`],
              ['Status',      viewItem.status],
            ].map(([l,v]) => (
              <div key={l} style={{display:'flex',justifyContent:'space-between',paddingBottom:10,marginBottom:10,borderBottom:'1px solid var(--border)'}}>
                <span style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{l}</span>
                <span style={{color:'var(--text-primary)',fontWeight:500,fontSize:'0.85rem'}}>{v}</span>
              </div>
            ))}
            <Prog value={Math.round((viewItem.aired/viewItem.spots)*100)} color="var(--gold)" height={8}/>
            <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:6}}>{viewItem.aired} of {viewItem.spots} spots aired</div>
          </div>
        )}
      </Modal>

      {/* Add contract modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Ad Contract" width={580}>
        <div className="form-grid">
          <Field label="Client Name"><Inp value={form.client} placeholder="e.g. Vodacom Lesotho" onChange={e=>setForm({...form,client:e.target.value})}/></Field>
          <Field label="Campaign Name"><Inp value={form.campaign} placeholder="e.g. Easter Promo" onChange={e=>setForm({...form,campaign:e.target.value})}/></Field>
        </div>
        <div className="form-grid">
          <Field label="Ad Type"><Sel value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{AD_TYPES.map(t=><option key={t}>{t}</option>)}</Sel></Field>
          <Field label="Preferred Time Slot"><Sel onChange={()=>{}}><option value="">— Select —</option>{TIME_SLOTS.map(t=><option key={t}>{t}</option>)}</Sel></Field>
        </div>
        <div className="form-grid">
          <Field label="Start Date"><Inp type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></Field>
          <Field label="End Date"><Inp type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></Field>
        </div>
        <div className="form-grid">
          <Field label="Contract Value (LSL)"><Inp type="number" value={form.value} placeholder="45000" onChange={e=>setForm({...form,value:e.target.value})}/></Field>
          <Field label="Total Spots"><Inp type="number" value={form.spots} placeholder="120" onChange={e=>setForm({...form,spots:e.target.value})}/></Field>
        </div>
        <Field label="Rate Per Spot (LSL)"><Inp type="number" value={form.ratePerSpot} placeholder="375" onChange={e=>setForm({...form,ratePerSpot:e.target.value})}/></Field>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn btn-gold" onClick={save}>Create Contract</button>
        </div>
      </Modal>
    </div>
  );
};

export default AdContracts;
