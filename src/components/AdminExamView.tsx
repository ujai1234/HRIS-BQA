import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  UploadCloud, 
  Calendar, 
  Clock, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Download,
  Info,
  MapPin,
  BookOpen
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ExamSession, ExamProctor, UnitType } from '../types';
import { BulkExamUploadModal } from './BulkExamUploadModal';
import { AddExamSessionModal } from './AddExamSessionModal';
import { AssignExamBadalModal } from './AssignExamBadalModal';
import { useConfirm } from '../context/ConfirmContext';
import * as XLSX from 'xlsx';

export const AdminExamView: React.FC = () => {
  const { 
    examEvents, 
    examSessions, 
    teachers, 
    deleteExamSession, 
    deleteExamEvent,
    academicSettings 
  } = useHRIS();
  const { confirm } = useConfirm();

  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [badalTarget, setBadalTarget] = useState<{ session: ExamSession; proctor: ExamProctor } | null>(null);

  // Extract all unique dates from exam sessions
  const availableDates = Array.from(new Set(examSessions.map(s => s.date))).sort();

  // Active filtered sessions
  const filteredSessions = examSessions.filter(s => {
    if (selectedEventId !== 'ALL' && s.eventId !== selectedEventId) return false;
    
    // Check unit from event
    const event = examEvents.find(e => e.id === s.eventId);
    if (selectedUnitFilter !== 'ALL' && event && event.unit !== selectedUnitFilter) return false;
    
    if (selectedDateFilter !== 'ALL' && s.date !== selectedDateFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = s.subject.toLowerCase().includes(q);
      const matchClass = s.targetClass.toLowerCase().includes(q);
      const matchRoom = s.roomName.toLowerCase().includes(q);
      const matchProctor = s.proctors?.some(p => {
        const teacher = teachers.find(t => t.id === p.teacherId);
        const repl = p.replacementTeacherId ? teachers.find(t => t.id === p.replacementTeacherId) : null;
        return (teacher && teacher.name.toLowerCase().includes(q)) || (repl && repl.name.toLowerCase().includes(q));
      });
      return matchSubject || matchClass || matchRoom || matchProctor;
    }

    return true;
  });

  const handleDeleteSession = async (sessionId: string, subject: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Sesi Ujian?',
      message: `Apakah Anda yakin ingin menghapus sesi ujian "${subject}"? Data penugasan pengawas dan presensi terkait akan dihapus.`,
      confirmText: 'Ya, Hapus Sesi',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (isConfirmed) {
      await deleteExamSession(sessionId);
    }
  };

  const downloadTemplate = () => {
    const sampleData = [
      {
        'Tanggal (YYYY-MM-DD)': '2026-11-23',
        'Hari': 'SENIN',
        'Sesi': 'Sesi 1 (Pagi)',
        'Jam Mulai': '07:30',
        'Jam Selesai': '09:00',
        'Durasi Menit': 90,
        'Mata Pelajaran': 'Fiqih Ibadah',
        'Kelas': 'VII-A',
        'Ruang Ujian': 'Ruang Kelas 7A',
        'NIP / Nama Pengawas 1': teachers[0]?.nip || 'PBQ-2018-002',
        'NIP / Nama Pengawas 2': teachers[1]?.nip || 'PBQ-2020-007',
        'Tarif Sesi (Opsional)': 80000
      },
      {
        'Tanggal (YYYY-MM-DD)': '2026-11-23',
        'Hari': 'SENIN',
        'Sesi': 'Sesi 2 (Siang)',
        'Jam Mulai': '09:30',
        'Jam Selesai': '11:00',
        'Durasi Menit': 90,
        'Mata Pelajaran': 'Bahasa Arab',
        'Kelas': 'VII-A',
        'Ruang Ujian': 'Ruang Kelas 7A',
        'NIP / Nama Pengawas 1': teachers[2]?.nip || 'PBQ-2020-008',
        'NIP / Nama Pengawas 2': '',
        'Tarif Sesi (Opsional)': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal_Ujian');
    XLSX.writeFile(workbook, 'Template_Jadwal_Pengawas_Ujian.xlsx');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Event Header Card & Quick Operations */}
      <div className="bqa-card p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-emerald-100">
                Pusat Kontrol Jadwal & Pengawasan Ujian (UTS / UAS)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-emerald-400/80 mt-1 max-w-xl">
              Kelola sesi ujian, penugasan asatidz pengawas, dan pemantauan presensi ujian. Jadwal pengawasan ujian otomatis terhitung dalam perhitungan kafa'ah guru.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#163832] dark:hover:bg-[#1b433c] text-slate-700 dark:text-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Unduh Format Excel untuk Impor Massal"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Format Excel</span>
            </button>

            <button
              onClick={() => setIsBulkUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shadow-amber-900/20"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah CSV / Excel</span>
            </button>

            <button
              onClick={() => setIsAddSessionOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shadow-emerald-900/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Sesi Manual</span>
            </button>
          </div>
        </div>

        {/* Event Selector Pill Bar */}
        {examEvents.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#163832] flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Event Ujian:</span>
            <button
              onClick={() => setSelectedEventId('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedEventId === 'ALL'
                  ? 'bg-[#163832] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#0B2B26] text-slate-600 dark:text-emerald-400 hover:bg-slate-200'
              }`}
            >
              Semua Event ({examEvents.length})
            </button>
            {examEvents.map(ev => (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedEventId === ev.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#0B2B26] text-slate-600 dark:text-emerald-400 hover:bg-slate-200'
                }`}
              >
                <span>{ev.title}</span>
                <span className="text-[10px] opacity-80 uppercase">({ev.unit})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bqa-card p-4 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div className="relative w-full lg:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mapel, kelas, ruang, atau nama pengawas..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0B2B26] border border-slate-200 dark:border-[#163832] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Unit Filter */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#051F20] border border-slate-200 dark:border-[#163832] p-1 rounded-xl">
              {['ALL', 'PESANTREN', 'SMP', 'MA'].map(unit => (
                <button
                  key={unit}
                  onClick={() => setSelectedUnitFilter(unit)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer uppercase ${
                    selectedUnitFilter === unit
                      ? 'bg-[#163832] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-emerald-400/70'
                  }`}
                >
                  {unit === 'ALL' ? 'Semua Unit' : unit}
                </button>
              ))}
            </div>

            {/* Date Filter Dropdown */}
            {availableDates.length > 0 && (
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="ALL">Semua Tanggal Ujian</option>
                {availableDates.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-emerald-400/70 pt-2 border-t border-slate-100 dark:border-[#163832]">
          <span>Menampilkan <strong>{filteredSessions.length}</strong> sesi ujian dari total {examSessions.length} sesi</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold">Toleransi presensi pengawas: ≤ 5 menit = Tepat Waktu</span>
        </div>
      </div>

      {/* Exam Sessions Table / Cards */}
      <div className="bqa-card overflow-hidden">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-emerald-200">
              Belum Ada Jadwal Sesi Ujian
            </h4>
            <p className="text-xs text-slate-500 dark:text-emerald-400/70 max-w-md mx-auto">
              Silakan unggah jadwal ujian dan pengawas menggunakan template Excel/CSV atau tambahkan sesi ujian manual.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setIsBulkUploadOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Unggah Jadwal Ujian Sekarang
              </button>
              <button
                onClick={() => setIsAddSessionOpen(true)}
                className="px-4 py-2 border border-slate-200 dark:border-[#163832] rounded-xl text-xs font-semibold text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-[#163832] cursor-pointer"
              >
                + Tambah Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#051F20] text-slate-500 dark:text-emerald-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-[#163832]">
                <tr>
                  <th className="py-3 px-4">Tanggal & Sesi</th>
                  <th className="py-3 px-4">Mata Pelajaran & Kelas</th>
                  <th className="py-3 px-4">Ruang Ujian</th>
                  <th className="py-3 px-4">Pengawas Terjadwal</th>
                  <th className="py-3 px-4">Status Presensi & BAP</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#163832] text-slate-800 dark:text-emerald-100">
                {filteredSessions.map((session) => {
                  return (
                    <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-[#163832]/30 transition-colors">
                      
                      {/* Tanggal & Waktu */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span>{session.dayOfWeek}, {session.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-emerald-400/80 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{session.startTime} - {session.endTime} ({session.durationMinutes} mnt)</span>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {session.sessionName}
                        </div>
                      </td>

                      {/* Mapel & Kelas */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {session.subject}
                        </div>
                        <div className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          Kelas: {session.targetClass}
                        </div>
                      </td>

                      {/* Ruang */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-emerald-100">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{session.roomName}</span>
                        </div>
                      </td>

                      {/* Pengawas */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {session.proctors && session.proctors.length > 0 ? (
                            session.proctors.map((proc, pIdx) => {
                              const origTeacher = proc.teacher || teachers.find(t => t.id === proc.teacherId);
                              const replTeacher = proc.replacementTeacher || (proc.replacementTeacherId ? teachers.find(t => t.id === proc.replacementTeacherId) : null);
                              const isReplaced = proc.status === 'REPLACED' || !!proc.replacementTeacherId;

                              return (
                                <div key={proc.id || pIdx} className="text-xs">
                                  {isReplaced ? (
                                    <div>
                                      <div className="line-through text-slate-400 text-[11px]">
                                        {origTeacher?.name || proc.teacherId}
                                      </div>
                                      <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                        <UserCheck className="w-3.5 h-3.5" />
                                        <span>Badal: {replTeacher?.name || proc.replacementTeacherId}</span>
                                      </div>
                                      {proc.badalReason && (
                                        <div className="text-[10px] text-slate-400 italic">"{proc.badalReason}"</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-slate-900 dark:text-white">
                                        {origTeacher?.name || proc.teacherId}
                                      </span>
                                      <button
                                        onClick={() => setBadalTarget({ session, proctor: proc })}
                                        className="text-[10px] text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                                        title="Tunjuk Asatidz Badal jika berhalangan"
                                      >
                                        Tunjuk Badal
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 italic">Belum ada pengawas</span>
                          )}
                        </div>
                      </td>

                      {/* Status Presensi & BAP */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {session.proctors && session.proctors.length > 0 ? (
                            session.proctors.map((proc, pIdx) => {
                              const att = proc.attendance;
                              const rep = proc.report || att?.examReport;

                              if (rep || att?.status === 'SELESAI') {
                                return (
                                  <div key={pIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>BAP Selesai (Hadir: {rep?.presentCount || 0})</span>
                                  </div>
                                );
                              }

                              if (att && att.clockInTime) {
                                return (
                                  <div key={pIdx} className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                                      ✓ Hadir Jam {att.clockInTime}
                                    </span>
                                    <div className="text-[10px] text-slate-500">
                                      {att.lateCategory === 'TEPAT_WAKTU' ? (
                                        <span className="text-emerald-600 font-semibold">Tepat Waktu (≤5 mnt)</span>
                                      ) : (
                                        <span className="text-rose-600 font-semibold">Terlambat {att.lateMinutes} mnt</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <span key={pIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#163832] text-slate-500 text-[10px] font-semibold">
                                  Belum Hadir
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteSession(session.id, session.subject)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Sesi Ujian"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isBulkUploadOpen && (
        <BulkExamUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          selectedEventId={selectedEventId !== 'ALL' ? selectedEventId : undefined}
          defaultUnit={selectedUnitFilter !== 'ALL' ? (selectedUnitFilter as UnitType) : 'PESANTREN'}
        />
      )}

      {isAddSessionOpen && (
        <AddExamSessionModal
          isOpen={isAddSessionOpen}
          onClose={() => setIsAddSessionOpen(false)}
          defaultEventId={selectedEventId !== 'ALL' ? selectedEventId : undefined}
          defaultUnit={selectedUnitFilter !== 'ALL' ? (selectedUnitFilter as UnitType) : 'PESANTREN'}
        />
      )}

      {badalTarget && (
        <AssignExamBadalModal
          isOpen={!!badalTarget}
          onClose={() => setBadalTarget(null)}
          session={badalTarget.session}
          proctor={badalTarget.proctor}
        />
      )}

    </div>
  );
};

