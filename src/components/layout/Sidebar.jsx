import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import { getAllowedNavGroups } from '../../config/navigation';
import {
  Radio, LogOut,
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, hasRole, logout } = useAuth();

  const filteredNavGroups = getAllowedNavGroups(hasRole);

  // Get role display name
  const getRoleDisplayName = (role) => {
    const roleNames = {
      [ROLES.FINANCE_OFFICER]: 'Finance Officer',
      [ROLES.MARKETING_OFFICER]: 'Marketing Officer',
      [ROLES.STATION_MANAGER]: 'Station Manager',
      [ROLES.STAFF]: 'Staff Member',
      [ROLES.AUDITOR]: 'Auditor'
    };
    return roleNames[role] || role;
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'LF';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={isOpen ? 'app-sidebar open' : 'app-sidebar'} style={{
      width:265, height:'100vh', position:'fixed', top:0, left:0,
      background:'var(--bg-surface)', borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column', zIndex:100, overflowY:'auto',
    }}>
      {/* Brand */}
      <div style={{padding:'20px 18px 16px', borderBottom:'1px solid var(--border)', flexShrink:0}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{width:36, height:36, borderRadius:8, background:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <Radio size={18} color="#0b1220"/>
          </div>
          <div>
            <div style={{fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.05rem', color:'var(--gold)'}}>Lekope FM</div>
            <div style={{fontSize:'0.6rem', color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase'}}>Financial Information System</div>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{flex:1, padding:'10px 10px 0', overflowY:'auto'}}>
        {filteredNavGroups.map(group => (
          <div key={group.label} style={{marginBottom:8}}>
            <div style={{
              fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.1em',
              textTransform:'uppercase', color:'var(--text-muted)',
              padding:'10px 10px 6px',
            }}>
              {group.label}
            </div>
            {group.items.map(({ label, path, icon: Icon }) => {
              const active = pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path);
                    if (closeSidebar) closeSidebar();
                  }}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:10,
                    padding:'9px 12px', marginBottom:2,
                    background: active ? 'var(--gold)' : 'transparent',
                    color: active ? '#0b1220' : 'var(--text-secondary)',
                    border:'none', cursor:'pointer', borderRadius:6,
                    fontSize:'0.855rem', fontWeight: active ? 600 : 400,
                    fontFamily:'var(--font-body)', textAlign:'left', transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text-primary)'; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)'; }}}
                >
                  <Icon size={15} style={{flexShrink:0}}/>{label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer with logout */}
      <div style={{padding:'14px', borderTop:'1px solid var(--border)', flexShrink:0}}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
          <div style={{
            width:34, height:34, borderRadius:'50%', background:'var(--gold)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.8rem',
            color:'#0b1220', flexShrink:0,
          }}>{getUserInitials()}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)'}}>
              {user?.name || 'User'}
            </div>
            <div style={{fontSize:'0.72rem', color:'var(--text-muted)'}}>
              {getRoleDisplayName(user?.role)}
            </div>
          </div>
        </div>
        
        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={{
            width:'100%',
            display:'flex',
            alignItems:'center',
            gap:10,
            padding:'8px 12px',
            background:'transparent',
            border:'1px solid var(--border)',
            borderRadius:6,
            cursor:'pointer',
            color:'#dc3545',
            fontSize:'0.8rem',
            transition:'all 0.15s',
            marginTop:5
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background='#dc3545';
            e.currentTarget.style.color='white';
            e.currentTarget.style.borderColor='#dc3545';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background='transparent';
            e.currentTarget.style.color='#dc3545';
            e.currentTarget.style.borderColor='var(--border)';
          }}
        >
          <LogOut size={14}/>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
