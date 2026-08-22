import React, { useState } from 'react';
import { 
  CreditCard, 
  Printer, 
  Calendar, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { SalarySlipModal } from './SalarySlipModal';
import { formatRupiah, terbilang } from '../utils/formatters';

export const SlipGajiView: React.FC = () => {
  const { 
    currentUser, 
    selectedPeriod, 
    setSelectedPeriod,
    calculateTeacherPayroll 
  } = useHRIS();

  const [showPrintModal, setShowPrintModal] = useState(false);

  // Strictly view only the logged-in user's salary slip
  const selectedTeacherPayroll = calculateTeacherPayroll(currentUser?.id || 'T-08', selectedPeriod);
  const targetTeacher = selectedTeacherPayroll?.teacher || currentUser;

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <span>Slip Gaji</span>
        </h2>

        <div className="flex items-center gap-2.5">
          {/* Period (Bulan) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-semibold text-slate-800"
            >
              <option value="Agustus 2026">Agustus 2026</option>
              <option value="Juli 2026">Juli 2026</option>
              <option value="Juni 2026">Juni 2026</option>
            </select>
          </div>

          <button
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Modern Minimalist Corporate Payslip Card */}
      <div 
        id="salary-slip-document" 
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto space-y-5 text-slate-800 font-sans"
      >
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
              Periode: <strong className="text-slate-900 font-semibold">{selectedTeacherPayroll.period}</strong>
            </p>
          </div>
        </div>

        {/* Employee Metadata Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase">NIP / ID</span>
            <span className="font-mono font-semibold text-slate-900">{targetTeacher?.nip || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase">Nama Lengkap</span>
            <span className="font-semibold text-slate-900 truncate block">{targetTeacher?.name || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase">Jabatan</span>
            <span className="font-medium text-slate-700 truncate block">{targetTeacher?.position || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase">Unit Kerja</span>
            <span className="font-medium text-slate-700">{targetTeacher?.unit || '-'}</span>
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
                  <span className="font-semibold text-slate-900">{formatRupiah(selectedTeacherPayroll.baseSalary)}</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-medium text-slate-800">Honor Mengajar</span>
                    <p className="text-[10px] text-slate-400">
                      {selectedTeacherPayroll.totalTaughtHours} JP × {formatRupiah(selectedTeacherPayroll.hourlyRate)}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatRupiah(selectedTeacherPayroll.teachingHonorarium)}</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-medium text-slate-800">Uang Transport</span>
                    <p className="text-[10px] text-slate-400">
                      {selectedTeacherPayroll.totalPresentDays} Hari × {formatRupiah(selectedTeacherPayroll.dailyTransport)}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatRupiah(selectedTeacherPayroll.totalTransport)}</span>
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                <span>Total Pendapatan</span>
                <span className="text-emerald-700">{formatRupiah(selectedTeacherPayroll.grossSalary)}</span>
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
                      {selectedTeacherPayroll.latePenaltyTotal > 0 ? 'Akumulasi telat clock-in' : 'Nihil'}
                    </p>
                  </div>
                  <span className={selectedTeacherPayroll.latePenaltyTotal > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                    {selectedTeacherPayroll.latePenaltyTotal > 0 ? `-${formatRupiah(selectedTeacherPayroll.latePenaltyTotal)}` : 'Rp 0'}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-medium text-slate-800">Penalti Jurnal Kosong</span>
                    <p className="text-[10px] text-slate-400">
                      {selectedTeacherPayroll.emptyJournalCount > 0 ? `${selectedTeacherPayroll.emptyJournalCount} sesi belum terisi` : 'Nihil'}
                    </p>
                  </div>
                  <span className={selectedTeacherPayroll.emptyJournalPenalty > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                    {selectedTeacherPayroll.emptyJournalPenalty > 0 ? `-${formatRupiah(selectedTeacherPayroll.emptyJournalPenalty)}` : 'Rp 0'}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-medium text-slate-800">Potongan Alpa</span>
                    <p className="text-[10px] text-slate-400">
                      {selectedTeacherPayroll.alphaDays > 0 ? `${selectedTeacherPayroll.alphaDays} hari tanpa izin` : 'Nihil'}
                    </p>
                  </div>
                  <span className={selectedTeacherPayroll.alphaPenalty > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                    {selectedTeacherPayroll.alphaPenalty > 0 ? `-${formatRupiah(selectedTeacherPayroll.alphaPenalty)}` : 'Rp 0'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                <span>Total Potongan</span>
                <span className={selectedTeacherPayroll.totalDeductions > 0 ? 'text-rose-600' : 'text-slate-500'}>
                  {selectedTeacherPayroll.totalDeductions > 0 ? `-${formatRupiah(selectedTeacherPayroll.totalDeductions)}` : 'Rp 0'}
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
              {formatRupiah(selectedTeacherPayroll.netSalary)}
            </div>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4 max-w-xs">
            <span className="text-[9px] uppercase text-slate-400 font-semibold block">Terbilang:</span>
            <p className="text-xs text-slate-200 italic font-medium leading-snug">
              "{terbilang(selectedTeacherPayroll.netSalary)}"
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
                {targetTeacher?.name || '-'}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Dokumen resmi dikeluarkan otomatis oleh HRIS Pesantren.</span>
            <span className="font-mono">Tanggal: {new Date().toLocaleDateString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showPrintModal && (
        <SalarySlipModal
          payroll={selectedTeacherPayroll}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
