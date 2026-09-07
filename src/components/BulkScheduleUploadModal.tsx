import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Info,
  Calendar
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule, UnitType, DayOfWeek } from '../types';

interface BulkScheduleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedScheduleRow {
  rowNum: number;
  nip: string; // Used to find teacherId
  teacherName?: string;
  teacherId?: string;
  subject: string;
  className: string;
  unit: UnitType;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  hours: number;
  room: string;
  isValid: boolean;
  errors: string[];
}

export const BulkScheduleUploadModal: React.FC<BulkScheduleUploadModalProps> = ({ isOpen, onClose }) => {
  const { teachers, addSchedulesBulk } = useHRIS();

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedScheduleRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Download standard CSV template for schedules
  const handleDownloadTemplate = () => {
    const headers = [
      'NIP Guru',
      'Mata Pelajaran',
      'Kelas',
      'Unit',
      'Hari',
      'Jam Mulai (HH:mm)',
      'Jam Selesai (HH:mm)',
      'Jumlah JP',
      'Ruangan'
    ];

    const sampleRows = [
      [
        'PBQ-2026-001',
        'Bahasa Arab',
        'VII-A (SMP)',
        'SMP',
        'Senin',
        '07:30',
        '08:50',
        '2',
        'Kelas 7A'
      ],
      [
        'PBQ-2026-002',
        'Tahfidz',
        'VIII-B (SMP)',
        'SMP',
        'Selasa',
        '09:10',
        '10:30',
        '2',
        'Masjid Utama'
      ]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Template_Unggah_Jadwal_Pelajaran.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    setSuccessCount(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setErrorMessage('Berkas kosong atau tidak dapat dibaca.');
          return;
        }

        const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) {
          setErrorMessage('Berkas tidak memuat data jadwal selain baris judul/header.');
          return;
        }

        const headerLine = lines[0];
        const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';

        const parsedData: ParsedScheduleRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const rawCols = parseCSVLine(lines[i], delimiter);
          if (rawCols.length === 0 || rawCols.every(c => c === '')) continue;

          const rowNum = i + 1;
          const errors: string[] = [];

          const rawNip = rawCols[0] || '';
          const rawSubject = rawCols[1] || '';
          const rawClassName = rawCols[2] || '';
          let rawUnit = (rawCols[3] || 'SMP').toUpperCase().trim();
          let rawDay = rawCols[4] || 'Senin';
          const rawStart = rawCols[5] || '07:30';
          const rawEnd = rawCols[6] || '08:50';
          const rawHours = parseInt(rawCols[7] || '2', 10);
          const rawRoom = rawCols[8] || '-';

          // Validations
          if (!rawNip) errors.push('NIP Guru wajib diisi');
          if (!rawSubject) errors.push('Mata pelajaran wajib diisi');
          if (!rawDay) errors.push('Hari wajib diisi');

          // Find teacher by NIP
          const teacher = teachers.find(t => t.nip === rawNip);
          if (rawNip && !teacher) {
            errors.push(`Guru dengan NIP ${rawNip} tidak ditemukan`);
          }

          const validUnits: UnitType[] = ['SMP', 'MA', 'PESANTREN', 'UMUM'];
          if (!validUnits.includes(rawUnit as UnitType)) {
             if (rawUnit.includes('SMP')) rawUnit = 'SMP';
             else if (rawUnit.includes('MA')) rawUnit = 'MA';
             else rawUnit = 'SMP';
          }

          const validDays: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
          if (!validDays.includes(rawDay as DayOfWeek)) {
            if (rawDay === 'Minggu') rawDay = 'Ahad';
            else rawDay = 'Senin';
          }

          parsedData.push({
            rowNum,
            nip: rawNip,
            teacherName: teacher?.name,
            teacherId: teacher?.id,
            subject: rawSubject,
            className: rawClassName,
            unit: rawUnit as UnitType,
            dayOfWeek: rawDay as DayOfWeek,
            startTime: rawStart,
            endTime: rawEnd,
            hours: isNaN(rawHours) ? 2 : rawHours,
            room: rawRoom,
            isValid: errors.length === 0,
            errors
          });
        }

        if (parsedData.length === 0) {
          setErrorMessage('Tidak ditemukan baris data yang valid dalam berkas.');
        } else {
          setParsedRows(parsedData);
        }
      } catch (err) {
        console.error('Error parsing file:', err);
        setErrorMessage('Format berkas tidak valid atau rusak. Gunakan berkas CSV sesuai template.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid && r.teacherId);
    if (validRows.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const payload: Omit<ClassSchedule, 'id'>[] = validRows.map(r => ({
        teacherId: r.teacherId!,
        subject: r.subject,
        className: r.className,
        unit: r.unit,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        hours: r.hours,
        room: r.room
      }));

      await addSchedulesBulk(payload);
      setSuccessCount(validRows.length);
      setTimeout(() => {
        onClose();
        setParsedRows([]);
        setFileName(null);
        setSuccessCount(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to import schedules:', err);
      setErrorMessage('Terjadi kesalahan saat menyimpan data ke database. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-100 dark:bg-emerald-950/50 p-2 rounded-xl text-emerald-800 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Unggah Jadwal Pelajaran Massal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Import berkas spreadsheet jadwal KBM dari Excel/CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Template Download Card */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-100">Format Template Jadwal</h4>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-400/90 mt-0.5">
                  Gunakan NIP Guru yang sudah terdaftar di sistem agar jadwal terhubung secara otomatis.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-emerald-300 dark:border-emerald-800 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template</span>
            </button>
          </div>

          {/* Upload Drop Area */}
          {parsedRows.length === 0 ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Klik untuk memilih berkas atau seret berkas ke sini
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Pastikan format jam menggunakan HH:mm (contoh: 07:30)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info & Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono truncate max-w-xs">
                    {fileName}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {validCount} Siap Impor
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {invalidCount} Perlu Dicek
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFileName(null);
                    }}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium text-xs ml-2 cursor-pointer"
                  >
                    Ganti Berkas
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">Baris</th>
                      <th className="py-2 px-3">Guru</th>
                      <th className="py-2 px-3">Mapel</th>
                      <th className="py-2 px-3">Kelas & Unit</th>
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-400">
                    {parsedRows.map((row) => (
                      <tr key={row.rowNum} className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/30' : 'bg-rose-50/50 dark:bg-rose-950/20'}>
                        <td className="py-2 px-3 text-center text-slate-400 dark:text-slate-500 font-mono">
                          {row.rowNum}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-200">{row.teacherName || 'Tidak Ditemukan'}</div>
                          <div className="text-[10px] font-mono text-slate-500">{row.nip}</div>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-300">
                          {row.subject}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold">{row.className}</span> ({row.unit})
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-medium">{row.dayOfWeek}</div>
                          <div className="text-[10px] text-slate-500">{row.startTime} - {row.endTime} ({row.hours} JP)</div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800" title={row.errors.join(', ')}>
                              <AlertCircle className="w-3 h-3" /> Error
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

          {errorMessage && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Berhasil mengimpor {successCount} jadwal pelajaran baru.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isProcessing || validCount === 0 || successCount !== null}
                className={`inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                  validCount > 0 && !isProcessing && successCount === null
                    ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20'
                    : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500 dark:text-slate-400'
                }`}
              >
                {isProcessing ? (
                  <span>Menyimpan Jadwal...</span>
                ) : successCount !== null ? (
                  <span>Selesai!</span>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Konfirmasi Impor ({validCount} Jadwal)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
