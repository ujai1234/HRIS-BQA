import React, { useEffect, useState } from 'react';
import { X, Printer, Download, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';
import { TeacherPayrollItem } from '../types';
import { formatRupiah, printSalarySlipDocument, terbilang } from '../utils/formatters';

interface SalarySlipModalProps {
  payroll: TeacherPayrollItem;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({ payroll, onClose }) => {
  const { teacher } = payroll;
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownloadPDF = () => {
    printSalarySlipDocument({
      teacherName: teacher.name,
      nip: teacher.nip || 'BQA-008',
      unit: teacher.unit,
      position: teacher.position,
      bankName: teacher.bankName,
      accountNumber: teacher.accountNumber,
      period: payroll.period,
      isPrivacyMode: isPrivacyMode,
      baseSalary: payroll.baseSalary,
      totalTaughtHours: payroll.totalTaughtHours,
      hourlyRate: teacher.hourlyRate || 40000,
      teachingHonorarium: payroll.teachingHonorarium,
      totalPresentDays: payroll.totalPresentDays,
      dailyTransportRate: teacher.dailyTransportRate || 10000,
      totalTransport: payroll.totalTransport,
      totalBadalHours: payroll.totalBadalHours,
      badalHonorarium: payroll.badalHonorarium,
      latePenaltyTotal: payroll.latePenaltyTotal,
      emptyJournalPenalty: payroll.emptyJournalPenalty,
      alphaPenalty: payroll.alphaPenalty,
      otherDeductions: payroll.otherDeductions,
      totalDeductions: payroll.totalDeductions,
      netSalary: payroll.netSalary,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const mask = (val: string) => (isPrivacyMode ? '••••••••' : val);
  const maskNumber = (num: number) => (isPrivacyMode ? '••••••••' : formatRupiah(num));

  const currentDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const docSlipId = `SLP-${payroll.period.replace(/\s+/g, '-').toUpperCase()}-${(teacher.nip || teacher.id).replace(/[^A-Za-z0-9]/g, '')}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200 dark:border-stone-800 my-auto print:border-none print:shadow-none print:m-0 print:max-w-none animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh] print:max-h-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Printable CSS Hook */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-salary-slip, #printable-salary-slip * {
              visibility: visible !important;
            }
            #printable-salary-slip {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 1.2cm !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
          }
        ` }} />

        {/* Modal Header & Actions Bar */}
        <div className="px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 bg-stone-900 text-white shrink-0 no-print">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
              BQA
            </div>
            <div>
              <h3 className="font-semibold text-xs text-stone-100 leading-tight">
                Preview Dokumen Slip Gaji
              </h3>
              <p className="text-[11px] text-stone-400">
                Periode {payroll.period} • {teacher.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Privacy Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                isPrivacyMode
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
              }`}
              title={isPrivacyMode ? 'Tampilkan Angka Gaji' : 'Sembunyikan Angka Gaji (Mode Privasi)'}
            >
              {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{isPrivacyMode ? 'Privasi Aktif' : 'Privasi'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Container (Scrollable) */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 bg-stone-100 dark:bg-stone-950/60 print:p-0 print:bg-white flex justify-center">
          <div
            id="printable-salary-slip"
            className="w-full max-w-xl bg-white text-stone-900 rounded-lg p-5 sm:p-7 shadow-md border border-stone-200/90 print:border-none print:shadow-none print:p-0 text-xs space-y-4"
          >
            {/* 1. Official Letterhead / Kop Surat (Clean spacing, strictly no overlap) */}
            <div className="border-b-2 border-stone-900 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 text-center space-y-0.5 min-w-0">
                  <p className="text-[9px] font-bold text-[#B08968] uppercase tracking-wider">
                    YAYASAN BAITUL QUR'AN AL-IKHWAN
                  </p>
                  <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-stone-950 uppercase leading-snug">
                    PONDOK PESANTREN BAITUL QUR'AN AL-IKHWAN
                  </h1>
                  <p className="text-[10px] text-stone-600 font-medium leading-tight">
                    Jl. Sungai Kendal No.21, RT.8/RW.5, Marunda, Cilincing, Jakarta Utara 14150
                  </p>
                  <p className="text-[9px] text-stone-400 font-mono leading-tight">
                    Hotline: 0858-8302-2643 • Email: sekretariat@bqa.sch.id • NSPP: 510032
                  </p>
                </div>
              </div>

              <div className="mt-2.5 border-t border-[#B08968]/40" />
            </div>

            {/* 2. Slip Title & Subtitle */}
            <div className="text-center pt-0.5">
              <h2 className="text-xs sm:text-sm font-bold text-stone-900 tracking-wide uppercase">
                TANDA BUKTI PENERIMAAN KAFA'AH ASATIDZ
              </h2>
              <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                Periode: <strong>{payroll.period}</strong> • Unit: <strong>{teacher.unit}</strong>
              </p>
            </div>

            {/* 3. Teacher Biodata Box (Clean Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-stone-50/80 p-3 rounded-lg border border-stone-200 text-stone-800 text-[11px]">
              <div>
                <span className="text-[10px] text-stone-400 block font-medium">Nama Asatidz</span>
                <p className="font-semibold text-stone-950 mt-0.5">{teacher.name}</p>
                <p className="text-[10px] text-stone-500 font-mono">NIP: {teacher.nip || 'BQA-008'}</p>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 block font-medium">Unit & Jabatan</span>
                <p className="font-medium text-stone-800 mt-0.5">{teacher.unit}</p>
                <p className="text-[10px] text-stone-500">{teacher.position}</p>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 block font-medium">Beban & Kehadiran</span>
                <p className="font-semibold text-stone-900 mt-0.5 font-mono">{payroll.totalTaughtHours} JP</p>
                <p className="text-[10px] text-stone-500 font-mono">{payroll.totalPresentDays} Hari Hadir</p>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 block font-medium">Rekening Penyaluran</span>
                <p className="font-medium text-stone-800 mt-0.5">{teacher.bankName || 'BSI'}</p>
                <p className="text-[10px] text-stone-500 font-mono">{teacher.accountNumber || '7123-4567-89'}</p>
              </div>
            </div>

            {/* 4. Two-Column Ledger: Pendapatan vs Potongan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Left Column: Pendapatan */}
              <div className="space-y-1.5 border border-stone-200 rounded-lg p-3 bg-white">
                <div className="pb-1.5 border-b border-stone-200 font-semibold text-[#1B4332] flex justify-between text-xs">
                  <span>A. Pendapatan (Hak)</span>
                  <span>Jumlah</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 text-stone-700">
                  <span>1. Gaji Pokok</span>
                  <span className="font-mono font-medium text-stone-900">{maskNumber(payroll.baseSalary)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 text-stone-700">
                  <div>
                    <span>2. Honor Mengajar</span>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      {payroll.totalTaughtHours} JP × {formatRupiah(teacher.hourlyRate || 40000)}
                    </span>
                  </div>
                  <span className="font-mono font-medium text-stone-900">{maskNumber(payroll.teachingHonorarium)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 text-stone-700">
                  <div>
                    <span>3. Uang Transport</span>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      {payroll.totalPresentDays} Hari × {formatRupiah(teacher.dailyTransportRate || 10000)}
                    </span>
                  </div>
                  <span className="font-mono font-medium text-stone-900">{maskNumber(payroll.totalTransport)}</span>
                </div>

                {payroll.totalBadalHours > 0 && (
                  <div className="flex justify-between py-1 border-b border-stone-100 text-stone-700">
                    <div>
                      <span>4. Honor Badal (Pengganti)</span>
                      <span className="text-[10px] text-stone-400 block font-mono">{payroll.totalBadalHours} JP Badal</span>
                    </div>
                    <span className="font-mono font-medium text-stone-900">{maskNumber(payroll.badalHonorarium)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 font-bold text-stone-950 text-xs border-t border-stone-200">
                  <span>Total Pendapatan (Gross)</span>
                  <span className="font-mono text-[#1B4332]">
                    {maskNumber(
                      payroll.baseSalary +
                        payroll.teachingHonorarium +
                        payroll.totalTransport +
                        (payroll.badalHonorarium || 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Right Column: Potongan */}
              <div className="space-y-1.5 border border-stone-200 rounded-lg p-3 bg-white">
                <div className="pb-1.5 border-b border-stone-200 font-semibold text-rose-700 flex justify-between text-xs">
                  <span>B. Potongan SOP & Disiplin</span>
                  <span>Jumlah</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 text-stone-700">
                  <div>
                    <span>1. Denda Keterlambatan</span>
                    <span className="text-[10px] text-stone-400 block">Sesuai SOP keterlambatan</span>
                  </div>
                  <span className="font-mono text-rose-700 font-medium">
                    {payroll.latePenaltyTotal > 0 ? mask(`-${formatRupiah(payroll.latePenaltyTotal)}`) : mask('Rp 0')}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 text-stone-700">
                  <div>
                    <span>2. Penalti Jurnal Belum Diisi</span>
                    <span className="text-[10px] text-stone-400 block font-mono">{payroll.emptyJournalCount || 0} sesi pending</span>
                  </div>
                  <span className="font-mono text-rose-700 font-medium">
                    {payroll.emptyJournalPenalty > 0 ? mask(`-${formatRupiah(payroll.emptyJournalPenalty)}`) : mask('Rp 0')}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 text-stone-700">
                  <span>3. Potongan Alpa / Izin</span>
                  <span className="font-mono text-stone-500">
                    {payroll.alphaPenalty > 0 ? mask(`-${formatRupiah(payroll.alphaPenalty)}`) : mask('Rp 0')}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 text-stone-700">
                  <span>4. Potongan Lain-lain</span>
                  <span className="font-mono text-stone-500">
                    {payroll.otherDeductions > 0 ? mask(`-${formatRupiah(payroll.otherDeductions)}`) : mask('Rp 0')}
                  </span>
                </div>

                <div className="flex justify-between pt-2 font-bold text-rose-700 text-xs border-t border-stone-200">
                  <span>Total Potongan</span>
                  <span className="font-mono">
                    {payroll.totalDeductions > 0 ? mask(`-${formatRupiah(payroll.totalDeductions)}`) : mask('Rp 0')}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Take Home Pay Banner */}
            <div className="p-3.5 sm:p-4 bg-[#1B4332] text-white rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
              <div>
                <span className="text-[10px] text-[#D4A373] uppercase font-bold tracking-wider block">
                  TOTAL KAFA'AH DITERIMA (TAKE HOME PAY)
                </span>
                <p className="text-[11px] text-stone-200 italic mt-0.5 font-serif">
                  {isPrivacyMode ? 'Nominal Dirahasiakan' : `Terbilang: "${terbilang(payroll.netSalary)}"`}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-lg sm:text-2xl font-bold font-mono text-white tracking-tight">
                  {mask(formatRupiah(payroll.netSalary))}
                </span>
              </div>
            </div>

            {/* 6. Signature & Digital Verification Block */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200 text-center text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 block">Diverifikasi oleh,</span>
                <p className="font-semibold text-stone-900 text-[11px]">Bendahara HRD Pesantren</p>
                
                <div className="py-2 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>VERIFIED & TRANSFERRED</span>
                  </div>
                </div>

                <p className="font-bold text-stone-900 text-[11px]">Ust. Ahmad Syahid, M.Pd.</p>
                <p className="text-[10px] text-stone-400 font-mono">NIP: BQA-2021-003</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 block">Penerima Kafa'ah,</span>
                <p className="font-semibold text-stone-900 text-[11px]">Asatidz yang bersangkutan</p>
                
                <div className="py-2 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-50 text-stone-600 border border-stone-200 rounded text-[9px] italic">
                    <CheckCircle2 className="w-3 h-3 text-stone-400" />
                    <span>[ Ttd Digital ]</span>
                  </div>
                </div>

                <p className="font-bold text-stone-900 text-[11px]">{teacher.name}</p>
                <p className="text-[10px] text-stone-400 font-mono">NIP: {teacher.nip || 'BQA-008'}</p>
              </div>
            </div>

            {/* 7. Footer Bottom Verification Footnote */}
            <div className="pt-2 border-t border-stone-150 flex flex-col sm:flex-row items-center justify-between text-[9px] text-stone-400 gap-1">
              <span>✓ Dokumen Digital Sah HRIS Pesantren Baitul Qur'an Al-Ikhwan • Dicetak {currentDate}</span>
              <span className="font-mono">Sistem Terenkripsi • {docSlipId}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-3 sm:px-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between shrink-0 no-print">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Tekan <kbd className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 rounded font-mono text-[10px]">Esc</kbd> untuk menutup
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF Resmi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

