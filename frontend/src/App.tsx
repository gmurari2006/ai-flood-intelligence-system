import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ZoneProvider } from './context/ZoneContext';
import { PredictionProvider } from './context/PredictionContext';
import { InfrastructureProvider } from './context/InfrastructureContext';
import { EvacuationProvider } from './context/EvacuationContext';
import { PrioritizationProvider } from './context/PrioritizationContext';
import { AlertProvider } from './context/AlertContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { apiClient } from './api/client';
import { SystemHealth, AppView, HealthState } from './types';
import { Lock } from 'lucide-react';

// Layout Components
import TopNavBar from './components/layout/TopNavBar';
import SidebarNav from './components/layout/SidebarNav';
import StatusBar from './components/layout/StatusBar';

// View Components
import CommandCenterView from './components/pages/CommandCenterView';
import RiskMapView from './components/pages/RiskMapView';
import AiInsightsView from './components/pages/AiInsightsView';
import InfrastructureView from './components/pages/InfrastructureView';
import EvacuationView from './components/pages/EvacuationView';
import AlertsView from './components/pages/AlertsView';
import PrioritizationView from './components/pages/PrioritizationView';
import AnalyticsView from './components/pages/AnalyticsView';
import PublicPortalView from './components/pages/PublicPortalView';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('command_center');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthState, setHealthState] = useState<HealthState>('connecting');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { isOfficer } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = () => {
      apiClient
        .getHealth()
        .then((data) => {
          if (isMounted) {
            setHealth(data);
            setHealthState(data.status?.toUpperCase() === 'HEALTHY' ? 'operational' : 'degraded');
          }
        })
        .catch(() => {
          if (isMounted) {
            setHealth(null);
            setHealthState('unavailable');
          }
        });
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const renderActiveView = () => {
    const restrictedViews: AppView[] = ['infrastructure', 'evacuation', 'alerts', 'prioritization', 'analytics'];

    if (restrictedViews.includes(currentView) && !isOfficer) {
      return (
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: '580px', margin: '40px auto' }}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: 'var(--risk-critical-bg)', 
              borderRadius: '50%', 
              width: '64px', 
              height: '64px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto var(--space-4)', 
              color: 'var(--risk-critical)',
              border: '1px solid var(--risk-critical-border)'
            }}>
              <Lock size={32} />
            </div>
            <div className="eyebrow-label" style={{ color: 'var(--risk-critical)' }}>
              OPERATIONAL ACCESS CONTROL
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 750, color: 'var(--text-primary)', marginTop: '8px' }}>
              Restricted Operational Module
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              This decision-support subsystem requires <strong>DISASTER_OFFICER</strong> or <strong>SUPER_ADMIN</strong> authorization. Backend RBAC is the authoritative enforcement layer.
            </p>
            <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('command_center')}>
                Return to Command Center
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setCurrentView('public_portal')}>
                Open Public Safety Portal
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'command_center':
        return <CommandCenterView />;
      case 'risk_map':
        return <RiskMapView />;
      case 'ai_insights':
        return <AiInsightsView />;
      case 'infrastructure':
        return <InfrastructureView />;
      case 'evacuation':
        return <EvacuationView />;
      case 'alerts':
        return <AlertsView />;
      case 'prioritization':
        return <PrioritizationView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'public_portal':
        return <PublicPortalView />;
      default:
        return <CommandCenterView />;
    }
  };

  return (
    <div className="app-shell">
      <TopNavBar
        health={health}
        healthState={healthState}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="app-body">
        <SidebarNav
          currentView={currentView}
          onSelectView={(view) => setCurrentView(view)}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        <main className="app-content" role="main">
          {renderActiveView()}
        </main>
      </div>

      <StatusBar health={health} healthState={healthState} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ZoneProvider>
        <PredictionProvider>
          <InfrastructureProvider>
            <EvacuationProvider>
              <PrioritizationProvider>
                <AlertProvider>
                  <AnalyticsProvider>
                    <AppContent />
                  </AnalyticsProvider>
                </AlertProvider>
              </PrioritizationProvider>
            </EvacuationProvider>
          </InfrastructureProvider>
        </PredictionProvider>
      </ZoneProvider>
    </AuthProvider>
  );
};

export default App;

