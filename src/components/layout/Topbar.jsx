import React, { useState } from 'react';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const now = new Date().toLocaleDateString('en-US', {
    weekday:'long',
    month:'long',
    day:'numeric',
    year:'numeric'
  });

  // Get role display name and badge color
  const getRoleInfo = () => {
    const roleConfig = {
      [ROLES.FINANCE_OFFICER]: { name: 'Finance Officer', color: '#fbbf24', badge: '💰' },
      [ROLES.MARKETING_OFFICER]: { name: 'Marketing Officer', color: '#60a5fa', badge: '📣' },
      [ROLES.STATION_MANAGER]: { name: 'Station Manager', color: '#34d399', badge: '🎙️' },
      [ROLES.STAFF]: { name: 'Staff Member', color: '#f472b6', badge: '🎤' },
      [ROLES.AUDITOR]: { name: 'Auditor', color: '#a78bfa', badge: '🔎' }
    };
    return roleConfig[user?.role] || { name: user?.role, color: '#888', badge: '👤' };
  };

  const roleInfo = getRoleInfo();

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
    <header style={{
      minHeight: 60,
      background:'var(--bg-surface)',
      borderBottom:'1px solid var(--border)',
      display:'flex',
      alignItems:'center',
      justifyContent:'space-between',
      padding:'0 28px',
      position:'sticky',
      top:0,
      zIndex:90,
      gap:14,
      flexWrap: 'wrap',
      '@media (max-width: 768px)': {
        padding: '0 14px',
        minHeight: 56,
      }
    }}>
      {/* Left side - Welcome message */}
      <button
        type="button"
        className="sidebar-toggle-button"
        onClick={onToggleSidebar}
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          '@media (max-width: 768px)': {
            fontSize: '0.75rem',
          }
        }}>
          Welcome, <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
            {user?.name?.split(' ')[0] || 'User'}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: `${roleInfo.color}15`,
          borderRadius: 20,
          border: `1px solid ${roleInfo.color}30`,
          whiteSpace: 'nowrap',
          '@media (max-width: 768px)': {
            display: 'none'
          }
        }}>
          <span style={{ fontSize: '0.75rem' }}>{roleInfo.badge}</span>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: roleInfo.color
          }}>
            {roleInfo.name}
          </span>
        </div>
      </div>

      {/* Right side - Date, Notifications, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ 
          fontSize:'0.82rem', 
          color:'var(--text-muted)',
          '@media (max-width: 768px)': {
            display: 'none'
          }
        }}>{now}</span>
        
        {/* Notification Bell */}
        <button style={{
          position:'relative',
          background:'var(--bg-hover)',
          border:'1px solid var(--border)',
          borderRadius:7,
          width:34,
          height:34,
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          cursor:'pointer',
          color:'var(--text-secondary)',
          transition:'all 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.background='var(--gold)'; e.currentTarget.style.color='#0b1220'; }}
        onMouseLeave={e => { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text-secondary)'; }}
        >
          <Bell size={14}/>
          <span style={{
            position:'absolute',
            top:5,
            right:5,
            width:6,
            height:6,
            borderRadius:'50%',
            background:'var(--gold)'
          }}/>
        </button>

        {/* User Menu Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              width:34,
              height:34,
              borderRadius:'50%',
              background:'var(--gold)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              fontFamily:'var(--font-display)',
              fontWeight:700,
              fontSize:'0.8rem',
              color:'#0b1220',
              cursor:'pointer',
              border:'none',
              transition:'transform 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {getUserInitials()}
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div
                onClick={() => setShowUserMenu(false)}
                style={{
                  position:'fixed',
                  top:0,
                  left:0,
                  right:0,
                  bottom:0,
                  zIndex:99
                }}
              />
              <div style={{
                position:'absolute',
                top:45,
                right:0,
                width:260,
                maxWidth: 'calc(100vw - 16px)',
                background:'var(--bg-surface)',
                border:'1px solid var(--border)',
                borderRadius:8,
                boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
                zIndex:100,
                overflow:'hidden',
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto'
              }}>
                {/* User Info */}
                <div style={{
                  padding:'16px',
                  borderBottom:'1px solid var(--border)',
                  background:'var(--bg-hover)'
                }}>
                  <div style={{
                    display:'flex',
                    alignItems:'center',
                    gap:12,
                    marginBottom:8
                  }}>
                    <div style={{
                      width:40,
                      height:40,
                      borderRadius:'50%',
                      background:'var(--gold)',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      fontFamily:'var(--font-display)',
                      fontWeight:700,
                      fontSize:'1rem',
                      color:'#0b1220'
                    }}>
                      {getUserInitials()}
                    </div>
                    <div>
                      <div style={{
                        fontSize:'0.9rem',
                        fontWeight:600,
                        color:'var(--text-primary)'
                      }}>
                        {user?.name}
                      </div>
                      <div style={{
                        fontSize:'0.7rem',
                        color:'var(--text-muted)'
                      }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize:'0.7rem',
                    padding:'4px 8px',
                    background:`${roleInfo.color}20`,
                    borderRadius:4,
                    display:'inline-block',
                    color:roleInfo.color
                  }}>
                    {roleInfo.badge} {roleInfo.name}
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ padding:'8px 0' }}>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Add profile navigation if needed
                    }}
                    style={{
                      width:'100%',
                      display:'flex',
                      alignItems:'center',
                      gap:12,
                      padding:'10px 16px',
                      background:'transparent',
                      border:'none',
                      cursor:'pointer',
                      color:'var(--text-secondary)',
                      fontSize:'0.85rem',
                      textAlign:'left',
                      transition:'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)'; }}
                  >
                    <User size={14}/>
                    Profile Settings
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    style={{
                      width:'100%',
                      display:'flex',
                      alignItems:'center',
                      gap:12,
                      padding:'10px 16px',
                      background:'transparent',
                      border:'none',
                      cursor:'pointer',
                      color:'#dc3545',
                      fontSize:'0.85rem',
                      textAlign:'left',
                      transition:'all 0.15s',
                      borderTop:'1px solid var(--border)',
                      marginTop:4
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='#dc3545'; e.currentTarget.style.color='white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#dc3545'; }}
                  >
                    <LogOut size={14}/>
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;