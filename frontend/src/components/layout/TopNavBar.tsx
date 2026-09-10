import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  Menu, 
  X, 
  UserCheck, 
  Cpu, 
  Activity, 
  ChevronDown,
  Waves
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SystemHealth, UserRole, HealthState } from '../../types';
import Badge from '../common/Badge';
import StatusIndicator from '../common/StatusIndicator';

interface TopNavBarProps {
  health: SystemHealth | null;
  healthState: HealthState;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  health,
  healthState,
  sidebarOpen,
  onToggleSidebar,
}) => {
  const { user, isOfficer, isAdmin, setGuestRole } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcString = now.toISOString().substring(11, 19) + ' UTC';
      setCurrentTime(utcString);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine dynamic inference mode from backend health if available
  const inferenceMode = health?.ai_engine?.active_model || 'Deterministic Hydrological Heuristic';
  const isHeuristic = inferenceMode.toLowerCase().includes('heuristic') || !health?.ai_engine?.active_model;

  const handleRoleChange = (role: UserRole) => {
    setGuestRole(role);
    setRoleDropdownOpen(false);
  };

  return (
    <header className="app-topbar" role="banner">
      {/* Brand & Platform Identity */}
      <div className="topbar-brand">
        <button
          className="btn btn-ghost btn-sm mobile-menu-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="topbar-logo" aria-hidden="true">
          <Waves size={20} />
        </div>

        <div className="topbar-titles">
          <div className="topbar-title">AI FLOOD INTELLIGENCE</div>
          <div className="topbar-subtitle">EMERGENCY OPERATIONS CENTER</div>
        </div>
      </div>

      {/* Dynamic Backend Slots & Operational Readouts */}
      <div className="topbar-center">
        {/* Dynamic Inference Mode Slot (Honest Backend Value) */}
        <div className="topbar-slots" title={`Active Inference Engine: ${inferenceMode}`}>
          {isHeuristic ? (
            <Badge variant="heuristic">
              <Cpu size={12} style={{ marginRight: '4px' }} />
              HEURISTIC FALLBACK
            </Badge>
          ) : (
            <Badge variant="info">
              <Cpu size={12} style={{ marginRight: '4px' }} />
              {inferenceMode.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Live Operational Clock */}
        <div 
          className="topbar-slots" 
          style={{ 
            fontSize: '11.5px', 
            color: 'var(--text-secondary)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)'
          }}
        >
          <Clock size={13} style={{ color: 'var(--brand-emergency-blue)' }} />
          <span className="font-mono">{currentTime || '--:--:-- UTC'}</span>
        </div>

        {/* System Health Slot */}
        <div 
          className="topbar-slots" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)'
          }}
        >
          <StatusIndicator
            status={
              healthState === 'operational'
                ? 'healthy'
                : healthState === 'degraded'
                ? 'critical'
                : healthState === 'unavailable'
                ? 'offline'
                : 'standby'
            }
            pulse={healthState === 'connecting'}
          />
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
            SYSTEM STATUS:{' '}
            {healthState === 'operational'
              ? 'OPERATIONAL'
              : healthState === 'degraded'
              ? 'DEGRADED'
              : healthState === 'unavailable'
              ? 'UNAVAILABLE'
              : 'CONNECTING...'}
          </span>
        </div>
      </div>

      {/* User / Authentication Role Switcher */}
      <div className="topbar-actions" style={{ position: 'relative' }}>
        <div 
          className="btn btn-secondary btn-sm"
          onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={roleDropdownOpen}
        >
          <UserCheck size={14} style={{ color: isAdmin ? '#DC2626' : isOfficer ? 'var(--brand-emergency-blue)' : 'var(--text-secondary)' }} />
          <span style={{ fontWeight: 700, fontSize: '11.5px' }}>
            {user?.role || 'PUBLIC_USER'}
          </span>
          <ChevronDown size={12} />
        </div>

        {roleDropdownOpen && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '6px',
              zIndex: 100,
              minWidth: '220px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Operational Role Switcher (RBAC)
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%', gap: '8px' }}
              onClick={() => handleRoleChange('DISASTER_OFFICER')}
            >
              <Activity size={13} style={{ color: 'var(--brand-emergency-blue)' }} />
              <span>DISASTER_OFFICER</span>
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%', gap: '8px' }}
              onClick={() => handleRoleChange('SUPER_ADMIN')}
            >
              <Shield size={13} style={{ color: '#DC2626' }} />
              <span>SUPER_ADMIN</span>
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%', gap: '8px' }}
              onClick={() => handleRoleChange('PUBLIC_USER')}
            >
              <UserCheck size={13} style={{ color: 'var(--text-secondary)' }} />
              <span>PUBLIC_USER</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavBar;
