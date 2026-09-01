import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TeacherDashboard } from './TeacherDashboard';
import { SlipGajiView } from './SlipGajiView';
import { LearningNeedManagement } from './LearningNeedManagement';

export type GuruTabType = 'clockin_journal' | 'slip_gaji' | 'kebutuhan';

interface GuruViewProps {
  initialTab?: GuruTabType;
}

export const GuruView: React.FC<GuruViewProps> = ({ initialTab = 'clockin_journal' }) => {
  const [activeSubTab, setActiveSubTab] = useState<GuruTabType>(initialTab);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const renderContent = () => {
    switch (activeSubTab) {
      case 'slip_gaji':
        return <SlipGajiView />;
      case 'kebutuhan':
        return <LearningNeedManagement />;
      case 'clockin_journal':
      default:
        return <TeacherDashboard />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
};

