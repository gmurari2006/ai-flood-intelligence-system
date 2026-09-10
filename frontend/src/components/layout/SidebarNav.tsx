import React from 'react';
import {
  LayoutDashboard,
  Map,
  Cpu,
  ShieldAlert,
  Navigation,
  BellRing,
  Layers,
  BarChart3,
  Globe,
  Lock,
} from 'lucide-react';
import { AppView } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  officerOnly?: boolean;
  adminOnly?: boolean;
}

interface SidebarNavProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentView,
  onSelectView,
  isOpen,
  onCloseMobile,
}) => {
  const { isOfficer, isAdmin, user } = useAuth();

  const operationsNav: NavItem[] = [
    {
      id: 'command_center',
      label: 'Command Center',
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: 'risk_map',
      label: 'Spatial Risk Map',
      icon: <Map size={16} />,
    },
    {
      id: 'ai_insights',
      label: 'AI Risk Insights',
      icon: <Cpu size={16} />,
    },
  ];

  const decisionSupportNav: NavItem[] = [
    {
      id: 'infrastructure',
      label: 'Critical Infrastructure',
      icon: <ShieldAlert size={16} />,
      officerOnly: true,
    },
    {
      id: 'evacuation',
      label: 'Evacuation & Routes',
      icon: <Navigation size={16} />,
      officerOnly: true,
    },
    {
      id: 'alerts',
      label: 'Alert Management',
      icon: <BellRing size={16} />,
      officerOnly: true,
    },
    {
      id: 'prioritization',
      label: 'Priority Matrix (MCDA)',
      icon: <Layers size={16} />,
      officerOnly: true,
    },
  ];

  const citizenAndAnalyticsNav: NavItem[] = [
    {
      id: 'analytics',
      label: 'Historical Analytics',
      icon: <BarChart3 size={16} />,
    },
    {
      id: 'public_portal',
      label: 'Public Safety Portal',
      icon: <Globe size={16} />,
    },
  ];

  const handleItemClick = (item: NavItem) => {
    onSelectView(item.id);
    onCloseMobile();
  };

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="sidebar-nav-section">
      <div className="sidebar-nav-header">{title}</div>
      <ul className="sidebar-nav-list" role="list">
        {items.map((item) => {
          const isRestricted = (item.officerOnly && !isOfficer) || (item.adminOnly && !isAdmin);
          const isActive = currentView === item.id;

          return (
            <li key={item.id}>
              <button
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (!isRestricted) {
                    handleItemClick(item);
                  }
                }}
                disabled={isRestricted}
                style={{
                  width: '100%',
                  opacity: isRestricted ? 0.5 : 1,
                  cursor: isRestricted ? 'not-allowed' : 'pointer',
                }}
                title={isRestricted ? 'Restricted: Requires DISASTER_OFFICER or SUPER_ADMIN authorization' : item.label}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {isRestricted && (
                  <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <aside
      className={`app-sidebar ${isOpen ? 'open' : ''}`}
      aria-label="Operations Navigation"
    >
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderNavGroup('EOC Operations', operationsNav)}
        {renderNavGroup('Decision Support', decisionSupportNav)}
        {renderNavGroup('Intelligence & Public', citizenAndAnalyticsNav)}
      </div>

      {/* Operational Clearance Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 650 }}>
            Operational Clearance
          </span>
          <Badge variant={isAdmin ? 'critical' : isOfficer ? 'info' : 'neutral'}>
            {user?.role || 'PUBLIC'}
          </Badge>
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          {isOfficer ? 'Authorized for dispatch & decision-support' : 'View-only citizen access mode'}
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;
