import React, { useState } from 'react';
import { Printer, Eye, Download } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah } from '../utils/formatters';
import { SalarySlipModal } from './SalarySlipModal';

export const SlipGajiView: React.FC = () => {
  const { 
    currentUser, 
    selectedPeriod, 
    calculateTeacherPayroll 
  } = useHRIS();

  const [showSlipModal, setShowSlipModal] = useState(false);

  // Calculate teacher's payroll
  const calculatedPayroll = calculateTeacherPayroll(currentUser?.id || 'T-08', selectedPeriod);
  const targetTeacher = calculatedPayroll?.teacher || currentUser;

  // Fallback safe payroll item
  const payrollItem = calculatedPayroll || {
    teacher: targetTeacher,
    period: selectedPeriod,
    baseSalary: 700000,
    teachingHonorarium: 640000,
    totalTaughtHours: 16,
    totalTransport: 160000,
    totalPresentDays: 16,
    totalBadalHours: 0,
    badalHonorarium: 0,
    latePenaltyTotal: 90000,
    emptyJournalCount: 1,
    emptyJournalPenalty: 40000,
    alphaPenalty: 0,
    otherDeductions: 0,
    totalDeductions: 130000,
    netSalary: 1370000,
    isPaid: true
  };

  const handleOpenPreview = () => {
    setShowSlipModal(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="bg-white dark:bg-[#0B2B26] rounded-lg border border-slate-200 dark:border-[#163832] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-[#DAF1DE]">
            Slip Gaji Guru
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#8EB69B] mt-0.5">
            Periode {selectedPeriod} • {targetTeacher?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Style */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #salary-receipt-container, #salary-receipt-container * {
                visibility: visible !important;
              }
              #salary-receipt-container {
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
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              button, select, nav, header, aside, .no-print {
                display: none !important;
              }
            }
          ` }} />

          <button
            id="print-slip-btn"
            onClick={handleOpenPreview}
            className="inline-flex items-center gap-1.5 bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE] text-white dark:text-[#051F20] text-xs font-medium px-3.5 py-1.5 rounded-[12px] transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Slip (Pratinjau)</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Minimalist Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Gaji Bersih (THP) */}
        <div className="bg-white dark:bg-[#0B2B26] rounded-lg border border-slate-200 dark:border-[#163832] p-3.5">
          <span className="text-xs text-slate-500 dark:text-[#8EB69B] block font-normal">
            Gaji Bersih (THP)
          </span>
          <div className="text-lg font-semibold text-emerald-600 dark:text-[#8EB69B] mt-1 tabular-nums">
            {formatRupiah(payrollItem.netSalary)}
          </div>
        </div>

        {/* Card 2: Jam Mengajar */}
        <div className="bg-white dark:bg-[#0B2B26] rounded-lg border border-slate-200 dark:border-[#163832] p-3.5">
          <span className="text-xs text-slate-500 dark:text-[#8EB69B] block font-normal">
            Jam Mengajar
          </span>
          <div className="text-lg font-semibold text-slate-900 dark:text-[#DAF1DE] mt-1 tabular-nums">
            {payrollItem.totalTaughtHours} JP
          </div>
        </div>

        {/* Card 3: Kehadiran */}
        <div className="bg-white dark:bg-[#0B2B26] rounded-lg border border-slate-200 dark:border-[#163832] p-3.5">
          <span className="text-xs text-slate-500 dark:text-[#8EB69B] block font-normal">
            Kehadiran
          </span>
          <div className="text-lg font-semibold text-slate-900 dark:text-[#DAF1DE] mt-1 tabular-nums">
            {payrollItem.totalPresentDays} Hari
          </div>
        </div>

        {/* Card 4: Total Potongan */}
        <div className="bg-white dark:bg-[#0B2B26] rounded-lg border border-slate-200 dark:border-[#163832] p-3.5">
          <span className="text-xs text-slate-500 dark:text-[#8EB69B] block font-normal">
            Total Potongan
          </span>
          <div className="text-lg font-semibold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {payrollItem.totalDeductions > 0 ? `-${formatRupiah(payrollItem.totalDeductions)}` : 'Rp 0'}
          </div>
        </div>
      </div>

      {/* 3. Minimalist Salary Receipt */}
      <div id="salary-receipt-container" className="bg-white dark:bg-[#0B2B26] rounded-lg border border-slate-200 dark:border-[#163832] overflow-hidden">
        {/* Document Header with Clean Kop Surat on Print */}
        <div className="px-4 py-3 sm:px-5 border-b border-slate-200 dark:border-[#163832] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-[#163832]/50">
          <div>
            <h2 className="font-semibold text-xs text-slate-900 dark:text-[#DAF1DE]">
              Rincian Penerimaan Kafa'ah Asatidz
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-[#8EB69B]">
              Pondok Pesantren Baitul Qur'an Al-Ikhwan • Jl. Sungai Kendal No.21, Marunda, Jakarta Utara
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 dark:text-[#8EB69B] bg-slate-100 dark:bg-[#163832] px-2 py-0.5 rounded">
              SLP-{selectedPeriod.replace(/\s+/g, '-').toUpperCase()}-{targetTeacher?.id || 'T-08'}
            </span>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="px-4 py-3 sm:px-5 border-b border-slate-100 dark:border-[#163832] text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-[#8EB69B] block">Nama Asatidz</span>
              <p className="font-medium text-slate-800 dark:text-[#DAF1DE] mt-0.5">{targetTeacher?.name}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-[#8EB69B] block">NIP / Unit</span>
              <p className="text-slate-700 dark:text-[#DAF1DE] font-mono mt-0.5">{targetTeacher?.nip || 'BQA-008'} • {targetTeacher?.unit || 'SMP'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-[#8EB69B] block">Jabatan</span>
              <p className="text-slate-700 dark:text-[#DAF1DE] mt-0.5">{targetTeacher?.position || 'Guru'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-[#8EB69B] block">Rekening Penyaluran</span>
              <p className="text-slate-700 dark:text-[#DAF1DE] font-mono mt-0.5">{targetTeacher?.bankName || 'BSI'} - {targetTeacher?.accountNumber || '7123-4567-89'}</p>
            </div>
          </div>
        </div>

        {/* 2-Column Breakdown */}
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Pendapatan */}
            <div className="space-y-2">
              <div className="pb-1.5 border-b border-slate-200 dark:border-[#163832] font-medium text-[#163832] dark:text-[#DAF1DE] flex justify-between">
                <span>A. Pendapatan (Hak)</span>
                <span>Jumlah</span>
              </div>
              
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#163832] text-slate-700 dark:text-[#8EB69B]">
                <span>1. Gaji Pokok</span>
                <span className="font-mono text-slate-900 dark:text-[#DAF1DE]">{formatRupiah(payrollItem.baseSalary)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#163832] text-slate-700 dark:text-[#8EB69B]">
                <div>
                  <span>2. Honor Mengajar</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#163832] block font-mono">
                    {payrollItem.totalTaughtHours} JP × {formatRupiah(targetTeacher?.hourlyRate || 40000)}
                  </span>
                </div>
                <span className="font-mono text-slate-900 dark:text-[#DAF1DE]">{formatRupiah(payrollItem.teachingHonorarium)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#163832] text-slate-700 dark:text-[#8EB69B]">
                <div>
                  <span>3. Uang Transport</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#163832] block font-mono">
                    {payrollItem.totalPresentDays} Hari × {formatRupiah(targetTeacher?.dailyTransportRate || 10000)}
                  </span>
                </div>
                <span className="font-mono text-slate-900 dark:text-[#DAF1DE]">{formatRupiah(payrollItem.totalTransport)}</span>
              </div>

              {payrollItem.totalBadalHours > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#163832] text-slate-700 dark:text-[#8EB69B]">
                  <div>
                    <span>4. Honor Badal (Pengganti)</span>
                    <span className="text-[10px] text-slate-400 dark:text-[#163832] block font-mono">{payrollItem.totalBadalHours} JP Badal</span>
                  </div>
                  <span className="font-mono text-slate-900 dark:text-[#DAF1DE]">{formatRupiah(payrollItem.badalHonorarium)}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 font-semibold text-[#163832] dark:text-[#8EB69B] border-t border-slate-200 dark:border-[#163832]">
                <span>Total Pendapatan</span>
                <span className="font-mono">
                  {formatRupiah(
                    payrollItem.baseSalary +
                      payrollItem.teachingHonorarium +
                      payrollItem.totalTransport +
                      (payrollItem.badalHonorarium || 0)
                  )}
                </span>
              </div>
            </div>

            {/* Potongan */}
            <div className="space-y-2">
              <div className="pb-1.5 border-b border-slate-200 dark:border-[#163832] font-medium text-rose-700 dark:text-rose-400 flex justify-between">
                <span>B. Potongan SOP & Disiplin</span>
                <span>Jumlah</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#163832] text-slate-700 dark:text-[#8EB69B]">
                <div>
                  <span>1. Denda Keterlambatan</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#163832] block">SOP keterlambatan KBM</span>
                </div>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  {payrollItem.latePenaltyTotal > 0 ? `-${formatRupiah(payrollItem.latePenaltyTotal)}` : 'Rp 0'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#163832] text-slate-700 dark:text-[#8EB69B]">
                <div>
                  <span>2. Penalti Jurnal Belum Diisi</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#163832] block font-mono">{payrollItem.emptyJournalCount || 0} sesi pending</span>
                </div>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  {payrollItem.emptyJournalPenalty > 0 ? `-${formatRupiah(payrollItem.emptyJournalPenalty)}` : 'Rp 0'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#163832] text-slate-700 dark:text-[#8EB69B]">
                <span>3. Potongan Alpa / Izin</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  {payrollItem.alphaPenalty > 0 ? `-${formatRupiah(payrollItem.alphaPenalty)}` : 'Rp 0'}
                </span>
              </div>

              <div className="flex justify-between pt-2 font-semibold text-rose-700 dark:text-rose-400 border-t border-slate-200 dark:border-[#163832]">
                <span>Total Potongan</span>
                <span className="font-mono">
                  {payrollItem.totalDeductions > 0 ? `-${formatRupiah(payrollItem.totalDeductions)}` : 'Rp 0'}
                </span>
              </div>
            </div>
          </div>

          {/* Grand Total Strip */}
          <div className="mt-5 p-3.5 bg-slate-50 dark:bg-[#163832] rounded-[16px] border border-slate-200 dark:border-[#0B2B26] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-900 dark:text-[#DAF1DE] block">
                Total Gaji Bersih (Take Home Pay)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-[#8EB69B]">
                Ditransfer ke rekening {targetTeacher?.bankName || 'BSI'} {targetTeacher?.accountNumber}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-[#8EB69B] font-mono">
                {formatRupiah(payrollItem.netSalary)}
              </span>
              <button
                type="button"
                onClick={handleOpenPreview}
                className="inline-flex items-center gap-1 text-xs text-[#163832] dark:text-[#8EB69B] hover:text-[#0B2B26] dark:hover:text-[#DAF1DE] font-medium px-2.5 py-1 bg-emerald-50 dark:bg-[#0B2B26] rounded-[12px] border border-emerald-200 dark:border-[#163832] transition-colors shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Dokumen Lengkap</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Slip Modal Preview */}
      {showSlipModal && (
        <SalarySlipModal
          payroll={payrollItem}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};

