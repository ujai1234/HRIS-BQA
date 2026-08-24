import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  CreditCard,
  CheckCircle2,
  FileText,
  Check
} from 'lucide-react';
import { TeacherPayrollItem } from '../types';
import { formatRupiah, terbilang } from '../utils/formatters';

interface SalarySlipModalProps {
  payroll: TeacherPayrollItem;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({ payroll, onClose }) => {
  const { teacher } = payroll;
  const [showSignatures, setShowSignatures] = useState(true);

  // Listen to Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-auto print:border-none print:shadow-none print:m-0 print:max-w-none animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-xs text-slate-100">Slip Gaji Karyawan / Asatidz</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSignatures(!showSignatures)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                showSignatures 
                  ? 'bg-emerald-600/10 border-emerald-600 text-emerald-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {showSignatures ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
              <span>Tanda Tangan</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Minimalist Corporate Payslip Document */}
        <div id="salary-slip-document" className="p-6 sm:p-8 space-y-5 text-slate-800 dark:text-slate-900 bg-white dark:bg-white font-sans">
          {/* Corporate Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-900 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-lg shadow-slate-200">
                BQA
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest leading-none mb-1">Yayasan Al-Ikhwan Mandiri Sejahtera</p>
                <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-tight uppercase">
                  PONDOK PESANTREN BAITUL QUR'AN AL-IKHWAN
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">
                  Jl. Sungai Kendal No.21, RT.8/RW.5, Marunda, Cilincing, Jakarta Utara 14150
                </p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                  Hotline: 0858-8302-2643 / 0812-8294-9922
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
              <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-slate-900 text-white rounded mb-1">
                SLIP GAJI KARYAWAN
              </span>
              <p className="text-xs font-mono text-slate-600">
                Periode: <strong className="text-slate-900 font-semibold">{payroll.period}</strong>
              </p>
            </div>
          </div>

          {/* Employee Metadata Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase">NIP / ID</span>
              <span className="font-mono font-semibold text-slate-900">{teacher?.nip || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase">Nama Lengkap</span>
              <span className="font-semibold text-slate-900 truncate block">{teacher?.name || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase">Jabatan</span>
              <span className="font-medium text-slate-700 truncate block">{teacher?.position || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase">Unit Kerja</span>
              <span className="font-medium text-slate-700">{teacher?.unit || '-'}</span>
            </div>
          </div>

          {/* Minimalist Corporate Earnings & Deductions Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              
              {/* Earnings Column */}
              <div className="flex flex-col">
                <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px] flex justify-between">
                  <span>A. PENDAPATAN (EARNINGS)</span>
                  <span className="text-slate-400">JUMLAH</span>
                </div>
                <div className="p-3.5 space-y-2.5 flex-1">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-medium text-slate-800">Gaji Pokok</span>
                      <p className="text-[10px] text-slate-400">SK Yayasan & Pesantren</p>
                    </div>
                    <span className="font-semibold text-slate-900">{formatRupiah(payroll.baseSalary)}</span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-medium text-slate-800">Honor Mengajar</span>
                      <p className="text-[10px] text-slate-400">
                        {payroll.totalTaughtHours} JP × {formatRupiah(payroll.hourlyRate)}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-900">{formatRupiah(payroll.teachingHonorarium)}</span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-medium text-slate-800">Uang Transport</span>
                      <p className="text-[10px] text-slate-400">
                        {payroll.totalPresentDays} Hari × {formatRupiah(payroll.dailyTransport)}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-900">{formatRupiah(payroll.totalTransport)}</span>
                  </div>
                </div>

                <div className="bg-slate-50/70 p-3 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                  <span>Total Pendapatan</span>
                  <span className="text-emerald-700">{formatRupiah(payroll.grossSalary)}</span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="flex flex-col">
                <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px] flex justify-between">
                  <span>B. POTONGAN (DEDUCTIONS)</span>
                  <span className="text-slate-400">JUMLAH</span>
                </div>
                <div className="p-3.5 space-y-2.5 flex-1">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-medium text-slate-800">Denda Keterlambatan</span>
                      <p className="text-[10px] text-slate-400">
                        {payroll.latePenaltyTotal > 0 ? 'Akumulasi telat clock-in' : 'Nihil'}
                      </p>
                    </div>
                    <span className={payroll.latePenaltyTotal > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                      {payroll.latePenaltyTotal > 0 ? `-${formatRupiah(payroll.latePenaltyTotal)}` : 'Rp 0'}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-medium text-slate-800">Penalti Jurnal Kosong</span>
                      <p className="text-[10px] text-slate-400">
                        {payroll.emptyJournalCount > 0 ? `${payroll.emptyJournalCount} sesi belum terisi` : 'Nihil'}
                      </p>
                    </div>
                    <span className={payroll.emptyJournalPenalty > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                      {payroll.emptyJournalPenalty > 0 ? `-${formatRupiah(payroll.emptyJournalPenalty)}` : 'Rp 0'}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-medium text-slate-800">Potongan Izin</span>
                      <p className="text-[10px] text-slate-400">
                        {(payroll.izinDays || 0) > 0 ? `${payroll.izinDays} hari izin` : 'Nihil'}
                      </p>
                    </div>
                    <span className={(payroll.izinPenalty || 0) > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                      {(payroll.izinPenalty || 0) > 0 ? `-${formatRupiah(payroll.izinPenalty || 0)}` : 'Rp 0'}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-medium text-slate-800">Potongan Alpa</span>
                      <p className="text-[10px] text-slate-400">
                        {payroll.alphaDays > 0 ? `${payroll.alphaDays} hari tanpa izin` : 'Nihil'}
                      </p>
                    </div>
                    <span className={payroll.alphaPenalty > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                      {payroll.alphaPenalty > 0 ? `-${formatRupiah(payroll.alphaPenalty)}` : 'Rp 0'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/70 p-3 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                  <span>Total Potongan</span>
                  <span className={payroll.totalDeductions > 0 ? 'text-rose-600' : 'text-slate-500'}>
                    {payroll.totalDeductions > 0 ? `-${formatRupiah(payroll.totalDeductions)}` : 'Rp 0'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Clean Modern Take Home Pay Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                GAJI BERSIH (TAKE HOME PAY)
              </span>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5 font-mono">
                {formatRupiah(payroll.netSalary)}
              </div>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4 max-w-xs">
              <span className="text-[9px] uppercase text-slate-400 font-semibold block">Terbilang:</span>
              <p className="text-xs text-slate-200 italic font-medium leading-snug">
                "{terbilang(payroll.netSalary)}"
              </p>
            </div>
          </div>

          {/* Corporate Signatures & Disclaimer */}
          {showSignatures && (
            <div className="pt-4 border-t border-slate-200 text-xs">
              <div className="text-right text-slate-700 mb-3 text-[10px]">
                Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-[11px] text-slate-500 mb-10">Mengetahui,<br /><strong className="text-slate-800 font-semibold">Pimpinan Pesantren</strong></p>
                  <div className="border-t border-slate-300 pt-1 font-semibold text-slate-800 text-[11px]">
                    Ust Cahyono
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-slate-500 mb-10">Dibuat Oleh,<br /><strong className="text-slate-800 font-semibold">Bendahara HRIS</strong></p>
                  <div className="border-t border-slate-300 pt-1 font-semibold text-slate-800 text-[11px]">
                    Ust Akmal Yaqien
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[11px] text-slate-500 mb-10">Penerima,<br /><strong className="text-slate-800 font-semibold">Karyawan / Guru</strong></p>
                  <div className="border-t border-slate-300 pt-1 font-semibold text-slate-800 text-[11px]">
                    {teacher?.name || '-'}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Dokumen resmi dikeluarkan otomatis oleh HRIS Pesantren BQA.</span>
                <span className="font-mono">ID: {teacher?.id?.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer (Hidden on Print) */}
        <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between print:hidden">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Tekan <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono text-[10px] text-slate-900 dark:text-slate-100">Esc</kbd> untuk menutup
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
