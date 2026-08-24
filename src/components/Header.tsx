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
  ArrowRight,
  Sun,
  Moon
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
    isDarkMode,
    logout,
    toggleDarkMode,
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
            { path: '/dashboard/admin', label: 'Dashboard Monitoring', icon: LayoutDashboard, desc: 'Pemantauan kegiatan & gaji' },
            { path: '/dashboard/admin/guru', label: "Data Guru & Kafa'ah", icon: Users, desc: 'Data asatidz & kafa’ah honorarium' },
            { path: '/dashboard/admin/jadwal', label: 'Jadwal Pelajaran', icon: CalendarDays, desc: 'Jadwal KBM SMP, MA & Ponpes' },
            { path: '/dashboard/admin/badal', label: 'Guru Pengganti', icon: UserCheck, desc: 'Penggantian guru berhalangan' },
            { path: '/dashboard/admin/payroll', label: 'Rekapitulasi Gaji', icon: CreditCard, desc: 'Perhitungan gaji bulanan' },
            { path: '/dashboard/admin/audit', label: 'Log Audit Keamanan', icon: ShieldCheck, desc: 'Rekam aktivitas & keamanan' },
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
            { path: '/dashboard/kepsek/audit-log', label: 'Log Audit Keamanan', icon: ShieldCheck, desc: 'Rekam jejak audit keamanan' },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-900 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo and Brand Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/20">
                <span className="text-sm font-extrabold tracking-tighter">BQA</span>
              </div>
              <div className="leading-tight">
                <h1 className="font-semibold text-sm text-slate-100 tracking-tight">HRIS Pesantren</h1>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-medium">Baitul Qur'an</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-white p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Grouped */}
          <div className="p-3 space-y-5 flex-1 pt-6">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1.5">
                <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                  {section.title}
                </p>
                <div className="space-y-0.5">
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left group ${
                          isActive
                            ? 'bg-emerald-600/10 text-emerald-400 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive && <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Active User Profile */}
        <div className="p-4 border-t border-white/5 bg-slate-900/30">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className={`w-8 h-8 rounded-lg ${currentUser?.avatarColor || 'bg-emerald-700'} flex items-center justify-center font-bold text-[11px] text-white shrink-0`}>
              {currentUser?.name ? currentUser.name.split(' ')[0]?.[0] : 'U'}
              {currentUser?.name ? (currentUser.name.split(' ')[1]?.[0] || 'A') : 'A'}
            </div>
            <div className="overflow-hidden flex-1 leading-tight">
              <p className="text-[11px] font-semibold text-slate-200 truncate">{currentUser?.name || 'Pengguna'}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser?.position || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Top Header Bar for Desktop & Mobile */}
      <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 sm:px-6 print:hidden transition-colors duration-300">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>HRIS</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-slate-900 dark:text-slate-100 font-semibold">{currentPath.split('/').pop()?.replace('_', ' ')}</span>
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
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-rose-600 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
              title="Reset Sinkronisasi Data"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline uppercase">Reset</span>
            </button>
          )}

          {/* Logged in User Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-lg">
            <div className={`w-1.5 h-1.5 rounded-full ${currentRole === 'GURU' ? 'bg-emerald-500' : currentRole === 'ADMIN' ? 'bg-blue-500' : 'bg-amber-500'}`} />
            <span className="max-w-[150px] truncate">{currentUser.name}</span>
          </div>

          {/* Period Selector */}
          <div className="relative hidden md:block">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 py-1.5 pl-2.5 pr-7 rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
            >
              <option value="Agustus 2026">Agustus 2026</option>
              <option value="Juli 2026">Juli 2026</option>
              <option value="Juni 2026">Juni 2026</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-3 pointer-events-none" />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Malam'}
            className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Logout Button */}
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />
          
          <button
            onClick={logout}
            title="Keluar ke Halaman Login"
            className="flex items-center gap-2 py-1.5 px-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-900/30 rounded-lg text-xs font-bold transition-all cursor-pointer group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">LOGOUT</span>
          </button>
        </div>
      </header>
    </>
  );
};
