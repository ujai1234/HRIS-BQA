import React, { useEffect } from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  CreditCard,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { TeacherPayrollItem } from '../types';
import { formatRupiah, terbilang } from '../utils/formatters';

interface SalarySlipModalProps {
  payroll: TeacherPayrollItem;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({ payroll, onClose }) => {
  const { teacher } = payroll;

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
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto print:border-none print:shadow-none print:m-0 print:max-w-none animate-in fade-in zoom-in-95 duration-150"
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
        <div id="salary-slip-document" className="p-6 sm:p-8 space-y-5 text-slate-800 bg-white font-sans">
          {/* Corporate Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                BQ
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
                  PESANTREN BAITUL QUR'AN AL-IKHWAN
                </h1>
                <p className="text-[11px] text-slate-500">
                  Jl. Pesantren No. 07, Bogor • HR & Payroll Department
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
              <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 mb-1">
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
          <div className="pt-4 border-t border-slate-200 text-xs">
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
              <span>Dokumen resmi dikeluarkan otomatis oleh HRIS Pesantren.</span>
              <span className="font-mono">Tanggal: {new Date().toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Hidden on Print) */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-[11px] text-slate-500">
            Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Esc</kbd> untuk menutup
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
