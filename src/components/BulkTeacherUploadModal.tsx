import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  HelpCircle,
  Users,
  ArrowRight,
  Info
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { Teacher, UnitType, UserRole } from '../types';
import { formatRupiah } from '../utils/formatters';

interface BulkTeacherUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedTeacherRow {
  rowNum: number;
  nip: string;
  name: string;
  position: string;
  unit: UnitType;
  baseSalary: number;
  hourlyRate: number;
  dailyTransport: number;
  role: UserRole;
  phone: string;
  username?: string;
  password?: string;
  isValid: boolean;
  errors: string[];
}

export const BulkTeacherUploadModal: React.FC<BulkTeacherUploadModalProps> = ({ isOpen, onClose }) => {
  const { addTeachersBulk } = useHRIS();

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTeacherRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Download standard CSV template
  const handleDownloadTemplate = () => {
    const headers = [
      'NIP',
      'Nama Lengkap',
      'Email / Akun Login',
      'Jabatan',
      'Unit',
      'Gaji Pokok',
      'Kafaah per Jam',
      'Uang Transport per Hari',
      'Role',
      'Nomor HP WA',
      'Password'
    ];

    const sampleRows = [
      [
        'PBQ-2026-030',
        'Ust. Ahmad Fathoni, M.Pd.',
        'ahmad.fathoni@gmail.com',
        'Guru Bahasa Arab & Tahfidz',
        'SMP',
        '850000',
        '40000',
        '10000',
        'GURU',
        '081234567890',
        'guru1234'
      ],
      [
        'PBQ-2026-031',
        'Usth. Siti Khodijah, S.Pd.I.',
        'siti.khodijah@gmail.com',
        'Guru Fiqih & Akhlaq',
        'MA',
        '800000',
        '40000',
        '10000',
        'GURU',
        '082198765432',
        'guru1234'
      ],
      [
        'PBQ-2026-032',
        'Ust. Muhammad Ridwan',
        'ridwan.musyrif@gmail.com',
        'Musyrif Asrama & Al-Qur\'an',
        'PESANTREN',
        '950000',
        '40000',
        '15000',
        'GURU',
        '085612345678',
        'guru1234'
      ]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Template_Unggah_Guru_Tahun_Ajaran_Baru.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV Line Parser that handles quotes and commas/semicolons
  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++; // skip escaped quote
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

        // Split into lines
        const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) {
          setErrorMessage('Berkas tidak memuat data guru selain baris judul/header.');
          return;
        }

        // Detect delimiter (comma or semicolon)
        const headerLine = lines[0];
        const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';

        // Parse header row dynamically
        const headerCols = parseCSVLine(headerLine, delimiter).map(c => c.trim().toLowerCase());

        const findColIdx = (pattern: RegExp, fallback: number): number => {
          const idx = headerCols.findIndex(c => pattern.test(c));
          return idx !== -1 ? idx : fallback;
        };

        const nipIdx = findColIdx(/^nip/i, 0);
        const nameIdx = findColIdx(/nama/i, 1);
        const usernameIdx = findColIdx(/email|surel|username|akun|login/i, 2);
        const positionIdx = findColIdx(/jabatan|posisi/i, 3);
        const unitIdx = findColIdx(/unit|jenjang/i, 4);
        const baseSalaryIdx = findColIdx(/gaji/i, 5);
        const hourlyRateIdx = findColIdx(/kafa.*ah|honor|tarif|jam/i, 6);
        const dailyTransportIdx = findColIdx(/transport/i, 7);
        const roleIdx = findColIdx(/role|peran|hak.*akses/i, 8);
        const phoneIdx = findColIdx(/hp|telepon|wa|phone/i, 9);
        const passwordIdx = findColIdx(/pass|sandi/i, 10);

        const parsedData: ParsedTeacherRow[] = [];

        // Parse each row starting from row 1 (skip header)
        for (let i = 1; i < lines.length; i++) {
          const rawCols = parseCSVLine(lines[i], delimiter);
          if (rawCols.length === 0 || rawCols.every(c => c === '')) continue;

          const rowNum = i + 1;
          const errors: string[] = [];

          const rawNip = (rawCols[nipIdx] || '').trim() || `PBQ-2026-${String(Date.now()).slice(-4)}`;
          const rawName = (rawCols[nameIdx] || '').trim();
          const rawPosition = (rawCols[positionIdx] || '').trim() || 'Guru Pesantren';
          let rawUnit = (rawCols[unitIdx] || 'PESANTREN').toUpperCase().trim();
          
          // Clean & Parse Numbers
          const parseNum = (val: string | undefined, defaultVal: number) => {
            if (!val) return defaultVal;
            const cleaned = val.replace(/[^0-9]/g, '');
            const parsed = parseInt(cleaned, 10);
            return isNaN(parsed) ? defaultVal : parsed;
          };

          const baseSalary = parseNum(rawCols[baseSalaryIdx], 700000);
          const hourlyRate = parseNum(rawCols[hourlyRateIdx], 40000);
          const dailyTransport = parseNum(rawCols[dailyTransportIdx], 10000);

          let rawRole = (rawCols[roleIdx] || 'GURU').toUpperCase().trim();
          const rawPhone = (rawCols[phoneIdx] || '').trim();
          let rawUsername = (rawCols[usernameIdx] || '').trim().toLowerCase();
          let rawPassword = (rawCols[passwordIdx] || '').trim();

          // Validations
          if (!rawName) {
            errors.push('Nama guru wajib diisi');
          }

          const validUnits: UnitType[] = ['SMP', 'MA', 'PESANTREN', 'UMUM'];
          if (!validUnits.includes(rawUnit as UnitType)) {
            if (rawUnit.includes('&') || rawUnit.includes('/') || rawUnit.includes('SEMUA') || rawUnit.includes('GABUNGAN') || rawUnit.includes('UMUM')) {
              rawUnit = 'UMUM';
            } else if (rawUnit.includes('SMP') || rawUnit.includes('TSANAWIYAH')) {
              rawUnit = 'SMP';
            } else if (rawUnit.includes('MA') || rawUnit.includes('ALIYAH')) {
              rawUnit = 'MA';
            } else if (rawUnit.includes('PONPES') || rawUnit.includes('SANTRI') || rawUnit.includes('PESANTREN')) {
              rawUnit = 'PESANTREN';
            } else {
              rawUnit = 'UMUM';
            }
          }

          const validRoles: UserRole[] = [
            'ADMIN',
            'GURU',
            'KEPALA_SMP',
            'KEPALA_MA',
            'KEPALA_PESANTREN',
            'STAFF',
            'KEUANGAN'
          ];
          if (!validRoles.includes(rawRole as UserRole)) {
            if (rawRole.includes('ADMIN')) rawRole = 'ADMIN';
            else if (rawRole.includes('BENDAHARA') || rawRole.includes('KEUANGAN')) rawRole = 'KEUANGAN';
            else if (rawRole.includes('SMP')) rawRole = 'KEPALA_SMP';
            else if (rawRole.includes('MA') || rawRole.includes('ALIYAH')) rawRole = 'KEPALA_MA';
            else if (rawRole.includes('KEP') || rawRole.includes('MUDIR') || rawRole.includes('PESANTREN')) rawRole = 'KEPALA_PESANTREN';
            else if (rawRole.includes('STAF') || rawRole.includes('STAFF')) rawRole = 'STAFF';
            else rawRole = 'GURU';
          }

          // Otomatis username jika kosong
          if (!rawUsername) {
            rawUsername = rawNip.toLowerCase();
          }

          // Otomatis password jika kosong atau kurang dari 6 karakter
          if (!rawPassword || rawPassword.length < 6) {
            if (rawRole === 'ADMIN') rawPassword = 'admin123';
            else if (rawRole === 'KEUANGAN') rawPassword = 'keuangan123';
            else if (rawRole === 'STAFF') rawPassword = 'staff123';
            else if (rawRole.startsWith('KEPALA')) rawPassword = 'kepsek123';
            else rawPassword = 'guru1234';
          }

          parsedData.push({
            rowNum,
            nip: rawNip,
            name: rawName,
            position: rawPosition,
            unit: rawUnit as UnitType,
            baseSalary,
            hourlyRate,
            dailyTransport,
            role: rawRole as UserRole,
            phone: rawPhone,
            username: rawUsername || undefined,
            password: rawPassword,
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const payload: Omit<Teacher, 'id'>[] = validRows.map(r => ({
        nip: r.nip,
        name: r.name,
        position: r.position,
        unit: r.unit,
        baseSalary: r.baseSalary,
        hourlyRate: r.hourlyRate,
        dailyTransport: r.dailyTransport,
        role: r.role,
        phone: r.phone,
        username: r.username,
        password: r.password,
        avatarColor: 'bg-emerald-700',
        isActive: true,
      }));

      await addTeachersBulk(payload);
      setSuccessCount(validRows.length);
      setTimeout(() => {
        onClose();
        // Reset state after close
        setParsedRows([]);
        setFileName(null);
        setSuccessCount(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to import teachers:', err);
      setErrorMessage('Terjadi kesalahan saat menyimpan data ke database. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Unggah Data Guru Massal
              </h3>
              <p className="text-xs text-slate-500">
                Import berkas spreadsheet asatidz baru untuk tahun ajaran baru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Template Download Card */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">Format Template Spreadsheet</h4>
                <p className="text-xs text-emerald-800/90 mt-0.5">
                  Cukup daftarkan 1 baris per guru (1 NIP = 1 Akun). Jika mengajar lintas unit (SMP, MA, Pesantren), pilih unit utama atau 'UMUM'. Pembagian jam kelasnya diatur terpisah pada menu Upload Jadwal.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-1.5 bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
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
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/70'
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
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Klik untuk memilih berkas atau seret berkas ke sini
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Mendukung format CSV (.csv) atau Teks (.txt)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info & Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-semibold text-slate-800 font-mono truncate max-w-xs">
                    {fileName}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {validCount} Siap Impor
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {invalidCount} Perlu Dicek
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFileName(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 underline font-medium text-xs ml-2 cursor-pointer"
                  >
                    Ganti Berkas
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">Baris</th>
                      <th className="py-2 px-3">NIP</th>
                      <th className="py-2 px-3">Nama Asatidz</th>
                      <th className="py-2 px-3">Akun Login (Email/User)</th>
                      <th className="py-2 px-3">Password</th>
                      <th className="py-2 px-3">Unit & Role</th>
                      <th className="py-2 px-3 text-right">Gaji Pokok</th>
                      <th className="py-2 px-3 text-right">Kafa'ah/JP</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRows.map((row) => (
                      <tr key={row.rowNum} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          {row.rowNum}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-800">
                          {row.nip}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {row.name || <span className="text-rose-500 italic">Kosong</span>}
                        </td>
                        <td className="py-2 px-3 font-mono text-emerald-800 text-[11px]">
                          {row.username || row.nip.toLowerCase()}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                          {row.password}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-800">{row.unit}</span> - <span className="text-slate-500">{row.role}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatRupiah(row.baseSalary)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-800">
                          {formatRupiah(row.hourlyRate)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200" title={row.errors.join(', ')}>
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

          {/* Feedback messages */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Alhamdulillah! Berhasil mengimpor {successCount} data guru baru ke sistem.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
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
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                {isProcessing ? (
                  <span>Menyimpan ke Database...</span>
                ) : successCount !== null ? (
                  <span>Selesai!</span>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Konfirmasi Impor ({validCount} Guru)</span>
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
