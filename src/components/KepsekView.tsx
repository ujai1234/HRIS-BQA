import React, { useState } from 'react';
import { KepsekAnalyticsDashboard } from './KepsekAnalyticsDashboard';
import { KepsekAuditView } from './KepsekAuditView';
import { BadalManagement } from './BadalManagement';

interface KepsekViewProps {
  initialTab?: 'ringkasan_kehadiran' | 'ketaatan_jurnal' | 'guru_badal';
}

export const KepsekView: React.FC<KepsekViewProps> = ({ initialTab = 'ringkasan_kehadiran' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ringkasan_kehadiran' | 'ketaatan_jurnal' | 'guru_badal'>(initialTab);

  return (
    <div className="space-y-6">
      {/* Render Selected SubTab */}
      {activeSubTab === 'ringkasan_kehadiran' && (
        <KepsekAnalyticsDashboard 
          onNavigateToAudit={() => setActiveSubTab('ketaatan_jurnal')}
          onNavigateToBadal={() => setActiveSubTab('guru_badal')}
        />
      )}
      {activeSubTab === 'ketaatan_jurnal' && <KepsekAuditView />}
      {activeSubTab === 'guru_badal' && <BadalManagement />}
    </div>
  );
};

