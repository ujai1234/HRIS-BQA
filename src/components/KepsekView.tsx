import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Render Selected SubTab */}
          {activeSubTab === 'ringkasan_kehadiran' && (
            <KepsekAnalyticsDashboard 
              onNavigateToAudit={() => setActiveSubTab('ketaatan_jurnal')}
              onNavigateToBadal={() => setActiveSubTab('guru_badal')}
            />
          )}
          {activeSubTab === 'ketaatan_jurnal' && <KepsekAuditView />}
          {activeSubTab === 'guru_badal' && <BadalManagement />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

