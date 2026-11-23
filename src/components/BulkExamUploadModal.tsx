import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Info,
  Calendar,
  Users
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { DayOfWeek, UnitType } from '../types';
import * as XLSX from 'xlsx';

interface BulkExamUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEventId?: string;
  defaultUnit?: UnitType;
}

interface ParsedExamRow {
  rowNum: number;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  sessionName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  subject: string;
  targetClass: string;
  roomName: string;
  proctor1Identifier: string;
  proctor1TeacherId?: string;
  proctor1Name?: string;
  proctor2Identifier?: string;
  proctor2TeacherId?: string;
  proctor2Name?: string;
  customRate?: number | null;
  isValid: boolean;
  errors: string[];
}

const formatTimeValue = (val: any, fallback: string): string => {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') {
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  const str = String(val).trim();
  if (/^\d{1,2}:\d{2}/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m.slice(0, 2)}`;
  }
  return str || fallback;
};

const formatDateValue = (val: any): string => {
  if (!val) return new Date().toISOString().slice(0, 10);
  if (typeof val === 'number') {
    // Excel date serial number to YYYY-MM-DD
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  // If DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
};

export const BulkExamUploadModal: React.FC<BulkExamUploadModalProps> = ({ 
  isOpen, 
  onClose,
  selectedEventId: initialEventId,
  defaultUnit = 'PESANTREN'
}) => {
  const { teachers, examEvents, createExamEvent, addExamSessionsBulk } = useHRIS();

  const [targetEventId, setTargetEventId] = useState<string>(initialEventId || (examEvents[0]?.id || ''));
  const [newEventTitle, setNewEventTitle] = useState('UTS Semester Ganjil 2026/2027');
  const [newEventUnit, setNewEventUnit] = useState<UnitType>(defaultUnit);
  const [isCreatingEvent, setIsCreatingEvent] = useState(examEvents.length === 0);

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedExamRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ sessionsCount: number; proctorsCount: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

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
      },
      {
        'Tanggal (YYYY-MM-DD)': '2026-11-24',
        'Hari': 'SELASA',
        'Sesi': 'Sesi 1 (Pagi)',
        'Jam Mulai': '07:30',
        'Jam Selesai': '09:00',
        'Durasi Menit': 90,
        'Mata Pelajaran': 'Tahfidz Al-Qur\'an',
        'Kelas': 'VIII-B',
        'Ruang Ujian': 'Ruang Kelas 8B',
        'NIP / Nama Pengawas 1': teachers[1]?.nip || 'PBQ-2020-007',
        'NIP / Nama Pengawas 2': '',
        'Tarif Sesi (Opsional)': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal_Ujian');
    XLSX.writeFile(workbook, `Template_Jadwal_Ujian_${defaultUnit}.xlsx`);
  };

  const handleFileUpload = (file: File) => {
    setErrorMessage(null);
    setSuccessResult(null);
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rawJson || rawJson.length === 0) {
          setErrorMessage('File spreadsheet kosong atau format tidak sesuai.');
          setIsProcessing(false);
          return;
        }

        const teacherByNip = new Map<string, typeof teachers[0]>();
        const teacherByName = new Map<string, typeof teachers[0]>();
        teachers.forEach(t => {
          teacherByNip.set(t.nip.trim().toLowerCase(), t);
          teacherByName.set(t.name.trim().toLowerCase(), t);
        });

        const rows: ParsedExamRow[] = [];

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // header is row 1
          const rawDate = row['Tanggal (YYYY-MM-DD)'] || row['Tanggal'] || row['date'];
          const date = formatDateValue(rawDate);
          
          let dayOfWeek = String(row['Hari'] || row['hari'] || row['dayOfWeek'] || 'SENIN').toUpperCase().trim() as DayOfWeek;
          const validDays: DayOfWeek[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'AHAD'];
          if (!validDays.includes(dayOfWeek)) {
            // Infer from date
            const parsedD = new Date(date);
            const daysMap: DayOfWeek[] = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
            dayOfWeek = daysMap[parsedD.getDay()] || 'SENIN';
          }

          const sessionName = String(row['Sesi'] || row['sesi'] || row['sessionName'] || 'Sesi Ujian').trim();
          const startTime = formatTimeValue(row['Jam Mulai'] || row['start_time'] || row['startTime'], '07:30');
          const endTime = formatTimeValue(row['Jam Selesai'] || row['end_time'] || row['endTime'], '09:00');
          const durationMinutes = Number(row['Durasi Menit'] || row['durasi'] || 90) || 90;
          const subject = String(row['Mata Pelajaran'] || row['mapel'] || row['subject'] || '').trim();
          const targetClass = String(row['Kelas'] || row['kelas'] || row['targetClass'] || '-').trim();
          const roomName = String(row['Ruang Ujian'] || row['ruang'] || row['roomName'] || 'Ruang Ujian').trim();
          const customRate = row['Tarif Sesi (Opsional)'] || row['customRate'] ? Number(row['Tarif Sesi (Opsional)'] || row['customRate']) : null;

          const p1 = String(row['NIP / Nama Pengawas 1'] || row['Pengawas 1'] || row['proctor1'] || '').trim();
          const p2 = String(row['NIP / Nama Pengawas 2'] || row['Pengawas 2'] || row['proctor2'] || '').trim();

          const errors: string[] = [];
          if (!subject) errors.push('Mata pelajaran tidak boleh kosong');
          if (!p1) errors.push('Pengawas 1 harus diisi');

          // Match proctor 1
          let proctor1Teacher = teacherByNip.get(p1.toLowerCase()) || teacherByName.get(p1.toLowerCase());
          if (!proctor1Teacher && p1) {
            // Fuzzy search by substring
            proctor1Teacher = teachers.find(t => 
              t.name.toLowerCase().includes(p1.toLowerCase()) || 
              p1.toLowerCase().includes(t.name.toLowerCase()) ||
              t.nip.toLowerCase().includes(p1.toLowerCase())
            );
          }
          if (!proctor1Teacher && p1) {
            errors.push(`Pengawas 1 ("${p1}") tidak ditemukan di Master Asatidz`);
          }

          // Match proctor 2 (if provided)
          let proctor2Teacher = undefined;
          if (p2) {
            proctor2Teacher = teacherByNip.get(p2.toLowerCase()) || teacherByName.get(p2.toLowerCase());
            if (!proctor2Teacher) {
              proctor2Teacher = teachers.find(t => 
                t.name.toLowerCase().includes(p2.toLowerCase()) || 
                p2.toLowerCase().includes(t.name.toLowerCase()) ||
                t.nip.toLowerCase().includes(p2.toLowerCase())
              );
            }
            if (!proctor2Teacher) {
              errors.push(`Pengawas 2 ("${p2}") tidak ditemukan di Master Asatidz`);
            }
          }

          rows.push({
            rowNum,
            date,
            dayOfWeek,
            sessionName,
            startTime,
            endTime,
            durationMinutes,
            subject,
            targetClass,
            roomName,
            proctor1Identifier: p1,
            proctor1TeacherId: proctor1Teacher?.id,
            proctor1Name: proctor1Teacher?.name,
            proctor2Identifier: p2 || undefined,
            proctor2TeacherId: proctor2Teacher?.id,
            proctor2Name: proctor2Teacher?.name,
            customRate,
            isValid: errors.length === 0,
            errors
          });
        });

        setParsedRows(rows);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(`Gagal membaca file: ${err.message || 'Format tidak valid'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('Tidak ada data yang valid untuk diunggah.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let eventId = targetEventId;
      if (isCreatingEvent || !eventId) {
        const createdEvent = await createExamEvent({
          title: newEventTitle || 'UTS Semester Ganjil 2026/2027',
          type: 'UTS',
          unit: newEventUnit,
          startDate: validRows[0]?.date || new Date().toISOString().slice(0, 10),
          endDate: validRows[validRows.length - 1]?.date || new Date().toISOString().slice(0, 10),
          status: 'ACTIVE'
        });
        if (!createdEvent) {
          throw new Error('Gagal membuat event ujian baru.');
        }
        eventId = createdEvent.id;
      }

      // Map rows to API payload
      const payloadSessions = validRows.map(r => ({
        date: r.date,
        dayOfWeek: r.dayOfWeek,
        sessionName: r.sessionName,
        startTime: r.startTime,
        endTime: r.endTime,
        durationMinutes: r.durationMinutes,
        subject: r.subject,
        targetClass: r.targetClass,
        roomName: r.roomName,
        customRate: r.customRate,
        proctorTeacherIds: [r.proctor1TeacherId, r.proctor2TeacherId].filter(Boolean) as string[]
      }));

      const res = await addExamSessionsBulk(eventId, payloadSessions);
      if (res.success) {
        setSuccessResult({
          sessionsCount: res.sessionsCount,
          proctorsCount: res.proctorsCount
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengunggah jadwal ujian.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0B2B26] border border-slate-200 dark:border-[#163832] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#163832] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Unggah Massal Jadwal Ujian (UTS / UAS)
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">
                  {defaultUnit}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-400/70">
                Impor sesi ujian dan penugasan pengawas asatidz melalui Excel atau CSV.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#163832]/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Target Event Selection */}
          <div className="bg-slate-50 dark:bg-[#051F20]/50 border border-slate-200 dark:border-[#163832] p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Event Ujian Target
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingEvent(!isCreatingEvent)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                {isCreatingEvent ? '← Pilih Event Yang Sudah Ada' : '+ Buat Event Ujian Baru'}
              </button>
            </div>

            {isCreatingEvent ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-emerald-400/80 mb-1 block">Judul Event Ujian</label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="misal: UTS Pesantren Semester Ganjil 2026/2027"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-emerald-400/80 mb-1 block">Unit Sekolah</label>
                  <select
                    value={newEventUnit}
                    onChange={(e) => setNewEventUnit(e.target.value as UnitType)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PESANTREN">Unit Pesantren</option>
                    <option value="SMP">Unit SMP</option>
                    <option value="MA">Unit MA</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={targetEventId}
                  onChange={(e) => setTargetEventId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {examEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.unit}) - {ev.startDate} s/d {ev.endDate} [{ev.status}]
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Download Template Banner */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                Gunakan template resmi untuk mencegah error nama pengawas dan waktu sesi.
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Template Excel
            </button>
          </div>

          {/* Drag & Drop Upload Box */}
          {!successResult && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-slate-300 dark:border-[#163832] hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#051F20]/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 mx-auto mb-2 text-slate-400 group-hover:text-emerald-500" />
              <p className="text-xs font-bold text-slate-700 dark:text-emerald-100">
                {fileName ? fileName : 'Klik untuk memilih file atau seret file ke sini'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-emerald-400/60 mt-0.5">
                Mendukung file format .xlsx, .xls, atau .csv
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                Jadwal Ujian Berhasil Diunggah!
              </h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {successResult.sessionsCount} Sesi Ujian dan {successResult.proctorsCount} Penugasan Pengawas telah aktif. Asatidz dapat langsung melihat jadwal dan melakukan presensi.
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Tutup & Lihat Jadwal
              </button>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && !successResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-emerald-100">
                  Pratinjau Data ({parsedRows.length} Baris Sesi)
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                    ✓ {validCount} Siap Impor
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-semibold">
                      ✕ {invalidCount} Perlu Perbaikan
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#163832] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-[#051F20] text-slate-600 dark:text-emerald-300 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Baris</th>
                      <th className="px-3 py-2">Tanggal / Waktu</th>
                      <th className="px-3 py-2">Mata Pelajaran</th>
                      <th className="px-3 py-2">Kelas / Ruang</th>
                      <th className="px-3 py-2">Pengawas 1</th>
                      <th className="px-3 py-2">Pengawas 2</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#163832]">
                    {parsedRows.map((r, i) => (
                      <tr 
                        key={i} 
                        className={r.isValid ? 'hover:bg-slate-50 dark:hover:bg-[#163832]/30' : 'bg-rose-500/5 hover:bg-rose-500/10'}
                      >
                        <td className="px-3 py-2 font-mono text-slate-400">{r.rowNum}</td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-800 dark:text-emerald-100">{r.date}</div>
                          <div className="text-[10px] text-slate-500 dark:text-emerald-400/70">{r.startTime} - {r.endTime}</div>
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{r.subject}</td>
                        <td className="px-3 py-2">
                          <div>{r.targetClass}</div>
                          <div className="text-[10px] text-slate-400">{r.roomName}</div>
                        </td>
                        <td className="px-3 py-2">
                          {r.proctor1TeacherId ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {r.proctor1Name}</span>
                          ) : (
                            <span className="text-rose-600 font-medium">✕ {r.proctor1Identifier || 'Kosong'}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {r.proctor2Identifier ? (
                            r.proctor2TeacherId ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {r.proctor2Name}</span>
                            ) : (
                              <span className="text-rose-600 font-medium">✕ {r.proctor2Identifier}</span>
                            )
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold">Valid</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-semibold" title={r.errors.join(', ')}>
                              Error ({r.errors.length})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-[#163832] flex items-center justify-between bg-slate-50 dark:bg-[#051F20]/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-[#163832] rounded-xl text-xs font-semibold text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-[#163832]/60 cursor-pointer"
          >
            Batal
          </button>

          {!successResult && (
            <button
              type="button"
              disabled={validCount === 0 || isProcessing}
              onClick={handleSubmit}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                validCount > 0 && !isProcessing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20 cursor-pointer'
                  : 'bg-slate-200 dark:bg-[#163832] text-slate-400 cursor-not-allowed'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              {isProcessing ? 'Mengunggah...' : `Impor ${validCount} Sesi Ujian`}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

