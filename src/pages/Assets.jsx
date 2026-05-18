import React, { useState, useEffect } from 'react';
import { Database, Plus, Pencil, AlertTriangle, Trash2, RefreshCw, Search, Filter, Truck, Monitor, Mic, Radio, Cpu } from 'lucide-react';
import { KPI, Badge, Prog, Modal, Field, Inp, Sel } from '../components/common/UI';
import { assetService } from '../services/assetService';
import { formatCurrency } from '../utils/invoiceUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CATEGORIES = ['Studio Equipment', 'Broadcast', 'IT', 'Vehicles', 'Furniture', 'Other'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'End of Life'];
const STATUSES = ['Active', 'Disposed', 'Under Repair', 'In Storage'];

const categoryIcons = {
  'Studio Equipment': <Mic size={14} />,
  'Broadcast': <Radio size={14} />,
  'IT': <Cpu size={14} />,
  'Vehicles': <Truck size={14} />,
  'Furniture': <Database size={14} />,
  'Other': <Database size={14} />
};

const categoryColors = {
  'Studio Equipment': 'var(--gold)',
  'Broadcast': 'var(--blue)',
  'IT': 'var(--teal)',
  'Vehicles': 'var(--orange)',
  'Furniture': 'var(--purple)',
  'Other': 'var(--text-muted)'
};

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalCost: 0,
    totalAccum: 0,
    totalNBV: 0,
    annualDep: 0,
    nearEOLCount: 0,
    nearEOLList: [],
    categorySummary: [],
    assetsByAge: {}
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterCat, setFilterCat] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const blank = { 
    name: '', category: 'Studio Equipment', brand: '', model: '', 
    purchaseDate: '', cost: '', accumulated: '0', netBook: '', life: 5,
    serialNumber: '', location: '', condition: 'Good', status: 'Active', notes: ''
  };
  const [form, setForm] = useState(blank);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [assetsData, summaryData] = await Promise.all([
        assetService.getAssets(),
        assetService.getAssetSummary()
      ]);
      
      setAssets(assetsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load asset data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateNBV = (cost, accumulated) => {
    const costNum = Number(cost) || 0;
    const accumNum = Number(accumulated) || 0;
    return costNum - accumNum;
  };

  const saveAsset = async () => {
    if (!form.name || !form.cost || !form.purchaseDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const netBook = calculateNBV(form.cost, form.accumulated);
      const assetData = {
        id: editItem ? editItem : `AST${Date.now()}`,
        ...form,
        cost: Number(form.cost),
        accumulated: Number(form.accumulated) || 0,
        netBook: netBook,
        life: Number(form.life)
      };
      
      if (editItem) {
        await assetService.updateAsset(editItem, assetData);
        toast.success('Asset updated successfully!');
      } else {
        await assetService.createAsset(assetData);
        toast.success('Asset added successfully!');
      }
      
      setAddOpen(false);
      setEditItem(null);
      setForm(blank);
      loadData();
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(error.response?.data?.error || 'Failed to save asset');
    }
  };

  const deleteAsset = async (id) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await assetService.deleteAsset(id);
        toast.success('Asset deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting asset:', error);
        toast.error('Failed to delete asset');
      }
    }
  };

  const openEdit = (asset) => {
    setEditItem(asset.id);
    setForm({
      name: asset.name,
      category: asset.category,
      brand: asset.brand,
      model: asset.model,
      purchaseDate: asset.purchaseDate,
      cost: asset.cost,
      accumulated: asset.accumulated,
      life: asset.life,
      serialNumber: asset.serialNumber || '',
      location: asset.location || '',
      condition: asset.condition || 'Good',
      status: asset.status || 'Active',
      notes: asset.notes || ''
    });
    setAddOpen(true);
  };

  const calculateDepreciation = async () => {
    try {
      await assetService.calculateDepreciation();
      toast.success('Depreciation calculated and updated');
      loadData();
    } catch (error) {
      console.error('Error calculating depreciation:', error);
      toast.error('Failed to calculate depreciation');
    }
  };

  const getDepreciationPercent = (asset) => {
    return Math.round((asset.accumulated / asset.cost) * 100);
  };

  const getDepreciationColor = (percent) => {
    if (percent >= 75) return 'var(--red)';
    if (percent >= 50) return 'var(--orange)';
    return 'var(--gold)';
  };

  const getConditionColor = (condition) => {
    const colors = {
      'Excellent': '#22c55e',
      'Good': '#3b82f6',
      'Fair': '#f97316',
      'Poor': '#ef4444',
      'End of Life': '#6c757d'
    };
    return colors[condition] || '#6c757d';
  };

  const filtered = assets.filter(asset => {
    if (filterCat !== 'all' && asset.category !== filterCat) return false;
    if (searchTerm && !asset.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !asset.brand.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalCost = assets.reduce((s, a) => s + a.cost, 0);
  const totalAccum = assets.reduce((s, a) => s + a.accumulated, 0);
  const totalNBV = assets.reduce((s, a) => s + a.netBook, 0);
  const annualDep = assets.reduce((s, a) => s + Math.round(a.cost / a.life), 0);
  const remainingPercent = totalCost > 0 ? (totalNBV / totalCost) * 100 : 0;

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading asset data...</div>;
  }

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-h">Fixed Asset Register</h1>
          <p className="page-sub">Studio &amp; broadcast equipment — depreciation &amp; lifecycle tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={calculateDepreciation}>
            <RefreshCw size={15} /> Update Depreciation
          </button>
          <button className="btn btn-gold" onClick={() => { setEditItem(null); setForm(blank); setAddOpen(true); }}>
            <Plus size={15} /> Add Asset
          </button>
        </div>
      </div>

      {/* Near EOL warning */}
      {summary.nearEOLCount > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444433', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>{summary.nearEOLCount} asset{summary.nearEOLCount > 1 ? 's' : ''}</span> are over 70% depreciated and may need replacement planning.
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="g4" style={{ marginBottom: 20 }}>
        <KPI title="Total Asset Cost" value={formatCurrency(totalCost)} sub="Historical cost" icon={Database} accent="var(--gold)" />
        <KPI title="Accumulated Dep." value={formatCurrency(totalAccum)} sub="Total written off" icon={Database} accent="var(--orange)" />
        <KPI title="Net Book Value" value={formatCurrency(totalNBV)} sub="Current carrying val" icon={Database} accent="var(--blue)" />
        <KPI title="Annual Dep. Charge" value={formatCurrency(annualDep)} sub="Straight-line method" icon={Database} accent="var(--purple)" />
      </div>

      {/* Value progress */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="sec-head">
          <span className="sec-title">Asset Portfolio Value</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {remainingPercent.toFixed(1)}% remaining book value
          </span>
        </div>
        <Prog value={remainingPercent} color="var(--blue)" height={10} />
        <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span><span style={{ color: 'var(--blue)' }}>● </span>Net Book Value {formatCurrency(totalNBV)}</span>
          <span><span style={{ color: 'var(--orange)' }}>● </span>Accumulated Dep. {formatCurrency(totalAccum)}</span>
          <span><span style={{ color: 'var(--text-muted)' }}>● </span>Original Cost {formatCurrency(totalCost)}</span>
        </div>
      </div>

      {/* Category Summary */}
      <div className="g3" style={{ marginBottom: 16 }}>
        {summary.categorySummary.map(cat => (
          <div key={cat.category} className="card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {categoryIcons[cat.category]}
              <span style={{ fontWeight: 600, color: categoryColors[cat.category] }}>{cat.category}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cat.count} items</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              {formatCurrency(cat.totalNBV)} / {formatCurrency(cat.totalCost)}
            </div>
          </div>
        ))}
      </div>

      {/* Asset table */}
      <div className="card">
        <div className="sec-head">
          <span className="sec-title">Equipment Register</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '6px 10px 6px 30px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', width: 180 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', ...CATEGORIES].map(c => (
                <button 
                  key={c} 
                  className={`tab-btn ${filterCat === c ? 'active' : ''}`} 
                  style={{ padding: '4px 10px', marginBottom: 0, fontSize: '0.72rem' }} 
                  onClick={() => setFilterCat(c)}
                >
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <table className="tbl">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Brand / Model</th>
              <th>Purchased</th>
              <th style={{ textAlign: 'right' }}>Cost</th>
              <th style={{ textAlign: 'right' }}>Acc. Dep.</th>
              <th style={{ textAlign: 'right' }}>NBV</th>
              <th>Condition</th>
              <th>Depreciation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const depPct = getDepreciationPercent(a);
              return (
                <tr key={a.id}>
                  <td><b>{a.name}</b></td>
                  <td>
                    <span style={{ color: categoryColors[a.category] || 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                      {categoryIcons[a.category]} {a.category}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--text-primary)' }}>{a.brand}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{a.model}</div>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{a.purchaseDate}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {formatCurrency(a.cost)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', color: 'var(--orange)' }}>
                    ({formatCurrency(a.accumulated)})
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--blue)' }}>
                    {formatCurrency(a.netBook)}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: `${getConditionColor(a.condition)}20`,
                      color: getConditionColor(a.condition)
                    }}>
                      {a.condition}
                    </span>
                  </td>
                  <td style={{ width: 130 }}>
                    <Prog value={depPct} color={getDepreciationColor(depPct)} height={5} />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{depPct}% depreciated</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="icon-btn" onClick={() => openEdit(a)}><Pencil size={13} /></button>
                      <button className="icon-btn" onClick={() => deleteAsset(a.id)}><Trash2 size={13} color="#ef4444" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--bg-hover)' }}>
              <td colSpan={4} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', padding: '12px 14px' }}>
                TOTALS
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, padding: '12px 14px' }}>
                {formatCurrency(totalCost)}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--orange)', padding: '12px 14px' }}>
                ({formatCurrency(totalAccum)})
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--blue)', fontSize: '1rem', padding: '12px 14px' }}>
                {formatCurrency(totalNBV)}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
        
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No assets found
          </div>
        )}
      </div>

      {/* Add/Edit Asset Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditItem(null); }} title={editItem ? 'Edit Asset' : 'Add Fixed Asset'}>
        <div className="form-grid">
          <Field label="Asset Name" span={2}>
            <Inp value={form.name} placeholder="e.g. Sony Recording Mic" onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Category">
            <Sel value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Sel>
          </Field>
          <Field label="Condition">
            <Sel value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </Sel>
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Brand">
            <Inp value={form.brand} placeholder="e.g. Shure" onChange={e => setForm({ ...form, brand: e.target.value })} />
          </Field>
          <Field label="Model">
            <Inp value={form.model} placeholder="e.g. SM7B" onChange={e => setForm({ ...form, model: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Serial Number">
            <Inp value={form.serialNumber} placeholder="Serial number" onChange={e => setForm({ ...form, serialNumber: e.target.value })} />
          </Field>
          <Field label="Location">
            <Inp value={form.location} placeholder="Studio A, Storage, etc." onChange={e => setForm({ ...form, location: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Purchase Date">
            <Inp type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
          </Field>
          <Field label="Useful Life (yrs)">
            <Inp type="number" value={form.life} min="1" max="20" onChange={e => setForm({ ...form, life: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Cost (LSL)">
            <Inp type="number" value={form.cost} placeholder="85000" onChange={e => setForm({ ...form, cost: e.target.value })} />
          </Field>
          <Field label="Accumulated Dep.">
            <Inp type="number" value={form.accumulated} placeholder="0" onChange={e => setForm({ ...form, accumulated: e.target.value })} />
          </Field>
        </div>
        <Field label="Notes">
          <Inp value={form.notes} placeholder="Additional notes" onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>
        
        {form.cost && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e33', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: 'var(--green)' }}>
            Current Book Value: <strong>{formatCurrency(calculateNBV(form.cost, form.accumulated))}</strong>
          </div>
        )}
        
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => { setAddOpen(false); setEditItem(null); }}>Cancel</button>
          <button className="btn btn-gold" onClick={saveAsset}>{editItem ? 'Save Changes' : 'Add Asset'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Assets;