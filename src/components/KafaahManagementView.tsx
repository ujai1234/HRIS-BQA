import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  SlidersHorizontal, 
  ArrowUpDown, 
  TrendingUp, 
  Sparkles, 
  Calculator, 
  Layers, 
  Save, 
  RefreshCw,
  HelpCircle,
  Clock,
  Briefcase,
  ChevronRight,
  X,
  Info,
  Check
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { Teacher, UnitType } from '../types';
import { 
  formatRupiah, 
  formatNumber, 
  terbilang, 
  parseCurrencyInput, 
  formatCurrencyInput, 
  validateCurrencyRate,
  exportToCSV
} from '../utils/formatters';

export const KafaahManagementView: React.FC = () => {
  const { teachers, schedules, updateTeacher, logActivity } = useHRIS();

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<Teacher | null>(null);
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false);

  // In-line draft modifications map: { [teacherId]: { baseSalary, hourlyRate, dailyTransport } }
  const [inlineDrafts, setInlineDrafts] = useState<Record<string, {
    baseSalary: string;
    hourlyRate: string;
    dailyTransport: string;
    isDirty: boolean;
  }>>({});

  // Calculate teaching load (weekly hours and active schedule days) for each teacher
  const teacherLoadMap = useMemo(() => {
    const map: Record<string, { totalHours: number; totalDays: number; subjectCount: number }> = {};
    
    teachers.forEach(t => {
      map[t.id] = { totalHours: 0, totalDays: 0, subjectCount: 0 };
    });

    const teacherDaysMap: Record<string, Set<string>> = {};

    schedules.forEach(sched => {
      if (map[sched.teacherId]) {
        map[sched.teacherId].totalHours += (sched.durationHours || 2);
        map[sched.teacherId].subjectCount += 1;

        if (!teacherDaysMap[sched.teacherId]) {
          teacherDaysMap[sched.teacherId] = new Set();
        }
        teacherDaysMap[sched.teacherId].add(sched.dayOfWeek);
      }
    });

    Object.keys(teacherDaysMap).forEach(teacherId => {
      if (map[teacherId]) {
        map[teacherId].totalDays = teacherDaysMap[teacherId].size;
      }
    });

    return map;
  }, [teachers, schedules]);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch = searchQuery === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.position.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchUnit = unitFilter === 'ALL' || t.unit === unitFilter;
      return matchSearch && matchUnit;
    });
  }, [teachers, searchQuery, unitFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = teachers.length;
    if (total === 0) return { avgBase: 0, avgRate: 0, avgTransport: 0, totalEstimatedOutlay: 0 };

    let sumBase = 0;
    let sumRate = 0;
    let sumTransport = 0;
    let totalEstimatedOutlay = 0;

    teachers.forEach(t => {
      sumBase += t.baseSalary || 0;
      sumRate += t.hourlyRate || 0;
      sumTransport += t.dailyTransport || 0;

      const load = teacherLoadMap[t.id] || { totalHours: 0, totalDays: 0, subjectCount: 0 };
      const monthlyHours = load.totalHours * 4;
      const monthlyDays = (load.totalDays || Math.ceil(load.totalHours / 2)) * 4;
      
      const monthlyEstimate = (t.baseSalary || 0) + 
        (monthlyHours * (t.hourlyRate || 0)) + 
        (monthlyDays * (t.dailyTransport || 0));
      
      totalEstimatedOutlay += monthlyEstimate;
    });

    return {
      avgBase: Math.round(sumBase / total),
      avgRate: Math.round(sumRate / total),
      avgTransport: Math.round(sumTransport / total),
      totalEstimatedOutlay,
    };
  }, [teachers, teacherLoadMap]);

  // In-line change handler
  const handleInlineChange = (teacherId: string, field: 'baseSalary' | 'hourlyRate' | 'dailyTransport', rawVal: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const currentDraft = inlineDrafts[teacherId] || {
      baseSalary: String(teacher.baseSalary),
      hourlyRate: String(teacher.hourlyRate),
      dailyTransport: String(teacher.dailyTransport),
      isDirty: false,
    };

    const formatted = formatCurrencyInput(rawVal);

    setInlineDrafts(prev => ({
      ...prev,
      [teacherId]: {
        ...currentDraft,
        [field]: formatted,
        isDirty: true,
      }
    }));
  };

  const handleSaveInline = (teacher: Teacher) => {
    const draft = inlineDrafts[teacher.id];
    if (!draft) return;

    const newBaseSalary = parseCurrencyInput(draft.baseSalary);
    const newHourlyRate = parseCurrencyInput(draft.hourlyRate);
    const newDailyTransport = parseCurrencyInput(draft.dailyTransport);

    updateTeacher(teacher.id, {
      baseSalary: newBaseSalary,
      hourlyRate: newHourlyRate,
      dailyTransport: newDailyTransport,
    });

    // Clear draft for this teacher
    setInlineDrafts(prev => {
      const next = { ...prev };
      delete next[teacher.id];
      return next;
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'NIP',
      'Nama Asatidz',
      'Unit',
      'Jabatan',
      'Gaji Pokok (Rp)',
      'Kafaah per JP (Rp)',
      'Transport per Hari (Rp)',
      'Beban Jam/Minggu (JTM)',
      'Estimasi Kafaah Bulanan (Rp)'
    ];

    const rows = filteredTeachers.map(t => {
      const load = teacherLoadMap[t.id] || { totalHours: 0, totalDays: 0, subjectCount: 0 };
      const monthlyHours = load.totalHours * 4;
      const monthlyDays = (load.totalDays || Math.ceil(load.totalHours / 2)) * 4;
      const monthlyEstimate = t.baseSalary + (monthlyHours * t.hourlyRate) + (monthlyDays * t.dailyTransport);

      return [
        t.nip,
        t.name,
        t.unit,
        t.position,
        t.baseSalary,
        t.hourlyRate,
        t.dailyTransport,
        load.totalHours,
        monthlyEstimate
      ];
    });

    exportToCSV(`Struktur_Tarif_Kafaah_${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
  };

  return (
    <div id="kafaah-management-view" className="space-y-5">
      
      {/* Top Banner / Summary Header */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                <Coins className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Manajemen Tarif Kafa'ah & Honor Asatidz
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
              Kelola struktur nominal kafa'ah per jam pelajaran (JP), gaji pokok kehadiran tetap, dan uang transport harian secara terperinci dengan validasi Rupiah dan kalkulasi estimasi anggaran bulanan otomatis.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              id="bulk-adjust-rate-btn"
              onClick={() => setIsBulkAdjustOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 transition-colors shadow-2xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-500" />
              <span>Penyesuaian Massal Unit</span>
            </button>

            <button
              id="export-kafaah-csv-btn"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-stone-100 dark:border-stone-800">
          <div className="bg-stone-50/70 dark:bg-stone-800/40 p-3 rounded-lg border border-stone-200/70 dark:border-stone-800">
            <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Rata-rata Kafa'ah / JP</div>
            <div className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mt-0.5">{formatRupiah(stats.avgRate)}</div>
            <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">Standar per jam mengajar</div>
          </div>

          <div className="bg-stone-50/70 dark:bg-stone-800/40 p-3 rounded-lg border border-stone-200/70 dark:border-stone-800">
            <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Rata-rata Gaji Pokok</div>
            <div className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5">{formatRupiah(stats.avgBase)}</div>
            <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">Kehadiran pokok bulanan</div>
          </div>

          <div className="bg-stone-50/70 dark:bg-stone-800/40 p-3 rounded-lg border border-stone-200/70 dark:border-stone-800">
            <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Rata-rata Transport</div>
            <div className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5">{formatRupiah(stats.avgTransport)}</div>
            <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">Uang kehadiran harian</div>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200/70 dark:border-emerald-900/30">
            <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Estimasi Anggaran Kafa'ah</div>
            <div className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">{formatRupiah(stats.totalEstimatedOutlay)}</div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Proyeksi 1 bulan (Jadwal aktif)</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari asatidz, NIP, atau jabatan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
            {['ALL', 'SMP', 'MA', 'PESANTREN', 'UMUM'].map((unit) => (
              <button
                key={unit}
                onClick={() => setUnitFilter(unit)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  unitFilter === unit
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {unit === 'ALL' ? 'Semua Unit' : unit}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-stone-500 dark:text-stone-400 self-center">
          Menampilkan <strong className="text-stone-800 dark:text-stone-200">{filteredTeachers.length}</strong> guru
        </div>
      </div>

      {/* Main Granular Rates Table */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-800">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-4 w-60">Nama Asatidz & NIP</th>
                <th className="py-3 px-3 w-28 text-center">Beban KBM</th>
                <th className="py-3 px-3 text-right w-44">Gaji Pokok (Rp)</th>
                <th className="py-3 px-3 text-right w-44">Kafa'ah / JP (Rp)</th>
                <th className="py-3 px-3 text-right w-40">Transport / Hari</th>
                <th className="py-3 px-4 text-right w-48">Estimasi 1 Bulan</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-400 dark:text-stone-600">
                    <Coins className="w-8 h-8 mx-auto mb-1.5 text-stone-300 dark:text-stone-700" />
                    <p className="font-medium text-stone-600 dark:text-stone-400 text-xs">Tidak ada data guru yang sesuai pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, idx) => {
                  const load = teacherLoadMap[teacher.id] || { totalHours: 0, totalDays: 0, subjectCount: 0 };
                  const draft = inlineDrafts[teacher.id];

                  // Active values (either draft or saved)
                  const currentBase = draft ? parseCurrencyInput(draft.baseSalary) : teacher.baseSalary;
                  const currentRate = draft ? parseCurrencyInput(draft.hourlyRate) : teacher.hourlyRate;
                  const currentTransport = draft ? parseCurrencyInput(draft.dailyTransport) : teacher.dailyTransport;

                  // Estimated 1 month simulation (4 weeks)
                  const monthlyHours = load.totalHours * 4;
                  const monthlyDays = (load.totalDays || Math.ceil(load.totalHours / 2)) * 4;
                  const estimatedMonthly = currentBase + (monthlyHours * currentRate) + (monthlyDays * currentTransport);

                  const isDraftDirty = draft?.isDirty;

                  return (
                    <tr key={teacher.id} className={`hover:bg-stone-50/70 dark:hover:bg-stone-800/30 transition-colors ${isDraftDirty ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}`}>
                      {/* Number */}
                      <td className="py-3 px-3 text-center text-stone-400 dark:text-stone-500 font-mono">
                        {idx + 1}
                      </td>

                      {/* Name & NIP */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900 dark:text-stone-100">{teacher.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                            {teacher.nip}
                          </span>
                          <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                            {teacher.unit}
                          </span>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate max-w-[120px]">
                            {teacher.position}
                          </span>
                        </div>
                      </td>

                      {/* Teaching Load */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                            {load.totalHours} <span className="text-[10px] font-normal text-stone-500 dark:text-stone-400">JP/mg</span>
                          </span>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500">
                            {load.totalDays} hari ({load.subjectCount} mapel)
                          </span>
                        </div>
                      </td>

                      {/* Base Salary (In-line editable) */}
                      <td className="py-3 px-3 text-right">
                        <div className="relative flex items-center justify-end">
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 mr-1 select-none">Rp</span>
                          <input
                            type="text"
                            value={draft ? draft.baseSalary : formatCurrencyInput(teacher.baseSalary)}
                            onChange={(e) => handleInlineChange(teacher.id, 'baseSalary', e.target.value)}
                            className="w-28 text-right py-1 px-2 text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden text-stone-900 dark:text-stone-100"
                          />
                        </div>
                      </td>

                      {/* Hourly Rate (In-line editable) */}
                      <td className="py-3 px-3 text-right">
                        <div className="relative flex items-center justify-end">
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 mr-1 select-none">Rp</span>
                          <input
                            type="text"
                            value={draft ? draft.hourlyRate : formatCurrencyInput(teacher.hourlyRate)}
                            onChange={(e) => handleInlineChange(teacher.id, 'hourlyRate', e.target.value)}
                            className="w-24 text-right py-1 px-2 text-xs font-bold bg-white dark:bg-stone-800 border border-emerald-300 dark:border-emerald-800 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden text-emerald-800 dark:text-emerald-400"
                          />
                        </div>
                      </td>

                      {/* Daily Transport (In-line editable) */}
                      <td className="py-3 px-3 text-right">
                        <div className="relative flex items-center justify-end">
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 mr-1 select-none">Rp</span>
                          <input
                            type="text"
                            value={draft ? draft.dailyTransport : formatCurrencyInput(teacher.dailyTransport)}
                            onChange={(e) => handleInlineChange(teacher.id, 'dailyTransport', e.target.value)}
                            className="w-24 text-right py-1 px-2 text-xs font-medium bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden text-stone-800 dark:text-stone-300"
                          />
                        </div>
                      </td>

                      {/* Simulation */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {formatRupiah(estimatedMonthly)}
                        </div>
                        <div className="text-[10px] text-stone-400 dark:text-stone-500">
                          Pokok + {monthlyHours} JP + {monthlyDays} Trp
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isDraftDirty ? (
                            <button
                              onClick={() => handleSaveInline(teacher)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                              title="Simpan Perubahan"
                            >
                              <Save className="w-3 h-3" />
                              <span>Simpan</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedTeacherForEdit(teacher)}
                              className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
                              title="Buka Modal Rincian Kafa'ah & Terbilang"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Granular Modal Rate Editor with Currency Validation & Terbilang */}
      {selectedTeacherForEdit && (
        <GranularRateModal
          teacher={selectedTeacherForEdit}
          load={teacherLoadMap[selectedTeacherForEdit.id] || { totalHours: 0, totalDays: 0, subjectCount: 0 }}
          onClose={() => setSelectedTeacherForEdit(null)}
          onSave={(updates, auditNote) => {
            updateTeacher(selectedTeacherForEdit.id, updates);
            if (auditNote) {
              logActivity(
                'UPDATE_TEACHER_RATE',
                'KAFAAH',
                `Penyesuaian terperinci kafa'ah ${selectedTeacherForEdit.name}: Gaji Pokok -> Rp ${updates.baseSalary?.toLocaleString('id-ID')}, Honor/JP -> Rp ${updates.hourlyRate?.toLocaleString('id-ID')}, Transport -> Rp ${updates.dailyTransport?.toLocaleString('id-ID')} [Catatan: ${auditNote}]`,
                'WARNING'
              );
            }
            setSelectedTeacherForEdit(null);
          }}
        />
      )}

      {/* Bulk Unit Rate Adjustment Modal */}
      {isBulkAdjustOpen && (
        <BulkUnitRateModal
          teachers={teachers}
          onClose={() => setIsBulkAdjustOpen(false)}
          onApplyBulk={(targetUnit, newHourlyRate, newTransport, auditReason) => {
            const affectedTeachers = teachers.filter(t => targetUnit === 'ALL' || t.unit === targetUnit);
            affectedTeachers.forEach(t => {
              updateTeacher(t.id, {
                hourlyRate: newHourlyRate !== undefined ? newHourlyRate : t.hourlyRate,
                dailyTransport: newTransport !== undefined ? newTransport : t.dailyTransport,
              });
            });

            logActivity(
              'UPDATE_TEACHER_RATE',
              'KAFAAH',
              `Penyesuaian kafa'ah massal Unit ${targetUnit}: Diperbarui untuk ${affectedTeachers.length} guru [${auditReason}]`,
              'WARNING'
            );

            setIsBulkAdjustOpen(false);
          }}
        />
      )}

    </div>
  );
};

