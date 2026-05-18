import React from 'react';
import { X } from 'lucide-react';
import { statusStyle } from '../../utils/helpers';


export const Badge = ({ status, icon }) => (
  <span className="badge" style={statusStyle(status)}>
    {icon && <span>{icon}</span>}{status}
  </span>
);

export const KPI = ({ title, value, trend, trendUp, sub, icon: Icon, accent='var(--gold)', valueColor }) => (
  <div className="card" style={{padding:'18px 20px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
      {Icon && <span style={{width:34,height:34,borderRadius:8,background:`${accent}18`,display:'flex',alignItems:'center',justifyContent:'center',color:accent,flexShrink:0}}><Icon size={16}/></span>}
      {trend && (
        <span style={{fontSize:'0.78rem',color:trendUp?'var(--green)':'var(--red)',display:'flex',alignItems:'center',gap:3,marginLeft:'auto'}}>
          {trendUp?'↗':'↗'} {trend}
        </span>
      )}
    </div>
    <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',marginBottom:6}}>{title}</div>
    <div style={{fontFamily:'var(--font-display)',fontSize:'1.65rem',fontWeight:700,letterSpacing:'-0.02em',color:valueColor||'var(--text-primary)',lineHeight:1.1}}>
      {value}
    </div>
    {sub && <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:4}}>{sub}</div>}
  </div>
);

export const Modal = ({open,onClose,title,children,width=520}) => {
  if(!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:width}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="icon-btn" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export const Prog = ({value, color='var(--gold)', height=6}) => (
  <div className="prog" style={{height}}>
    <div className="prog-fill" style={{width:`${Math.min(value,100)}%`,background:color}}/>
  </div>
);

export const Field = ({label,children,span}) => (
  <div className="form-field" style={span?{gridColumn:`span ${span}`}:{}}>
    <label className="form-label">{label}</label>
    {children}
  </div>
);
export const Inp = p => <input className="form-input" {...p}/>;
export const Sel = ({children,...p}) => <select className="form-select" {...p}>{children}</select>;

export const SectionCard = ({title,action,children,style:s}) => (
  <div className="card" style={s}>
    <div className="sec-head"><span className="sec-title">{title}</span>{action}</div>
    {children}
  </div>
);

export const IconGroup = ({children}) => (
  <div style={{display:'flex',gap:8,alignItems:'center'}}>{children}</div>
);
