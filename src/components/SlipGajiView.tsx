import React, { useState } from 'react';
import { 
  Printer, 
  ChevronDown
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

  // Strictly view logged-in user's salary slip
  const selectedTeacherPayroll = calculateTeacherPayroll(currentUser?.id || 'T-08', selectedPeriod);
  const targetTeacher = selectedTeacherPayroll?.teacher || currentUser;

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-sm text-slate-900">
            Slip Gaji & Mukafa'ah
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rincian resmi pendapatan, honor mengajar, dan potongan periode {selectedPeriod}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-600 shadow-2xs cursor-pointer"
          >
            <option value="Agustus 2026">Agustus 2026</option>
            <option value="Juli 2026">Juli 2026</option>
            <option value="Juni 2026">Juni 2026</option>
          </select>

          <button
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Slip</span>
          </button>
        </div>
      </div>

      {/* Minimalist Corporate Payslip Document */}
      <div 
        id="salary-slip-document" 
        className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 sm:p-7 max-w-3xl mx-auto space-y-4 text-slate-800 font-sans"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200/80 pb-3.5 gap-2">
          <div>
            <h1 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
              PESANTREN BAITUL QUR'AN AL-IKHWAN
            </h1>
            <p className="text-[11px] text-slate-400">
              Jl. Pesantren No. 07, Bogor • Administrasi & Keuangan
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
              SLIP GAJI
            </span>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Periode: <strong className="text-slate-800">{selectedTeacherPayroll.period}</strong>
            </p>
          </div>
        </div>

        {/* Teacher Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-lg border border-slate-200/70 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">NIP</span>
            <span className="font-mono font-semibold text-slate-900">{targetTeacher?.nip || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Nama Asatidz</span>
            <span className="font-semibold text-slate-900 truncate block">{targetTeacher?.name || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Jabatan</span>
            <span className="text-slate-700 truncate block">{targetTeacher?.position || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Unit Kerja</span>
            <span className="text-slate-700">{targetTeacher?.unit || '-'}</span>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div className="border border-slate-200/80 rounded-lg overflow-hidden text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
            
            {/* Earnings */}
            <div className="flex flex-col">
              <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200/80 font-bold text-slate-700 text-[10px] uppercase tracking-wider flex justify-between">
                <span>A. PENDAPATAN</span>
                <span className="text-slate-400">JUMLAH</span>
              </div>
              <div className="p-3.5 space-y-2 flex-1">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-medium text-slate-800">Gaji Pokok</span>
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

              <div className="bg-slate-50/70 p-3 border-t border-slate-200/80 flex justify-between items-center font-bold text-slate-900">
                <span>Total Pendapatan</span>
                <span className="text-emerald-800">{formatRupiah(selectedTeacherPayroll.grossSalary)}</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="flex flex-col">
              <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200/80 font-bold text-slate-700 text-[10px] uppercase tracking-wider flex justify-between">
                <span>B. POTONGAN</span>
                <span className="text-slate-400">JUMLAH</span>
              </div>
              <div className="p-3.5 space-y-2 flex-1">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-medium text-slate-800">Denda Keterlambatan</span>
                  </div>
                  <span className={selectedTeacherPayroll.latePenaltyTotal > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                    {selectedTeacherPayroll.latePenaltyTotal > 0 ? `-${formatRupiah(selectedTeacherPayroll.latePenaltyTotal)}` : 'Rp 0'}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-medium text-slate-800">Penalti Jurnal Kosong</span>
                    {selectedTeacherPayroll.emptyJournalCount > 0 && (
                      <p className="text-[10px] text-slate-400">{selectedTeacherPayroll.emptyJournalCount} sesi belum terisi</p>
                    )}
                  </div>
                  <span className={selectedTeacherPayroll.emptyJournalPenalty > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                    {selectedTeacherPayroll.emptyJournalPenalty > 0 ? `-${formatRupiah(selectedTeacherPayroll.emptyJournalPenalty)}` : 'Rp 0'}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-medium text-slate-800">Potongan Izin / Sakit</span>
                  </div>
                  <span className={(selectedTeacherPayroll.izinPenalty || 0) > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                    {(selectedTeacherPayroll.izinPenalty || 0) > 0 ? `-${formatRupiah(selectedTeacherPayroll.izinPenalty || 0)}` : 'Rp 0'}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-medium text-slate-800">Potongan Alpa</span>
                  </div>
                  <span className={selectedTeacherPayroll.alphaPenalty > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
                    {selectedTeacherPayroll.alphaPenalty > 0 ? `-${formatRupiah(selectedTeacherPayroll.alphaPenalty)}` : 'Rp 0'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 border-t border-slate-200/80 flex justify-between items-center font-bold text-slate-900">
                <span>Total Potongan</span>
                <span className={selectedTeacherPayroll.totalDeductions > 0 ? 'text-rose-600' : 'text-slate-500'}>
                  {selectedTeacherPayroll.totalDeductions > 0 ? `-${formatRupiah(selectedTeacherPayroll.totalDeductions)}` : 'Rp 0'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Gaji Bersih */}
        <div className="bg-slate-900 text-white p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              GAJI BERSIH (TAKE HOME PAY)
            </span>
            <div className="text-xl font-bold font-mono tracking-tight text-white mt-0.5">
              {formatRupiah(selectedTeacherPayroll.netSalary)}
            </div>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-1.5 sm:pt-0 sm:pl-3">
            <span className="text-[9px] uppercase text-slate-400 block">Terbilang:</span>
            <p className="text-xs text-slate-200 italic font-medium">
              "{terbilang(selectedTeacherPayroll.netSalary)}"
            </p>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="pt-3 border-t border-slate-200/80 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[11px] text-slate-400 mb-8">Mengetahui,<br /><strong className="text-slate-700">Pimpinan Pesantren</strong></p>
              <div className="border-t border-slate-300 pt-1 font-semibold text-slate-800 text-[11px]">
                Ust Cahyono
              </div>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 mb-8">Dibuat Oleh,<br /><strong className="text-slate-700">Bendahara HRIS</strong></p>
              <div className="border-t border-slate-300 pt-1 font-semibold text-slate-800 text-[11px]">
                Ust Akmal Yaqien
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-[11px] text-slate-400 mb-8">Penerima,<br /><strong className="text-slate-700">Asatidz</strong></p>
              <div className="border-t border-slate-300 pt-1 font-semibold text-slate-800 text-[11px]">
                {targetTeacher?.name || '-'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Dokumen sah dikeluarkan oleh sistem HRIS.</span>
            <span className="font-mono">{new Date().toLocaleDateString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && (
        <SalarySlipModal
          payroll={selectedTeacherPayroll}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
