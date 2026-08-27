import React, { useState } from 'react';
import { 
  Printer, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  ShieldCheck
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah, terbilang, printSalarySlipDocument } from '../utils/formatters';

export const SlipGajiView: React.FC = () => {
  const { 
    currentUser, 
    selectedPeriod, 
    setSelectedPeriod, 
    calculateTeacherPayroll 
  } = useHRIS();

  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);

  // Strictly calculate logged-in teacher's payroll
  const selectedTeacherPayroll = calculateTeacherPayroll(currentUser?.id || 'T-08', selectedPeriod);
  const targetTeacher = selectedTeacherPayroll?.teacher || currentUser;

  const displayAmount = (amount: number) => {
    if (isPrivacyMode) return '••••••••';
    return formatRupiah(amount);
  };

  const handleDirectPrint = () => {
    if (!targetTeacher) return;
    try {
      printSalarySlipDocument({
        teacherName: targetTeacher.name,
        nip: targetTeacher.nip || 'BQ-008',
        unit: targetTeacher.unit,
        position: targetTeacher.position,
        bankName: targetTeacher.bankName,
        accountNumber: targetTeacher.accountNumber,
        period: selectedPeriod,
        isPrivacyMode,
      });
    } catch (err) {
      console.error('Print failed', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar & Period Controls */}
      <div className="bg-white dark:bg-[#1A221E] rounded-xl p-4 sm:px-5 sm:py-3.5 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight mt-1">
            Slip Kafa'ah Asatidz
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Style block for printing the exact salary receipt container beautifully */}
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
                padding: 1.5cm !important;
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

          {/* Print Slip Button */}
          <button
            id="print-slip-btn"
            onClick={handleDirectPrint}
            className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer active:scale-95"
            title="Cetak Slip Kafa'ah Resmi"
          >
            <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Cetak Slip</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Bento-Grid Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Take Home Pay */}
        <div className="bg-white dark:bg-[#1A221E] rounded-xl p-4 border border-stone-200 dark:border-stone-800 space-y-1.5">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Gaji Bersih (THP)
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#1B4332] dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            {isPrivacyMode ? '••••••••' : 'Rp 1.370.000'}
          </div>
          <p className="text-[11px] text-[#1B4332] dark:text-emerald-400 font-medium">
            Periode {selectedPeriod}
          </p>
        </div>

        {/* Card 2: Total JP Mengajar */}
        <div className="bg-white dark:bg-[#1A221E] rounded-xl p-4 border border-stone-200 dark:border-stone-800 space-y-1.5">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Realisasi JP Mengajar
            </span>
            <div className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            16 <span className="text-xs font-sans font-normal text-stone-400">JP</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Honor: {isPrivacyMode ? '••••••••' : 'Rp 640.000'}
          </p>
        </div>

        {/* Card 3: Hari Kehadiran */}
        <div className="bg-white dark:bg-[#1A221E] rounded-xl p-4 border border-stone-200 dark:border-stone-800 space-y-1.5">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Kehadiran Fisik
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#1B4332] dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            16 <span className="text-xs font-sans font-normal text-stone-400">Hari</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Disiplin: Kehadiran Penuh
          </p>
        </div>

        {/* Card 4: Potongan Kedisiplinan */}
        <div className="bg-white dark:bg-[#1A221E] rounded-xl p-4 border border-stone-200 dark:border-stone-800 space-y-1.5">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Total Potongan
            </span>
            <div className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-[#B08968] flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold tracking-tight text-rose-700 dark:text-rose-400">
            {isPrivacyMode ? '••••••••' : 'Rp 130.000'}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Terlambat & Penalti Jurnal
          </p>
        </div>
      </div>

      {/* 3. Editorial Digital Salary Receipt Document */}
      <div id="salary-receipt-container" className="bg-white dark:bg-[#1A221E] rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        {/* Document Header */}
        <div className="bg-[#141A17] text-white p-5 sm:p-6 border-b border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0 border border-white/10">
                BQA
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#B08968] uppercase tracking-widest leading-none mb-1">
                  Yayasan Baitul Qur'an Al-Ikhwan
                </p>
                <h2 className="font-bold text-sm sm:text-base text-stone-100 tracking-tight leading-tight">
                  Tanda Bukti Penerimaan Kafa'ah (Honorarium Asatidz)
                </h2>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
              <span className="text-[10px] font-mono text-stone-400 block uppercase tracking-wider">
                ID Slip Kafa'ah
              </span>
              <span className="font-mono text-xs font-semibold text-stone-200">
                SLP-{selectedPeriod.replace(' ', '-').toUpperCase()}-{targetTeacher.id}
              </span>
            </div>
          </div>
        </div>

        {/* Teacher Metadata Row */}
        <div className="bg-[#FBFBFA] dark:bg-[#161D19] px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] uppercase text-stone-400 block">Nama Penerima</span>
              <strong className="text-stone-900 dark:text-stone-100 font-semibold">{targetTeacher.name}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 block">NIP / Unit</span>
              <span className="font-mono text-stone-700 dark:text-stone-300 font-medium">{targetTeacher.nip || 'BQ-008'} • {targetTeacher.unit}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 block">Jabatan / Status</span>
              <span className="text-stone-700 dark:text-stone-300">{targetTeacher.position} ({targetTeacher.employmentType === 'TETAP' ? 'Guru Tetap' : 'Guru Tidak Tetap'})</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 block">Rekening Penyaluran</span>
              <span className="font-mono text-stone-700 dark:text-stone-300">{targetTeacher.bankName} - {targetTeacher.accountNumber}</span>
            </div>
          </div>
        </div>

        {/* Clean Editorial Two-Column Ledger with border-b-stone-100 dividers */}
        <div className="p-5 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Penerimaan / Komponen Pendapatan */}
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-2.5 border-b border-stone-200 dark:border-stone-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4332] dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] dark:bg-emerald-400"></span>
                  A. Pendapatan
                </span>
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Jumlah</span>
              </div>

              {/* Item 1 */}
              <div className="flex items-baseline justify-between py-2.5 border-b border-stone-100 dark:border-stone-800/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-stone-800 dark:text-stone-200">Gaji Pokok</p>
                </div>
                <span className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100">
                  {displayAmount(700000)}
                </span>
              </div>

              {/* Item 2 */}
              <div className="flex items-baseline justify-between py-2.5 border-b border-stone-100 dark:border-stone-800/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-stone-800 dark:text-stone-200">Honor Mengajar</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">16 JP × Rp 40.000</p>
                </div>
                <span className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100">
                  {displayAmount(640000)}
                </span>
              </div>

              {/* Item 3 */}
              <div className="flex items-baseline justify-between py-2.5 border-b border-stone-100 dark:border-stone-800/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-stone-800 dark:text-stone-200">Uang Transport</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">16 Hari × Rp 10.000</p>
                </div>
                <span className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100">
                  {displayAmount(160000)}
                </span>
              </div>

              {/* Subtotal Pendapatan */}
              <div className="flex items-center justify-between pt-3 text-xs font-bold">
                <span className="text-stone-800 dark:text-stone-200">Total Pendapatan</span>
                <span className="font-mono text-[#1B4332] dark:text-emerald-400 text-sm">
                  {displayAmount(1500000)}
                </span>
              </div>
            </div>

            {/* Column 2: Potongan / Kewajiban */}
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-2.5 border-b border-stone-200 dark:border-stone-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B08968] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B08968]"></span>
                  B. Potongan
                </span>
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Jumlah</span>
              </div>

              {/* Item 1 */}
              <div className="flex items-baseline justify-between py-2.5 border-b border-stone-100 dark:border-stone-800/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-stone-800 dark:text-stone-200">Denda Keterlambatan</p>
                </div>
                <span className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-400">
                  {isPrivacyMode ? '••••••••' : '-Rp 90.000'}
                </span>
              </div>

              {/* Item 2 */}
              <div className="flex items-baseline justify-between py-2.5 border-b border-stone-100 dark:border-stone-800/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-stone-800 dark:text-stone-200">Penalti Jurnal Kosong</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">1 sesi belum terisi</p>
                </div>
                <span className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-400">
                  {isPrivacyMode ? '••••••••' : '-Rp 40.000'}
                </span>
              </div>

              {/* Item 3 */}
              <div className="flex items-baseline justify-between py-2.5 border-b border-stone-100 dark:border-stone-800/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-stone-800 dark:text-stone-200">Potongan Izin / Sakit</p>
                </div>
                <span className="font-mono text-xs font-medium text-stone-400 dark:text-stone-500">
                  {isPrivacyMode ? '••••••••' : 'Rp 0'}
                </span>
              </div>

              {/* Item 4 */}
              <div className="flex items-baseline justify-between py-2.5 border-b border-stone-100 dark:border-stone-800/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-stone-800 dark:text-stone-200">Potongan Alpa</p>
                </div>
                <span className="font-mono text-xs font-medium text-stone-400 dark:text-stone-500">
                  {isPrivacyMode ? '••••••••' : 'Rp 0'}
                </span>
              </div>

              {/* Subtotal Potongan */}
              <div className="flex items-center justify-between pt-3 text-xs font-bold">
                <span className="text-stone-800 dark:text-stone-200">Total Potongan</span>
                <span className="font-mono text-rose-700 dark:text-rose-400 text-sm">
                  {isPrivacyMode ? '••••••••' : '-Rp 130.000'}
                </span>
              </div>
            </div>
          </div>

          {/* Grand Total Take Home Pay Highlight Strip */}
          <div className="bg-[#1B4332] text-white p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#B08968] font-bold block">
                Total Kafa'ah Diterima (Take Home Pay)
              </span>
              <p className="text-xs text-emerald-100/90 font-serif italic mt-0.5">
                {isPrivacyMode ? 'Nominal dirahasiakan' : 'Terbilang: "Satu Juta Tiga Ratus Tujuh Puluh Ribu Rupiah"'}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight block">
                {isPrivacyMode ? '••••••••' : 'Rp 1.370.000'}
              </span>
              <span className="text-[10px] text-emerald-200/80 font-mono">
                Status: Telah Ditransfer ke Rekening
              </span>
            </div>
          </div>

          {/* Minimalist Receipt Footer Info */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-stone-400 dark:text-stone-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1B4332] dark:text-emerald-500" strokeWidth={1.5} />
              <span>Dokumen Digital Terverifikasi HRIS Pesantren</span>
            </div>
            <span>Penerima: {targetTeacher.name} • Bendahara: Ust. Ahmad Syahid, M.Pd.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

