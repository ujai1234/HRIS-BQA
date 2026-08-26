import React, { useState, useRef, useEffect } from 'react';
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
  Moon,
  ClipboardList,
  Bell,
  Check,
  RefreshCw
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { UserRole, isKepsekRole } from '../types';
import { useGuruNotifications, GuruNotificationItem, GuruNotifType } from '../hooks/useGuruNotifications';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({ 
  sidebarOpen, 
  setSidebarOpen 
}) => {
  const { 
    currentUser, 
    currentRole, 
    currentPath,
    isDarkMode,
    logout,
    toggleDarkMode,
    setCurrentPath,
    selectedPeriod, 
    setSelectedPeriod, 
    resetToDefault,
    refreshData,
    isLoading
  } = useHRIS();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing || isLoading) return;
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useGuruNotifications();

  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'BADAL' | 'KBM' | 'REQUEST'>('ALL');
  const notifRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifPopover(false);
      }
    };
    if (showNotifPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifPopover]);

  const filteredNotifications = notifications.filter(item => {
    if (filterType === 'ALL') return true;
    if (filterType === 'BADAL') return item.type === 'BADAL';
    if (filterType === 'KBM') return item.type === 'ATTENDANCE_OPEN' || item.type === 'JOURNAL_PENDING';
    if (filterType === 'REQUEST') return item.type === 'REQUEST_UPDATE';
    return true;
  });

  const getTagStyle = (type: GuruNotifType) => {
    switch (type) {
      case 'BADAL':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'ATTENDANCE_OPEN':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'JOURNAL_PENDING':
        return 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900';
      case 'REQUEST_UPDATE':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getTagLabel = (type: GuruNotifType) => {
    switch (type) {
      case 'BADAL':
        return 'Tugas Badal';
      case 'ATTENDANCE_OPEN':
        return 'Presensi';
      case 'JOURNAL_PENDING':
        return 'Jurnal';
      case 'REQUEST_UPDATE':
        return 'Pengajuan';
      default:
        return 'Info';
    }
  };

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
            { path: '/dashboard/guru/kebutuhan', label: 'Pengajuan Kebutuhan', icon: ClipboardList, desc: 'Fasilitas pembelajaran' },
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
            { path: '/dashboard/admin/badal', label: 'Guru Pengganti', icon: UserCheck, desc: 'Monitoring badal SMP, MA & Ponpes' },
            { path: '/dashboard/admin/kebutuhan', label: 'Monitoring Kebutuhan', icon: ClipboardList, desc: 'Data ajuan guru & disposisi' },
            { path: '/dashboard/admin/payroll', label: 'Rekapitulasi Gaji', icon: CreditCard, desc: 'Perhitungan gaji bulanan' },
            { path: '/dashboard/admin/audit', label: 'Log Audit Keamanan', icon: ShieldCheck, desc: 'Rekam aktivitas & keamanan' },
          ]
        }
      ];
    } else if (isKepsekRole(currentRole)) {
      const unit = currentRole === 'KEPALA_SMP' ? 'SMP' : currentRole === 'KEPALA_MA' ? 'MA' : 'PESANTREN';
      return [
        {
          title: `DASHBOARD ${unit}`,
          items: [
            { path: '/dashboard/kepsek', label: 'Dashboard', icon: LayoutDashboard, desc: 'Statistik kehadiran & KBM' },
            { path: '/dashboard/kepsek/audit', label: 'Monitoring Jurnal', icon: GraduationCap, desc: 'Ketaatan pengisian jurnal' },
            { path: '/dashboard/kepsek/badal', label: 'Guru Pengganti', icon: UserCheck, desc: 'Pencarian & penugasan badal' },
            { path: '/dashboard/kepsek/kebutuhan', label: 'Persetujuan Kebutuhan', icon: ClipboardList, desc: 'Verifikasi ajuan guru unit' },
          ]
        }
      ];
    } else {
      return [];
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
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pesantren-emerald to-pesantren-dark rounded-xl flex items-center justify-center shadow-lg border border-white/10 shrink-0">
                <span className="text-white text-base font-black tracking-tighter drop-shadow-md">BQA</span>
              </div>
              <div className="leading-tight">
                <h1 className="font-bold text-base text-slate-100 tracking-tight leading-snug">Baitul Qur'an</h1>
                <p className="text-xs text-pesantren-lime uppercase tracking-widest font-extrabold">Al-Ikhwan HRIS</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Grouped */}
          <div className="p-3.5 space-y-6 flex-1 pt-5">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-2">
                <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all text-left group ${
                          isActive
                            ? 'bg-emerald-600/15 text-emerald-400 font-bold border border-emerald-500/20'
                            : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                          <span className="truncate leading-snug">{item.label}</span>
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Active User Profile */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className={`w-9 h-9 rounded-lg ${currentUser?.avatarColor || 'bg-emerald-700'} flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm`}>
              {currentUser?.name ? currentUser.name.split(' ')[0]?.[0] : 'U'}
              {currentUser?.name ? (currentUser.name.split(' ')[1]?.[0] || 'A') : 'A'}
            </div>
            <div className="overflow-hidden flex-1 leading-tight">
              <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{currentUser?.name || 'Pengguna'}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser?.position || ''}</p>
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
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>HRIS</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 dark:text-slate-100 font-bold">{currentPath.split('/').pop()?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Right: RBAC Persona Simulator & Period Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Manual Refresh Data Button */}
          <button
            id="btn-refresh-data"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shrink-0"
            title="Refresh Data terbaru dari server tanpa memuat ulang halaman"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

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

          {/* Notification Bell (Guru Only) */}
          {currentRole === 'GURU' && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifPopover(!showNotifPopover)}
                className={`p-2 rounded-lg transition-all cursor-pointer relative ${
                  showNotifPopover 
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' 
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Notifikasi Aktivitas Guru"
                aria-label="Pemberitahuan Guru"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 text-[8px] font-bold text-white items-center justify-center"></span>
                  </span>
                )}
              </button>

              {/* Minimalist Modern Notification Popover */}
              {showNotifPopover && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Header */}
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Notifikasi Guru
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Jadwal badal, waktu presensi & pengisian jurnal
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Tandai Dibaca</span>
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 px-3 py-2 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto text-[10px]">
                    <button
                      onClick={() => setFilterType('ALL')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                        filterType === 'ALL'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Semua ({notifications.length})
                    </button>
                    <button
                      onClick={() => setFilterType('BADAL')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                        filterType === 'BADAL'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-500 hover:text-amber-600'
                      }`}
                    >
                      Badal ({notifications.filter(n => n.type === 'BADAL').length})
                    </button>
                    <button
                      onClick={() => setFilterType('KBM')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                        filterType === 'KBM'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-500 hover:text-emerald-600'
                      }`}
                    >
                      Absen & Jurnal ({notifications.filter(n => n.type === 'ATTENDANCE_OPEN' || n.type === 'JOURNAL_PENDING').length})
                    </button>
                    <button
                      onClick={() => setFilterType('REQUEST')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                        filterType === 'REQUEST'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-500 hover:text-purple-600'
                      }`}
                    >
                      Ajuan ({notifications.filter(n => n.type === 'REQUEST_UPDATE').length})
                    </button>
                  </div>

                  {/* List Content */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1.5 space-y-1">
                    {filteredNotifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        Tidak ada notifikasi pada kategori ini.
                      </div>
                    ) : (
                      filteredNotifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`p-3 rounded-xl transition-all cursor-pointer border ${
                            notif.isRead 
                              ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 border-transparent' 
                              : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100/60 dark:border-emerald-900/40 hover:bg-emerald-50/70'
                          }`}
                          onClick={() => {
                            markAsRead(notif.id);
                            setCurrentPath(notif.actionPath);
                            setShowNotifPopover(false);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              )}
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${getTagStyle(notif.type)}`}>
                                {getTagLabel(notif.type)}
                              </span>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {notif.title}
                              </p>
                            </div>
                            <span className="text-[9px] text-slate-400 shrink-0 whitespace-nowrap">
                              {notif.timeLabel}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                            {notif.subtitle}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] text-slate-400">
                              {notif.type === 'BADAL' ? 'Penugasan Pengganti' : notif.type === 'REQUEST_UPDATE' ? 'Disposisi' : 'KBM Harian'}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5 group-hover:underline">
                              <span>{notif.actionLabel}</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      onClick={() => {
                        setCurrentPath('/dashboard/guru');
                        setShowNotifPopover(false);
                      }}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Buka Menu Utama Presensi & Jurnal</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
