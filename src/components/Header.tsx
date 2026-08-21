import React from 'react';
import { 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  GraduationCap, 
  RotateCcw,
  Calendar,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  Clock,
  CreditCard,
  FileText,
  Users,
  CalendarDays,
  Menu,
  X,
  Printer,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { UserRole } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab,
  sidebarOpen,
  setSidebarOpen 
}) => {
  const { 
    teachers, 
    currentUser, 
    currentRole, 
    setCurrentUserById, 
    setCurrentRole,
    selectedPeriod,
    setSelectedPeriod,
    resetToDefault
  } = useHRIS();

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'ADMIN') {
      setCurrentUserById('T-07'); // Ust Akmal Yaqien
    } else if (role === 'KEPALA_PESANTREN') {
      setCurrentUserById('T-01'); // Ust Idwan Rizqi R
    } else {
      if (currentUser.role !== 'GURU') {
        setCurrentUserById('T-08'); // Ust Fuad Arqom
      }
    }
  };

  const navSections = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Ringkasan Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'GURU', 'KEPALA_PESANTREN'] },
        { id: 'teacher_workbench', label: 'Jadwal & Presensi Guru', icon: Clock, roles: ['ADMIN', 'GURU'] },
        { id: 'badal', label: 'Penugasan Guru Badal', icon: Users, roles: ['ADMIN', 'GURU', 'KEPALA_PESANTREN'] },
      ]
    },
    {
      title: 'KEUANGAN & PAYROLL',
      items: [
        { id: 'payroll', label: 'Rekap Payroll (23 Guru)', icon: CreditCard, roles: ['ADMIN', 'KEPALA_PESANTREN'] },
        { id: 'slip_gaji', label: 'Cetak Slip Gaji', icon: FileText, roles: ['ADMIN', 'GURU', 'KEPALA_PESANTREN'] },
      ]
    },
    {
      title: 'MASTER DATA & AUDIT',
      items: [
        { id: 'master_teachers', label: 'Master Data Guru', icon: Users, roles: ['ADMIN', 'KEPALA_PESANTREN'] },
        { id: 'master_schedules', label: 'Master Jadwal KBM', icon: CalendarDays, roles: ['ADMIN', 'KEPALA_PESANTREN'] },
        { id: 'kepsek_audit', label: 'Audit Ketaatan & Kepsek', icon: GraduationCap, roles: ['ADMIN', 'KEPALA_PESANTREN'] },
      ]
    }
  ];

  // Current tab display title
  const currentTabLabel = 
    navSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || 'Dashboard';

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden print:hidden"
        />
      )}

      {/* Desktop & Mobile Slideout Sidebar */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo and Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20">
                <span className="text-sm tracking-tighter">BQ</span>
              </div>
              <div className="leading-tight">
                <h1 className="font-bold text-sm text-white tracking-tight">HRIS Pesantren</h1>
                <p className="text-[11px] text-slate-400 truncate">Baitul Qur'an Al-Ikhwan</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Grouped */}
          <div className="p-3 space-y-6 flex-1">
            {navSections.map((section, sIdx) => {
              const visibleItems = section.items.filter(item => item.roles.includes(currentRole));
              if (visibleItems.length === 0) return null;

              return (
                <div key={sIdx} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Active Persona Card at Bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className={`w-8 h-8 rounded-lg ${currentUser.avatarColor || 'bg-emerald-700'} flex items-center justify-center font-bold text-xs text-white shrink-0`}>
              {currentUser.name.split(' ')[0]?.[0] || 'U'}
              {currentUser.name.split(' ')[1]?.[0] || 'A'}
            </div>
            <div className="overflow-hidden flex-1 leading-tight">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-400 truncate">{currentUser.position}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Top Header Bar for Desktop & Mobile */}
      <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm print:hidden">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>HRIS</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">{currentTabLabel}</span>
            </div>
          </div>
        </div>

        {/* Right: RBAC Persona Simulator & Period Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Persona Role Pill Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => handleRoleChange('ADMIN')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                currentRole === 'ADMIN'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => handleRoleChange('GURU')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                currentRole === 'GURU'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Guru
            </button>
            <button
              onClick={() => handleRoleChange('KEPALA_PESANTREN')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                currentRole === 'KEPALA_PESANTREN'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kepsek
            </button>
          </div>

          {/* Teacher Selector Dropdown */}
          <div className="relative">
            <select
              value={currentUser.id}
              onChange={(e) => setCurrentUserById(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 pl-2.5 pr-7 rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-emerald-500 max-w-[130px] sm:max-w-[190px] truncate"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.position})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Period Selector */}
          <div className="relative hidden md:block">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 pl-2.5 pr-7 rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-emerald-500"
            >
              <option value="Agustus 2026">Agustus 2026</option>
              <option value="Juli 2026">Juli 2026</option>
              <option value="Juni 2026">Juni 2026</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Reset Demo State Button */}
          <button
            onClick={() => {
              if (confirm('Kembalikan semua data ke master awal (23 Guru & Sampel Lengkap)?')) {
                resetToDefault();
              }
            }}
            title="Reset data simulasi"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>
    </>
  );
};

