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
  RefreshCw,
  ChevronLeft,
  Book,
  DollarSign,
  FileCheck,
  MapPin,
  Utensils,
  Wrench,
  Receipt,
  CheckCircle2,
  Sliders,
  Home,
  Camera,
  User,
  Database
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { UserRole, isKepsekRole } from '../types';
import { useGuruNotifications, GuruNotificationItem, GuruNotifType } from '../hooks/useGuruNotifications';
import { BrandLogo } from './BrandLogo';
import { TeacherAvatar } from './TeacherAvatar';
import { UserProfileModal } from './UserProfileModal';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarFolded?: boolean;
  setSidebarFolded?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({ 
  sidebarOpen, 
  setSidebarOpen,
  sidebarFolded = false,
  setSidebarFolded
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'BADAL' | 'KBM' | 'REQUEST'>('ALL');
  
  // State for collapsible sidebar sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'CORE MONITORING': true,
    'PORTAL SANTRI (SIS)': true,
    'FINANSIAL & AUDIT': false,
    'SISTEM & KONFIGURASI': false,
  });

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifPopover(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    if (showNotifPopover || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifPopover, showUserDropdown]);

  const filteredNotifications = notifications.filter(item => {
    if (filterType === 'ALL') return true;
    if (filterType === 'BADAL') return item.type === 'BADAL';
    if (filterType === 'KBM') return item.type === 'ATTENDANCE_OPEN' || item.type === 'JOURNAL_PENDING';
    if (filterType === 'REQUEST') return item.type === 'REQUEST_UPDATE';
    return true;
  });

  // Breadcrumb generation based on role and path (CoreUI style)
  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'Home', path: '/' }];

    if (currentRole === 'GURU' || currentPath.startsWith('/dashboard/guru')) {
      crumbs.push({ label: 'Guru', path: '/dashboard/guru' });
      if (currentPath === '/dashboard/guru/slip') crumbs.push({ label: 'Slip Kafa\'ah', path: currentPath });
      else if (currentPath === '/dashboard/guru/kebutuhan') crumbs.push({ label: 'Ajuan Fasilitas', path: currentPath });
      else crumbs.push({ label: 'Absen & Jurnal', path: currentPath });
    } else if (currentRole === 'ADMIN' || currentPath.startsWith('/dashboard/admin')) {
      crumbs.push({ label: 'Panel Admin', path: '/dashboard/admin' });
      if (currentPath === '/dashboard/admin/guru') crumbs.push({ label: 'Data Guru', path: currentPath });
      else if (currentPath === '/dashboard/admin/jadwal') crumbs.push({ label: 'Jadwal Mengajar', path: currentPath });
      else if (currentPath === '/dashboard/admin/badal') crumbs.push({ label: 'Guru Pengganti', path: currentPath });
      else if (currentPath === '/dashboard/admin/payroll') crumbs.push({ label: 'Generate Payroll', path: currentPath });
      else if (currentPath === '/dashboard/admin/tahfidz-payroll') crumbs.push({ label: 'Payroll Tahfidz', path: currentPath });
      else if (currentPath === '/dashboard/admin/laporan-staff') crumbs.push({ label: 'Laporan Staff', path: currentPath });
      else if (currentPath === '/dashboard/admin/audit') crumbs.push({ label: 'Sistem Audit', path: currentPath });
      else if (currentPath === '/dashboard/admin/kebutuhan') crumbs.push({ label: 'Monitoring Kebutuhan', path: currentPath });
      else if (currentPath === '/dashboard/admin/settings') crumbs.push({ label: 'Radius Presensi', path: currentPath });
      else if (currentPath === '/dashboard/admin/santri') crumbs.push({ label: 'Data Santri', path: currentPath });
      else if (currentPath === '/dashboard/admin/wali') crumbs.push({ label: 'Data Wali Santri', path: currentPath });
      else crumbs.push({ label: 'Dashboard Utama', path: currentPath });
    } else if (isKepsekRole(currentRole) || currentPath.startsWith('/dashboard/kepsek')) {
      const unit = currentRole === 'KEPALA_SMP' ? 'SMP' : currentRole === 'KEPALA_MA' ? 'MA' : 'Pesantren';
      crumbs.push({ label: `Kepala ${unit}`, path: '/dashboard/kepsek' });
      if (currentPath === '/dashboard/kepsek/audit') crumbs.push({ label: 'Monitoring Jurnal', path: currentPath });
      else if (currentPath === '/dashboard/kepsek/badal') crumbs.push({ label: 'Pencarian Badal', path: currentPath });
      else if (currentPath === '/dashboard/kepsek/kebutuhan') crumbs.push({ label: 'Persetujuan Kebutuhan', path: currentPath });
      else crumbs.push({ label: 'Dashboard Kehadiran', path: currentPath });
    } else if (currentRole === 'STAFF' || currentPath.startsWith('/dashboard/staff')) {
      crumbs.push({ label: 'Portal Staff', path: '/dashboard/staff' });
      crumbs.push({ label: 'Tugas Hari Ini', path: currentPath });
    }

    return crumbs;
  };

  // Role-specific navigation items (CoreUI CNavGroup / CNavItem structured)
  const getNavSections = () => {
    let sections: {
      title: string;
      items: {
        path: string;
        label: string;
        icon: any;
        badge?: string;
        badgeColor?: string;
      }[];
    }[] = [];

    if (currentRole === 'GURU') {
      sections = [
        {
          title: 'PORTAL GURU',
          items: [
            { path: '/dashboard/guru', label: 'Absen & Jurnal', icon: CheckCircle2 },
            { path: '/dashboard/guru/akademik', label: 'Akademik & Nilai', icon: BookOpen },
            { path: '/dashboard/guru/catatan', label: 'Buku Penghubung', icon: Book },
            { path: '/dashboard/guru/slip', label: 'Slip Kafa\'ah', icon: CreditCard },
            { path: '/dashboard/guru/kebutuhan', label: 'Ajuan Fasilitas', icon: ClipboardList },
          ]
        }
      ];
    } else if (currentRole === 'ADMIN') {
      sections = [
        {
          title: 'CORE MONITORING',
          items: [
            { path: '/dashboard/admin', label: 'Dashboard Admin', icon: LayoutDashboard },
            { path: '/dashboard/admin/guru', label: "Data Guru & Kafa'ah", icon: Users },
            { path: '/dashboard/admin/jadwal', label: 'Jadwal Pelajaran', icon: CalendarDays },
            { path: '/dashboard/admin/badal', label: 'Guru Pengganti', icon: UserCheck },
          ]
        },
        {
          title: 'FINANSIAL & AUDIT',
          items: [
            { path: '/dashboard/admin/kebutuhan', label: 'Monitoring Kebutuhan', icon: ClipboardList },
            { path: '/dashboard/admin/keuangan', label: 'Verifikasi Keuangan', icon: DollarSign },
            { path: '/dashboard/admin/payroll', label: 'Generate Payroll', icon: FileCheck },
            { path: '/dashboard/admin/tahfidz-payroll', label: 'Payroll Tahfidz', icon: BookOpen },
            { path: '/dashboard/admin/laporan-staff', label: 'Laporan Staff & Dapur', icon: Receipt },
          ]
        },
        {
          title: 'PORTAL SANTRI (SIS)',
          items: [
            { path: '/dashboard/admin/santri', label: 'Master Santri', icon: UserCheck },
            { path: '/dashboard/admin/wali', label: 'Master Wali Santri', icon: Users },
          ]
        },
        {
          title: 'SISTEM & KONFIGURASI',
          items: [
            { path: '/dashboard/admin/settings', label: 'Radius Presensi', icon: MapPin },
          ]
        }
      ];
    } else if (isKepsekRole(currentRole)) {
      const unit = currentRole === 'KEPALA_SMP' ? 'SMP' : currentRole === 'KEPALA_MA' ? 'MA' : 'PESANTREN';
      const items = [
        { path: '/dashboard/kepsek', label: 'Ringkasan Unit', icon: LayoutDashboard },
        { path: '/dashboard/kepsek/audit', label: 'Monitoring Jurnal', icon: GraduationCap },
        { path: '/dashboard/kepsek/badal', label: 'Guru Pengganti', icon: UserCheck },
        { path: '/dashboard/kepsek/kebutuhan', label: 'Persetujuan Kebutuhan', icon: ClipboardList },
      ];

      sections = [
        {
          title: `MANAJEMEN ${unit}`,
          items: items
        }
      ];
    } else if (currentRole === 'STAFF') {
      const isDapur = currentUser?.position === 'Staff Dapur';
      const isSarpras = currentUser?.position === 'Staff Inventaris';

      sections = [
        {
          title: 'PORTAL STAFF',
          items: [
            { 
              path: '/dashboard/staff', 
              label: isDapur ? 'Presensi & Menu Dapur' : isSarpras ? 'Presensi & Perbaikan' : 'Presensi & Tugas Utama', 
              icon: isDapur ? Utensils : isSarpras ? Wrench : CheckCircle2 
            },
            { 
              path: '/dashboard/staff/laporan', 
              label: isDapur ? 'Jurnal & Belanja Dapur' : isSarpras ? 'Jurnal & Belanja Sarpras' : 'Jurnal & Pengajuan Belanja', 
              icon: Receipt 
            },
          ]
        }
      ];
    }

    return sections;
  };

  const navSections = getNavSections();
  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      <div 
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-40 lg:hidden print:hidden transition-opacity duration-300 ease-in-out ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ========================================================= */}
      {/* BQA ISLAMIC THEMED SIDEBAR (CSidebar)                      */}
      {/* ========================================================= */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#065f46] dark:bg-[#081e16] border-r border-emerald-800/40 dark:border-emerald-900/60 text-slate-100 flex flex-col justify-between transition-all duration-300 ease-in-out print:hidden shadow-2xl lg:shadow-none bqa-bg-pattern ${
          sidebarFolded ? 'lg:w-20' : 'lg:w-64'
        } ${
          sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto scrollbar-thin">
          
          {/* Sidebar Brand Header - High Contrast Sharp BQA Logo */}
          <div className="h-16 px-4 border-b border-emerald-700/50 dark:border-emerald-900/60 flex items-center justify-between shrink-0 bg-[#044e3a]/90 dark:bg-[#05140e]/90 backdrop-blur-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              <BrandLogo size="md" className="filter drop-shadow-md" />
              
              {!sidebarFolded && (
                <div className="leading-tight overflow-hidden">
                  <h1 className="font-display font-bold text-sm text-white tracking-tight truncate">Baitul Qur'an</h1>
                  <p className="text-[10px] text-amber-300 font-bold tracking-wider uppercase truncate">Al-Ikhwan • HRIS</p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-emerald-200 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Navigation Links */}
          <div className="p-3 space-y-4 flex-1">
            {navSections.map((section, sIdx) => {
              const isExpanded = expandedSections[section.title] ?? true;
              return (
                <div key={sIdx} className="space-y-1">
                  {!sidebarFolded && (
                    <button 
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-amber-300/80 dark:text-amber-400/70 uppercase tracking-widest mb-1.5 hover:text-amber-200 transition-colors cursor-pointer"
                    >
                      <span>{section.title}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  
                  <div className={`space-y-1 overflow-hidden transition-all duration-300 ${(!sidebarFolded && !isExpanded) ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                    {section.items.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = currentPath === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            setCurrentPath(item.path);
                            setSidebarOpen(false);
                          }}
                          title={sidebarFolded ? item.label : undefined}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left cursor-pointer group relative ${
                            isActive
                              ? 'bg-[#047857]/80 text-amber-300 font-bold shadow-md border-l-4 border-l-[#d97706]'
                              : 'text-emerald-100/85 hover:text-white hover:bg-white/10 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <IconComponent className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                              isActive ? 'text-amber-300 scale-110' : 'text-emerald-200/75 group-hover:text-white'
                            }`} strokeWidth={1.75} />
                            
                            {!sidebarFolded && (
                              <span className="truncate leading-snug">{item.label}</span>
                            )}
                          </div>

                          {/* Badge if present */}
                          {!sidebarFolded && item.badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              isActive ? 'bg-[#d97706] text-white' : item.badgeColor || 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer & Fold Toggler */}
        <div className="border-t border-emerald-700/50 dark:border-emerald-900/60 bg-[#044e3a]/90 dark:bg-[#05140e]/90 backdrop-blur-xs">
          {/* User Profile Mini Bar */}
          {!sidebarFolded ? (
            <div className="p-3 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2.5 min-w-0 text-left hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer group"
                title="Klik untuk ubah foto & profil"
              >
                <TeacherAvatar teacher={currentUser} size="md" />
                <div className="overflow-hidden leading-tight">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-amber-300 transition-colors">{currentUser?.name || 'Pengguna'}</p>
                  <p className="text-[10px] text-amber-300/80 truncate">{currentUser?.position || currentRole}</p>
                </div>
              </button>
              <button
                onClick={logout}
                title="Keluar"
                className="p-1.5 text-emerald-200/70 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-3 flex justify-center">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                title="Klik untuk ubah foto & profil"
                className="hover:scale-105 transition-transform cursor-pointer"
              >
                <TeacherAvatar teacher={currentUser} size="md" />
              </button>
            </div>
          )}

          {/* Desktop Fold Toggle Button */}
          {setSidebarFolded && (
            <button
              onClick={() => setSidebarFolded(!sidebarFolded)}
              className="hidden lg:flex w-full items-center justify-center py-2 text-emerald-200/70 hover:text-white hover:bg-white/10 border-t border-emerald-700/50 transition-colors cursor-pointer text-xs"
              title={sidebarFolded ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            >
              {sidebarFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* TOP HEADER (CHeader)                                      */}
      {/* ========================================================= */}
      <header className={`fixed top-0 right-0 left-0 z-30 bg-white dark:bg-[#0c1813] border-b border-slate-200/90 dark:border-emerald-950/80 transition-all duration-300 print:hidden ${
        sidebarFolded ? 'lg:left-20' : 'lg:left-64'
      }`}>
        
        {/* Main Navbar Row */}
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Left: Mobile Drawer Trigger & BQA Brand Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* BQA Islamic Brand Header */}
            <div className="flex items-center gap-2.5">
              <BrandLogo size="md" className="filter drop-shadow-sm" />

              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xs text-slate-900 dark:text-emerald-50">Baitul Qur'an Al-Ikhwan</span>
                  <span className="hidden md:inline-flex items-center px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                    HRIS Asatidz
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-emerald-400/60 hidden sm:block">Pondok Pesantren Tahfidz Qur'an</p>
              </div>
            </div>
          </div>

          {/* Right: Actions, Filters, Notifications & Profile Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Refresh Data Button */}
            <button
              id="btn-refresh-data"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#13221b] dark:hover:bg-[#192b23] border border-slate-200 dark:border-emerald-800/40 text-slate-700 dark:text-emerald-100 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
              title="Segarkan Data dari Server"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            {/* Period Selector (CoreUI Form Select) */}
            <div className="relative hidden md:block">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-slate-50 dark:bg-[#13221b] border border-slate-200 dark:border-emerald-800/40 text-xs font-semibold text-slate-800 dark:text-emerald-100 py-1.5 pl-3 pr-8 rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-emerald-500 shadow-xs"
              >
                <option value="Agustus 2026">Agustus 2026</option>
                <option value="Juli 2026">Juli 2026</option>
                <option value="Juni 2026">Juni 2026</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-emerald-400/60 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Reset Database Button (Admin only) */}
            {currentRole === 'ADMIN' && (
              <button
                onClick={() => {
                  if (window.confirm('Yakin ingin reset ulang semua data ke pengaturan awal?')) {
                    resetToDefault();
                  }
                }}
                className="hidden sm:flex items-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                title="Reset Database ke Sample"
              >
                <RotateCcw className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                <span className="text-[11px]">Reset Data</span>
              </button>
            )}

            {/* Notification Bell (Guru Only) */}
            {currentRole === 'GURU' && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifPopover(!showNotifPopover)}
                  className={`p-2 rounded-lg transition-all cursor-pointer relative ${
                    showNotifPopover 
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' 
                      : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-emerald-300/70 dark:hover:bg-[#13221b] dark:hover:text-emerald-200'
                  }`}
                  title="Notifikasi Aktivitas"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </button>

                {/* Islamic Styled Notification Dropdown */}
                {showNotifPopover && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#121f1a] rounded-2xl border border-slate-200 dark:border-emerald-800/40 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="p-3.5 border-b border-slate-100 dark:border-emerald-900/30 flex items-center justify-between bg-slate-50/50 dark:bg-[#0f1a15]">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-emerald-100">
                          Pemberitahuan Guru
                        </h3>
                        <p className="text-[10px] text-slate-400 dark:text-emerald-400/60">
                          Info badal, jadwal KBM & verifikasi
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Tandai Dibaca</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-emerald-900/30 p-1">
                      {filteredNotifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 dark:text-emerald-400/60">
                          Tidak ada notifikasi baru
                        </div>
                      ) : (
                        filteredNotifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                              notif.isRead ? 'opacity-70 hover:opacity-100' : 'bg-slate-50/80 dark:bg-[#162720]'
                            } hover:bg-slate-100/70 dark:hover:bg-[#1a2e26]`}
                            onClick={() => {
                              markAsRead(notif.id);
                              setCurrentPath(notif.actionPath);
                              setShowNotifPopover(false);
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-emerald-100 truncate">
                                {notif.title}
                              </p>
                              <span className="text-[9px] text-slate-400 dark:text-emerald-400/60 font-mono">
                                {notif.timeLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 mt-0.5 line-clamp-1">
                              {notif.subtitle}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
              className="p-2 text-slate-500 hover:text-emerald-600 dark:text-emerald-300/70 dark:hover:text-emerald-200 hover:bg-slate-100 dark:hover:bg-[#13221b] rounded-lg transition-all cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-[#13221b] rounded-lg transition-colors cursor-pointer"
              >
                <TeacherAvatar teacher={currentUser} size="sm" />
                <div className="hidden lg:block text-left leading-tight">
                  <p className="text-xs font-semibold text-slate-800 dark:text-emerald-100 max-w-[110px] truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-emerald-400/60 capitalize">{currentRole.toLowerCase()}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-emerald-400/60 hidden lg:block" />
              </button>

              {/* User Menu Popover */}
              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-[#121f1a] rounded-2xl border border-slate-200 dark:border-emerald-800/40 shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-emerald-900/30 bg-slate-50/50 dark:bg-[#0f1a15] flex items-center gap-2.5">
                    <TeacherAvatar teacher={currentUser} size="md" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 dark:text-emerald-100 truncate">{currentUser?.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-emerald-400/60 truncate">{currentUser?.position} • {currentUser?.unit}</p>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-[#182922] rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Pengaturan Foto & Profil</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        if (currentRole === 'GURU') setCurrentPath('/dashboard/guru');
                        else if (currentRole === 'ADMIN') setCurrentPath('/dashboard/admin');
                        else setCurrentPath('/dashboard/kepsek');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-[#182922] rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-400 dark:text-emerald-400/60" />
                      <span>Dashboard Utama</span>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
};
