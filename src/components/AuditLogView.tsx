import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Info
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { AuditCategory, AuditSeverity, UserRole } from '../types';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useHRIS();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | 'ALL'>('ALL');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'SYSTEM' | 'ALL'>('ALL');

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch = searchTerm === '' || 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ipAddress && log.ipAddress.includes(searchTerm));

      const matchCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
      const matchSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
      const matchRole = roleFilter === 'ALL' || log.userRole === roleFilter;

      return matchSearch && matchCategory && matchSeverity && matchRole;
    });
  }, [auditLogs, searchTerm, categoryFilter, severityFilter, roleFilter]);

  // Summary Metrics
  const totalLogs = auditLogs.length;
  const kafaahLogs = auditLogs.filter(l => l.category === 'KAFAAH').length;
  const kbmLogs = auditLogs.filter(l => l.category === 'KBM' || l.category === 'BADAL').length;
  const criticalLogs = auditLogs.filter(l => l.severity === 'CRITICAL' || l.severity === 'WARNING').length;

  const getCategoryBadge = (category: AuditCategory) => {
    switch (category) {
      case 'AUTH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">Autentikasi</span>;
      case 'KAFAAH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">Kafa'ah</span>;
      case 'KBM':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">Presensi</span>;
      case 'BADAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">Badal</span>;
      case 'SYSTEM':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Sistem</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{category}</span>;
    }
  };

  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
            Kritis
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
            Peringatan
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
            Info
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">Admin</span>;
      case 'KEPALA_PESANTREN':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">Kepsek</span>;
      case 'GURU':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Guru</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400">Sistem</span>;
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Waktu', 'Nama Pengguna', 'Role', 'Kategori', 'Aksi', 'Tingkat', 'Detail Aktivitas', 'IP Address'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${new Date(l.timestamp).toLocaleString('id-ID')}"`,
      `"${l.userName}"`,
      l.userRole,
      l.category,
      l.action,
      l.severity,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ipAddress || '127.0.0.1'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Log_HRIS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
            Audit Log & Keamanan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rekam jejak aktivitas sistem dan perubahan data kafa'ah
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Entri</span>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1 font-mono">{totalLogs}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">Audit aktif</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Perubahan Kafa'ah</span>
          <p className="text-2xl font-semibold text-amber-700 dark:text-amber-500 mt-1 font-mono">{kafaahLogs}</p>
          <span className="text-[11px] text-amber-600 dark:text-amber-500/70 block mt-1">Audit honor/gaji</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Aktivitas KBM</span>
          <p className="text-2xl font-semibold text-emerald-800 dark:text-emerald-400 mt-1 font-mono">{kbmLogs}</p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-500/70 block mt-1">Presensi & Badal</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Isu Kritis</span>
          <p className="text-2xl font-semibold text-rose-700 dark:text-rose-500 mt-1 font-mono">{criticalLogs}</p>
          <span className="text-[11px] text-rose-600 dark:text-rose-500/70 block mt-1">Perlu perhatian</span>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pelaksana atau aktivitas..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="AUTH">Autentikasi</option>
              <option value="KAFAAH">Kafa'ah</option>
              <option value="KBM">Presensi</option>
              <option value="BADAL">Badal</option>
              <option value="SYSTEM">Sistem</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Peringatan</option>
              <option value="CRITICAL">Kritis</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">Semua Role</option>
              <option value="ADMIN">Admin</option>
              <option value="KEPALA_PESANTREN">Kepsek</option>
              <option value="GURU">Guru</option>
              <option value="SYSTEM">Sistem</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/70 dark:border-slate-700">
                <th className="py-2.5 px-4 w-32">Waktu</th>
                <th className="py-2.5 px-4 w-40">Pelaksana</th>
                <th className="py-2.5 px-3">Kategori & Aksi</th>
                <th className="py-2.5 px-4">Rincian Aktivitas</th>
                <th className="py-2.5 px-3 text-center w-24">Tingkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 dark:text-slate-600">
                    Tidak ada log audit yang sesuai kriteria
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                  const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{formattedTime}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{formattedDate}</p>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{log.userName}</p>
                        <div className="mt-1 flex items-center gap-1">
                          {getRoleBadge(log.userRole)}
                          {log.ipAddress && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {log.ipAddress}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top">
                        {getCategoryBadge(log.category)}
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 font-medium">
                          {log.action}
                        </p>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">{log.details}</p>
                      </td>

                      <td className="py-3 px-3 align-top text-center">
                        {getSeverityBadge(log.severity)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
