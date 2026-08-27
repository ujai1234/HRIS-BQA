import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { TeacherPayrollItem } from '../types';
import { formatRupiah, terbilang, printSalarySlipDocument } from '../utils/formatters';

interface SalarySlipModalProps {
  payroll: TeacherPayrollItem;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({ payroll, onClose }) => {
  const { teacher } = payroll;
  const [showSignatures, setShowSignatures] = useState(true);
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

  const handlePrint = () => {
    printSalarySlipDocument({
      teacherName: teacher.name,
      nip: teacher.nip || 'BQ-008',
      unit: teacher.unit,
      position: teacher.position,
      bankName: teacher.bankName,
      accountNumber: teacher.accountNumber,
      period: payroll.period,
      isPrivacyMode,
    });
  };

  const displayAmount = (amount: number) => {
    if (isPrivacyMode) return '••••••••';
    return formatRupiah(amount);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200 my-auto print:border-none print:shadow-none print:m-0 print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="bg-[#141A17] text-white px-5 py-3 flex items-center justify-between print:hidden border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-xs text-stone-100">Slip Kafa'ah Asatidz</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                isPrivacyMode 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
              title="Sembunyikan / Tampilkan Nominal"
            >
              {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />}
              <span className="hidden sm:inline">Privasi</span>
            </button>

            <button
              onClick={() => setShowSignatures(!showSignatures)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                showSignatures 
                  ? 'bg-[#1B4332] border-emerald-600 text-emerald-300' 
                  : 'bg-stone-800 border-stone-700 text-stone-400'
              }`}
            >
              {showSignatures ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} /> : <div className="w-3.5 h-3.5 rounded-full border border-stone-600" />}
              <span className="hidden sm:inline">Tanda Tangan</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimalist Editorial Digital Payslip Document */}
        <div id="salary-slip-document" className="p-6 sm:p-8 space-y-6 text-stone-900 bg-white font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[#1B4332] pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-extrabold text-base shrink-0">
                BQA
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#B08968] uppercase tracking-widest leading-none mb-1">
                  Yayasan Baitul Qur'an Al-Ikhwan
                </p>
                <h1 className="font-extrabold text-sm sm:text-base text-stone-900 tracking-tight leading-tight uppercase">
                  PONDOK PESANTREN BAITUL QUR'AN AL-IKHWAN
                </h1>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Jl. Pesantren No. 1, Kab. Bogor, Jawa Barat • Telp: (021) 8790-1234
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200 w-full sm:w-auto">
              <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">
                Slip Kafa'ah Asatidz
              </span>
              <span className="font-bold text-sm text-stone-900 block font-serif">
                Periode: {payroll.period}
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Teacher Info Grid */}
          <div className="bg-[#FBFBFA] border border-stone-200 rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] uppercase text-stone-400 block">Nama Asatidz</span>
              <strong className="text-stone-900 font-semibold">{teacher.name}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 block">NIP & Unit</span>
              <span className="font-mono text-stone-700 font-medium">{teacher.nip || 'BQ-008'} • {teacher.unit}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 block">Jabatan</span>
              <span className="text-stone-700">{teacher.position}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 block">Rekening Penyaluran</span>
              <span className="font-mono text-stone-700">{teacher.bankName} - {teacher.accountNumber}</span>
            </div>
          </div>

          {/* Clean Two-Column Grid Ledger with border-b-stone-100 dividers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 text-xs">
            {/* Column 1: Pendapatan */}
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4332]">A. PENDAPATAN</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">JUMLAH</span>
              </div>
              <div className="flex items-baseline justify-between py-2 border-b border-stone-100">
                <span className="text-stone-700 font-medium">Gaji Pokok</span>
                <span className="font-mono font-semibold text-stone-900">{displayAmount(700000)}</span>
              </div>
              <div className="flex items-baseline justify-between py-2 border-b border-stone-100">
                <div>
                  <span className="text-stone-700 font-medium block">Honor Mengajar</span>
                  <span className="text-[10px] text-stone-400 font-mono">16 JP × Rp 40.000</span>
                </div>
                <span className="font-mono font-semibold text-stone-900">{displayAmount(640000)}</span>
              </div>
              <div className="flex items-baseline justify-between py-2 border-b border-stone-100">
                <div>
                  <span className="text-stone-700 font-medium block">Uang Transport</span>
                  <span className="text-[10px] text-stone-400 font-mono">16 Hari × Rp 10.000</span>
                </div>
                <span className="font-mono font-semibold text-stone-900">{displayAmount(160000)}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 font-bold text-stone-900">
                <span>Total Pendapatan</span>
                <span className="font-mono text-[#1B4332] text-sm">{displayAmount(1500000)}</span>
              </div>
            </div>

            {/* Column 2: Potongan */}
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B08968]">B. POTONGAN</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">JUMLAH</span>
              </div>
              <div className="flex items-baseline justify-between py-2 border-b border-stone-100">
                <span className="text-stone-700 font-medium">Denda Keterlambatan</span>
                <span className="font-mono font-semibold text-rose-700">{isPrivacyMode ? '••••••••' : '-Rp 90.000'}</span>
              </div>
              <div className="flex items-baseline justify-between py-2 border-b border-stone-100">
                <div>
                  <span className="text-stone-700 font-medium block">Penalti Jurnal Kosong</span>
                  <span className="text-[10px] text-stone-400 font-mono">1 sesi belum terisi</span>
                </div>
                <span className="font-mono font-semibold text-rose-700">{isPrivacyMode ? '••••••••' : '-Rp 40.000'}</span>
              </div>
              <div className="flex items-baseline justify-between py-2 border-b border-stone-100">
                <span className="text-stone-700 font-medium">Potongan Izin / Sakit</span>
                <span className="font-mono font-medium text-stone-400">{isPrivacyMode ? '••••••••' : 'Rp 0'}</span>
              </div>
              <div className="flex items-baseline justify-between py-2 border-b border-stone-100">
                <span className="text-stone-700 font-medium">Potongan Alpa</span>
                <span className="font-mono font-medium text-stone-400">{isPrivacyMode ? '••••••••' : 'Rp 0'}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 font-bold text-stone-900">
                <span>Total Potongan</span>
                <span className="font-mono text-rose-700 text-sm">{isPrivacyMode ? '••••••••' : '-Rp 130.000'}</span>
              </div>
            </div>
          </div>

          {/* Take Home Pay Highlight Box */}
          <div className="bg-[#1B4332] text-white p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#B08968] font-bold block">
                Total Kafa'ah Bersih (Take Home Pay)
              </span>
              <p className="text-[11px] text-emerald-100/90 font-serif italic mt-0.5">
                {isPrivacyMode ? 'Dirahasiakan' : '"Satu Juta Tiga Ratus Tujuh Puluh Ribu Rupiah"'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight block">
                {isPrivacyMode ? '••••••••' : 'Rp 1.370.000'}
              </span>
            </div>
          </div>

          {/* Signatures */}
          {showSignatures && (
            <div className="grid grid-cols-2 gap-8 pt-4 text-xs text-center border-t border-stone-200">
              <div className="space-y-10">
                <div>
                  <p className="text-stone-500 text-[11px]">Diverifikasi oleh,</p>
                  <p className="font-semibold text-stone-900 mt-0.5">Bendahara HRD Pesantren</p>
                </div>
                <div>
                  <p className="font-bold text-stone-900 underline">Ust. Ahmad Syahid, M.Pd.</p>
                  <p className="text-[10px] text-stone-500">NIP. BQ-001</p>
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <p className="text-stone-500 text-[11px]">Penerima Kafa'ah,</p>
                  <p className="font-semibold text-stone-900 mt-0.5">Asatidz yang bersangkutan</p>
                </div>
                <div>
                  <p className="font-bold text-stone-900 underline">{teacher.name}</p>
                  <p className="text-[10px] text-stone-500">NIP. {teacher.nip || 'BQ-008'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
