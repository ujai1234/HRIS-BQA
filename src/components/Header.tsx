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
  BookOpen,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { UserRole } from '../types';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({ 
  sidebarOpen, 
  setSidebarOpen 
}) => {
  const { 
    teachers, 
    currentUser, 
    currentRole, 
    currentPath,
    logout,
    setCurrentPath,
    setCurrentUserById, 
    selectedPeriod, 
    setSelectedPeriod, 
    resetToDefault 
  } = useHRIS();

  // Role-specific navigation items
  const getNavItems = () => {
    if (currentRole === 'GURU') {
      return [
        {
          title: 'MENU UTAMA GURU',
          items: [
            { path: '/dashboard/guru', label: 'Presensi & Jurnal', icon: Clock, desc: 'Catat kehadiran & PBM harian' },
            { path: '/dashboard/guru/slip', label: 'Slip Gaji', icon: CreditCard, desc: 'Rincian penghasilan bulanan' },
            { path: '/dashboard/guru/jadwal', label: 'Jadwal Mengajar', icon: CalendarDays, desc: 'Jadwal tatap muka mingguan' },
          ]
        }
      ];
    } else if (currentRole === 'ADMIN') {
      return [
        {
          title: 'DATA & PENGGAJIAN',
          items: [
            { path: '/dashboard/admin', label: 'Data Guru & Tarif', icon: Users, desc: 'Data asatidz & honorarium' },
            { path: '/dashboard/admin/jadwal', label: 'Jadwal Pelajaran', icon: CalendarDays, desc: 'Jadwal KBM SMP, MA & Ponpes' },
            { path: '/dashboard/admin/badal', label: 'Guru Pengganti (Badal)', icon: UserCheck, desc: 'Penggantian guru berhalangan' },
            { path: '/dashboard/admin/payroll', label: 'Rekapitulasi Gaji', icon: CreditCard, desc: 'Perhitungan gaji bulanan' },
          ]
        }
      ];
    } else {
      // KEPALA PESANTREN
      return [
        {
          title: 'MONITORING EKSEKUTIF',
          items: [
            { path: '/dashboard/kepsek', label: 'Ringkasan Eksekutif', icon: LayoutDashboard, desc: 'Statistik kehadiran & KBM' },
            { path: '/dashboard/kepsek/audit', label: 'Monitoring Jurnal', icon: GraduationCap, desc: 'Ketaatan pengisian jurnal' },
            { path: '/dashboard/kepsek/laporan', label: 'Laporan Gaji', icon: CreditCard, desc: 'Pengesahan penggajian' },
          ]
        }
      ];
    }
  };

  const navSections = getNavItems();

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
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20">
                <span className="text-base font-extrabold tracking-tighter">BQA</span>
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
          <div className="p-3 space-y-4 flex-1">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = currentPath === item.path || (item.path.endsWith('guru') && currentPath === '/dashboard/guru');
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          setCurrentPath(item.path);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left ${
                          isActive
                            ? currentRole === 'GURU'
                              ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                              : currentRole === 'ADMIN'
                              ? 'bg-blue-600 text-white font-semibold shadow-sm'
                              : 'bg-amber-600 text-white font-semibold shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="font-medium truncate">{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Active User Profile */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className={`w-8 h-8 rounded-lg ${currentUser?.avatarColor || 'bg-emerald-700'} flex items-center justify-center font-bold text-xs text-white shrink-0`}>
              {currentUser?.name ? currentUser.name.split(' ')[0]?.[0] : 'U'}
              {currentUser?.name ? (currentUser.name.split(' ')[1]?.[0] || 'A') : 'A'}
            </div>
            <div className="overflow-hidden flex-1 leading-tight">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'Pengguna'}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.position || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Top Header Bar for Desktop & Mobile */}
      <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-xs print:hidden">
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
              <span className="font-mono text-emerald-700 font-semibold">{currentPath}</span>
            </div>
          </div>
        </div>

        {/* Right: RBAC Persona Simulator & Period Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reset Database Button (Visible for Admins) */}
          {currentRole === 'ADMIN' && (
            <button
              onClick={() => {
                if (window.confirm('Yakin ingin reset ulang semua data ke pengaturan awal?')) {
                  resetToDefault();
                }
              }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-emerald-700 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all"
              title="Reset Sinkronisasi Data"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">RESET DATA</span>
            </button>
          )}

          {/* Logged in User Pill */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 px-3 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${currentRole === 'GURU' ? 'bg-emerald-500' : currentRole === 'ADMIN' ? 'bg-blue-500' : 'bg-amber-500'}`} />
            <span className="max-w-[130px] sm:max-w-[180px] truncate">{currentUser.name}</span>
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

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Keluar ke Halaman Login"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
    </>
  );
};
