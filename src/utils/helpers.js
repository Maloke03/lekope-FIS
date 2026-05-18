export const lsl = (n) => {
  if (n === null || n === undefined) return 'LSL 0';
  return `LSL ${Math.abs(n).toLocaleString('en-LS')}`;
};

export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-ZA',{day:'2-digit',month:'short',year:'numeric'});
};

export const pct = (a,b) => b===0 ? 0 : Math.round((a/b)*100);

export const statusStyle = (s) => {
  const m = {
    PAID:      {bg:'rgba(34,197,94,0.15)',  color:'#22c55e', border:'#22c55e44'},
    COMPLETED: {bg:'rgba(34,197,94,0.15)',  color:'#22c55e', border:'#22c55e44'},
    APPROVED:  {bg:'rgba(34,197,94,0.15)',  color:'#22c55e', border:'#22c55e44'},
    PENDING:   {bg:'rgba(249,115,22,0.15)', color:'#f97316', border:'#f9731644'},
    OVERDUE:   {bg:'rgba(239,68,68,0.15)',  color:'#ef4444', border:'#ef444444'},
    SENT:      {bg:'rgba(96,165,250,0.15)', color:'#60a5fa', border:'#60a5fa44'},
    DRAFT:     {bg:'rgba(74,96,128,0.15)',  color:'#8ba0bc', border:'#8ba0bc44'},
    'On Track':{bg:'rgba(34,197,94,0.15)',  color:'#22c55e', border:'#22c55e44'},
    'Over budget':{bg:'rgba(239,68,68,0.12)', color:'#ef4444', border:'#ef444444'},
    Watch:     {bg:'rgba(249,115,22,0.12)', color:'#f97316', border:'#f9731644'},
    Monitor:   {bg:'rgba(249,115,22,0.15)', color:'#f97316', border:'#f9731644'},
    HIGH:      {bg:'transparent', color:'#ef4444', border:'transparent'},
    MEDIUM:    {bg:'transparent', color:'#f97316', border:'transparent'},
    LOW:       {bg:'transparent', color:'#22c55e', border:'transparent'},
  };
  const r=m[s]||{bg:'rgba(74,96,128,0.15)',color:'#8ba0bc',border:'#8ba0bc44'};
  return {background:r.bg, color:r.color, border:`1px solid ${r.border}`};
};
