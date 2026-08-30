import React, { useState, useEffect } from 'react';
import { useHRIS } from '../context/HRISContext';
import { Overview } from './guru/Overview';
import { CourseBuilder } from './guru/CourseBuilder';
import { GradingSuite } from './guru/GradingSuite';
import { StudentAnalytics } from './guru/StudentAnalytics';
import { SlipGajiView } from './SlipGajiView';
import { ClockInModal } from './ClockInModal';
import { JournalModal } from './JournalModal';

export type GuruTabType = 'overview' | 'clockin_journal' | 'kelas_materi' | 'penilaian_tugas' | 'presensi_analitik' | 'jadwal' | 'slip_gaji';

interface GuruViewProps {
  initialTab?: GuruTabType;
}

export const GuruView: React.FC<GuruViewProps> = ({ initialTab = 'overview' }) => {
  const { setCurrentPath } = useHRIS();
  const [activeSubTab, setActiveSubTab] = useState<GuruTabType>(initialTab);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  // Handle rendering based on activeSubTab
  if (activeSubTab === 'overview' || activeSubTab === 'clockin_journal' || activeSubTab === 'jadwal') {
    return <Overview />;
  }
  if (activeSubTab === 'kelas_materi') {
    return <CourseBuilder />;
  }
  if (activeSubTab === 'penilaian_tugas') {
    return <GradingSuite />;
  }
  if (activeSubTab === 'presensi_analitik') {
    return <StudentAnalytics />;
  }
  if (activeSubTab === 'slip_gaji') {
    return <SlipGajiView />;
  }
  
  return <Overview />;
};