// Sub-Component: Granular Rate Modal with Live Currency Masking, Validation, Terbilang & Simulation
interface GranularRateModalProps {
  teacher: Teacher;
  load: { totalHours: number; totalDays: number; subjectCount: number };
  onClose: () => void;
  onSave: (updates: Partial<Teacher>, auditNote: string) => void;
}

const GranularRateModal: React.FC<GranularRateModalProps> = ({ teacher, load, onClose, onSave }) => {
  const [baseSalaryStr, setBaseSalaryStr] = useState(formatCurrencyInput(teacher.baseSalary));
  const [hourlyRateStr, setHourlyRateStr] = useState(formatCurrencyInput(teacher.hourlyRate));
  const [dailyTransportStr, setDailyTransportStr] = useState(formatCurrencyInput(teacher.dailyTransport));
  const [auditNote, setAuditNote] = useState('');

  // Numerical values
  const baseSalaryNum = parseCurrencyInput(baseSalaryStr);
  const hourlyRateNum = parseCurrencyInput(hourlyRateStr);
  const dailyTransportNum = parseCurrencyInput(dailyTransportStr);

  // Currency Validations
  const valBase = validateCurrencyRate(baseSalaryNum, 'baseSalary');
  const valHourly = validateCurrencyRate(hourlyRateNum, 'hourlyRate');
  const valTransport = validateCurrencyRate(dailyTransportNum, 'dailyTransport');

  // Simulation
  const weeklyHours = load.totalHours;
  const weeklyDays = load.totalDays || Math.ceil(load.totalHours / 2);
  const monthlyHours = weeklyHours * 4;
  const monthlyDays = weeklyDays * 4;

  const monthlyBase = baseSalaryNum;
  const monthlyHonor = monthlyHours * hourlyRateNum;
  const monthlyTransport = monthlyDays * dailyTransportNum;
  const monthlyTotal = monthlyBase + monthlyHonor + monthlyTransport;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valBase.isValid || !valHourly.isValid || !valTransport.isValid) return;

    onSave({
      baseSalary: baseSalaryNum,
      hourlyRate: hourlyRateNum,
      dailyTransport: dailyTransportNum,
    }, auditNote || 'Pembaruan tarif kafa\'ah melalui formulir terperinci');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                Pengaturan Kafa'ah Asatidz
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {teacher.name} ({teacher.nip}) - Unit {teacher.unit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Current Teaching Load Card */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-700 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Beban Mengajar Terdaftar (KBM)</div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {load.subjectCount} Jadwal Mapel aktif dalam {weeklyDays} hari mengajar
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">{weeklyHours} JP / Minggu</div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500">~{monthlyHours} JP per bulan</div>
            </div>
          </div>

          {/* 1. Gaji Pokok Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <span>Gaji Pokok / Kehadiran Tetap</span>
                {valBase.status === 'warning' && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/50">
                    {valBase.message}
                  </span>
                )}
              </label>
              <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 font-semibold">
                {formatRupiah(baseSalaryNum)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -transtone-y-1/2 font-semibold text-stone-400 dark:text-stone-500 text-xs">Rp</span>
              <input
                type="text"
                value={baseSalaryStr}
                onChange={(e) => setBaseSalaryStr(formatCurrencyInput(e.target.value))}
                className="w-full pl-9 pr-4 py-2 text-sm font-bold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 dark:text-stone-100 font-mono"
              />
            </div>

            {/* Terbilang Live Text */}
            <div className="text-[11px] text-stone-500 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-800/80 px-2.5 py-1 rounded border border-stone-100 dark:border-stone-700">
              Terbilang: <span className="text-stone-800 dark:text-stone-200 font-medium">{terbilang(baseSalaryNum)}</span>
            </div>

            {/* Preset chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-stone-400 dark:text-stone-500">Pilihan cepat:</span>
              {[500000, 700000, 850000, 1000000, 1250000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBaseSalaryStr(formatCurrencyInput(preset))}
                  className="px-2 py-0.5 text-[10px] font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded transition-colors cursor-pointer"
                >
                  {formatNumber(preset / 1000)}k
                </button>
              ))}
            </div>
          </div>

          {/* 2. Kafa'ah per Jam (Hourly Rate) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <span>Honor Kafa'ah per Jam Pelajaran (JP)</span>
                {valHourly.status === 'warning' && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/50">
                    {valHourly.message}
                  </span>
                )}
                {valHourly.status === 'error' && (
                  <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800/50">
                    {valHourly.message}
                  </span>
                )}
              </label>
              <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 font-semibold">
                {formatRupiah(hourlyRateNum)} / JP
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -transtone-y-1/2 font-semibold text-stone-400 dark:text-stone-500 text-xs">Rp</span>
              <input
                type="text"
                value={hourlyRateStr}
                onChange={(e) => setHourlyRateStr(formatCurrencyInput(e.target.value))}
                className="w-full pl-9 pr-4 py-2 text-sm font-bold bg-white dark:bg-stone-800 border border-emerald-300 dark:border-emerald-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-emerald-900 dark:text-emerald-100 font-mono"
              />
            </div>

            {/* Terbilang Live Text */}
            <div className="text-[11px] text-stone-500 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-800/80 px-2.5 py-1 rounded border border-stone-100 dark:border-stone-700">
              Terbilang: <span className="text-stone-800 dark:text-stone-200 font-medium">{terbilang(hourlyRateNum)}</span> per Jam
            </div>

            {/* Preset chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-stone-400 dark:text-stone-500">Standar pesantren:</span>
              {[35000, 40000, 45000, 50000, 60000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setHourlyRateStr(formatCurrencyInput(preset))}
                  className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-800/50 transition-colors cursor-pointer"
                >
                  {formatNumber(preset / 1000)}k / JP
                </button>
              ))}
            </div>
          </div>

          {/* 3. Transport per Hari */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <span>Uang Transport per Hari Hadir</span>
                {valTransport.status === 'warning' && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/50">
                    {valTransport.message}
                  </span>
                )}
              </label>
              <span className="text-[11px] font-mono text-stone-700 dark:text-stone-300 font-semibold">
                {formatRupiah(dailyTransportNum)} / Hari
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -transtone-y-1/2 font-semibold text-stone-400 dark:text-stone-500 text-xs">Rp</span>
              <input
                type="text"
                value={dailyTransportStr}
                onChange={(e) => setDailyTransportStr(formatCurrencyInput(e.target.value))}
                className="w-full pl-9 pr-4 py-2 text-sm font-bold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 dark:text-stone-100 font-mono"
              />
            </div>

            {/* Preset chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-stone-400 dark:text-stone-500">Pilihan cepat:</span>
              {[10000, 15000, 20000, 25000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDailyTransportStr(formatCurrencyInput(preset))}
                  className="px-2 py-0.5 text-[10px] font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded transition-colors cursor-pointer"
                >
                  {formatNumber(preset / 1000)}k / Hari
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Calculation Simulation Breakdown Box */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-950 dark:text-emerald-100 pb-2 border-b border-emerald-200/60 dark:border-emerald-900/50">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                Simulasi Kafa'ah 1 Bulan ({teacher.name})
              </span>
              <span className="text-emerald-900 dark:text-emerald-200 font-mono text-sm">{formatRupiah(monthlyTotal)}</span>
            </div>

            <div className="space-y-1 text-[11px] text-emerald-900/80 dark:text-emerald-400/80">
              <div className="flex justify-between">
                <span>Gaji Pokok / Kehadiran:</span>
                <span className="font-mono">{formatRupiah(monthlyBase)}</span>
              </div>
              <div className="flex justify-between">
                <span>Honor Mengajar ({monthlyHours} JP × {formatRupiah(hourlyRateNum)}):</span>
                <span className="font-mono">{formatRupiah(monthlyHonor)}</span>
              </div>
              <div className="flex justify-between">
                <span>Transport ({monthlyDays} Hari × {formatRupiah(dailyTransportNum)}):</span>
                <span className="font-mono">{formatRupiah(monthlyTransport)}</span>
              </div>
            </div>
          </div>

          {/* Audit Note */}
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Catatan / Dasar Penyesuaian (Opsional):
            </label>
            <input
              type="text"
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              placeholder="Contoh: SK Pengurus Yayasan No. 04/2026 atau Kenaikan Masa Kerja"
              className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!valBase.isValid || !valHourly.isValid || !valTransport.isValid}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:bg-stone-300 dark:disabled:bg-stone-700 disabled:cursor-not-allowed"
            >
              Simpan Perubahan Kafa'ah
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// Sub-Component: Bulk Unit Rate Adjustment Modal
interface BulkUnitRateModalProps {
  teachers: Teacher[];
  onClose: () => void;
  onApplyBulk: (unit: string, hourlyRate: number | undefined, transport: number | undefined, reason: string) => void;
}

const BulkUnitRateModal: React.FC<BulkUnitRateModalProps> = ({ teachers, onClose, onApplyBulk }) => {
  const [targetUnit, setTargetUnit] = useState<string>('SMP');
  const [updateHourly, setUpdateHourly] = useState(true);
  const [hourlyRateStr, setHourlyRateStr] = useState('40.000');
  const [updateTransport, setUpdateTransport] = useState(false);
  const [transportStr, setTransportStr] = useState('10.000');
  const [reason, setReason] = useState('Penyesuaian massal awal tahun ajaran baru');

  const affectedCount = teachers.filter(t => targetUnit === 'ALL' || t.unit === targetUnit).length;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const newHourly = updateHourly ? parseCurrencyInput(hourlyRateStr) : undefined;
    const newTransport = updateTransport ? parseCurrencyInput(transportStr) : undefined;

    onApplyBulk(targetUnit, newHourly, newTransport, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 dark:border-stone-800">
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Penyesuaian Tarif Massal Unit</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Terapkan standarisasi tarif untuk seluruh guru dalam unit</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 p-1 text-xs cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">Pilih Unit Sasaran</label>
            <select
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-semibold text-stone-800 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="SMP">Unit SMP (Sekolah Menengah Pertama)</option>
              <option value="MA">Unit MA (Madrasah Aliyah)</option>
              <option value="PESANTREN">Unit PESANTREN (Kepesantrenan & Asrama)</option>
              <option value="UMUM">Unit UMUM</option>
              <option value="ALL">Semua Unit ({teachers.length} Guru)</option>
            </select>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
              Akan diterapkan ke {affectedCount} asatidz di unit ini.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800 dark:text-stone-200">
              <input
                type="checkbox"
                checked={updateHourly}
                onChange={(e) => setUpdateHourly(e.target.checked)}
                className="rounded border-stone-300 dark:border-stone-700 text-emerald-700 dark:text-emerald-500 focus:ring-emerald-500"
              />
              <span>Perbarui Tarif Kafa'ah per Jam Pelajaran (JP)</span>
            </label>

            {updateHourly && (
              <div className="pl-6 space-y-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -transtone-y-1/2 text-stone-400 dark:text-stone-500 text-xs font-semibold">Rp</span>
                  <input
                    type="text"
                    value={hourlyRateStr}
                    onChange={(e) => setHourlyRateStr(formatCurrencyInput(e.target.value))}
                    className="w-full pl-9 pr-3 py-1.5 font-bold font-mono text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-800 border border-emerald-300 dark:border-emerald-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400 italic">
                  Terbilang: {terbilang(parseCurrencyInput(hourlyRateStr))}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800 dark:text-stone-200">
              <input
                type="checkbox"
                checked={updateTransport}
                onChange={(e) => setUpdateTransport(e.target.checked)}
                className="rounded border-stone-300 dark:border-stone-700 text-emerald-700 dark:text-emerald-500 focus:ring-emerald-500"
              />
              <span>Perbarui Uang Transport per Hari</span>
            </label>

            {updateTransport && (
              <div className="pl-6 space-y-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -transtone-y-1/2 text-stone-400 dark:text-stone-500 text-xs font-semibold">Rp</span>
                  <input
                    type="text"
                    value={transportStr}
                    onChange={(e) => setTransportStr(formatCurrencyInput(e.target.value))}
                    className="w-full pl-9 pr-3 py-1.5 font-bold font-mono text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400 italic">
                  Terbilang: {terbilang(parseCurrencyInput(transportStr))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">Keterangan Penyesuaian</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100"
            />
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!updateHourly && !updateTransport}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:bg-stone-300 dark:disabled:bg-stone-700 disabled:cursor-not-allowed"
            >
              Terapkan ke {affectedCount} Guru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
