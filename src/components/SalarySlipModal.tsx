import React from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  CheckCircle, 
  Calendar, 
  User, 
  CreditCard,
  Download
} from 'lucide-react';
import { TeacherPayrollItem } from '../types';
import { formatRupiah, terbilang } from '../utils/formatters';

interface SalarySlipModalProps {
  payroll: TeacherPayrollItem;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({ payroll, onClose }) => {
  const { teacher } = payroll;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-4 print:border-none print:shadow-none print:m-0 print:max-w-none">
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-xs text-white">Pratinjau Slip Gaji Resmi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Slip Gaji (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Slip Gaji Sheet (A4 Proportion) */}
        <div id="salary-slip-document" className="p-8 sm:p-10 space-y-6 text-slate-800 bg-white">
          {/* Letterhead (KOP SURAT RESMI) */}
          <div className="border-b-2 border-emerald-800 pb-4 text-center relative">
            <p className="text-sm font-serif italic text-emerald-900 font-semibold mb-0.5">
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shrink-0 print:border print:border-slate-300">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-emerald-950 uppercase">
                  PESANTREN BAITUL QUR'AN AL-IKHWAN
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Lembaga Pendidikan Islam, Tahfidzul Qur'an & Kepesantrenan Modern
                </p>
                <p className="text-[11px] text-slate-500">
                  Jl. Pesantren Al-Ikhwan No. 07, Bogor, Jawa Barat • Telp: (0251) 8345678
                </p>
              </div>
            </div>
            <div className="mt-3 inline-block bg-emerald-50 text-emerald-950 px-3.5 py-1 rounded-md border border-emerald-200/80 text-xs font-bold uppercase tracking-wider">
              SLIP GAJI & HONORARIUM MENGAJAR
            </div>
          </div>

          {/* Teacher & Period Meta Information */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-28 text-slate-500 font-medium">Nama Guru / Asatidz</span>
                <span className="font-semibold text-slate-900">: {teacher.name}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500 font-medium">Nomor Induk (NIP)</span>
                <span className="font-mono font-medium text-slate-800">: {teacher.nip}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500 font-medium">Jabatan / Amanah</span>
                <span className="font-medium text-slate-800">: {teacher.position}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-28 text-slate-500 font-medium">Periode Gaji</span>
                <span className="font-semibold text-emerald-800">: {payroll.period}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500 font-medium">Unit Penugasan</span>
                <span className="font-medium text-slate-800">: {teacher.unit}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500 font-medium">Tanggal Terbit</span>
                <span className="text-slate-800">
                  : {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Calculation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* A. PENERIMAAN (EARNINGS) */}
            <div className="border border-emerald-200/90 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-emerald-800 text-white font-semibold px-4 py-2 flex items-center justify-between">
                <span>A. PENERIMAAN (PENGHASILAN)</span>
                <span className="text-[10px] text-emerald-200">KREDIT</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">1. Gaji Pokok</p>
                    <p className="text-[10px] text-slate-400">Sesuai SK Penugasan Pesantren</p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatRupiah(payroll.baseSalary)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">2. Honor Jam Mengajar</p>
                    <p className="text-[10px] text-slate-500">
                      {payroll.totalTaughtHours} JP × {formatRupiah(payroll.hourlyRate)}
                      {payroll.totalBadalHours > 0 && ` (termasuk ${payroll.totalBadalHours} JP Badal)`}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatRupiah(payroll.teachingHonorarium)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">3. Uang Transport Harian</p>
                    <p className="text-[10px] text-slate-500">
                      {payroll.totalPresentDays} Hari Hadir × {formatRupiah(payroll.dailyTransport)}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatRupiah(payroll.totalTransport)}</span>
                </div>

                <div className="flex justify-between items-center pt-2 text-emerald-950 font-bold bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                  <span>Total Penerimaan Bruto</span>
                  <span className="text-sm font-bold text-emerald-900">{formatRupiah(payroll.grossSalary)}</span>
                </div>
              </div>
            </div>

            {/* B. POTONGAN (DEDUCTIONS) */}
            <div className="border border-rose-200/90 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-rose-900 text-white font-semibold px-4 py-2 flex items-center justify-between">
                <span>B. POTONGAN KEDISIPLINAN</span>
                <span className="text-[10px] text-rose-200">DEBET</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">1. Denda Keterlambatan</p>
                    <p className="text-[10px] text-slate-500">
                      {payroll.latePenaltyTotal > 0 ? 'Akumulasi menit terlambat' : 'Tidak ada keterlambatan'}
                    </p>
                  </div>
                  <span className={`font-semibold ${payroll.latePenaltyTotal > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                    {payroll.latePenaltyTotal > 0 ? `-${formatRupiah(payroll.latePenaltyTotal)}` : 'Rp 0'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">2. Denda Jurnal Kosong</p>
                    <p className="text-[10px] text-slate-500">
                      {payroll.emptyJournalCount > 0 ? `${payroll.emptyJournalCount} sesi × 50% honor` : 'Semua jurnal terisi'}
                    </p>
                  </div>
                  <span className={`font-semibold ${payroll.emptyJournalPenalty > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                    {payroll.emptyJournalPenalty > 0 ? `-${formatRupiah(payroll.emptyJournalPenalty)}` : 'Rp 0'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">3. Potongan Alpa / Tanpa Keterangan</p>
                    <p className="text-[10px] text-slate-500">
                      {payroll.alphaDays > 0 ? `${payroll.alphaDays} hari (Transport + Honor + 5% GP)` : 'Nihil'}
                    </p>
                  </div>
                  <span className={`font-semibold ${payroll.alphaPenalty > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                    {payroll.alphaPenalty > 0 ? `-${formatRupiah(payroll.alphaPenalty)}` : 'Rp 0'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 text-rose-950 font-bold bg-rose-50/70 p-2.5 rounded-lg border border-rose-100">
                  <span>Total Potongan</span>
                  <span className="text-sm font-bold text-rose-900">
                    {payroll.totalDeductions > 0 ? `-${formatRupiah(payroll.totalDeductions)}` : 'Rp 0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NET SALARY BOX */}
          <div className="bg-slate-900 text-white p-5 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
            <div>
              <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">
                GAJI BERSIH DITERIMA (TAKE HOME PAY)
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
                {formatRupiah(payroll.netSalary)}
              </div>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6 max-w-sm">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Terbilang:</span>
              <p className="text-xs font-semibold italic text-emerald-200">
                "{terbilang(payroll.netSalary)}"
              </p>
            </div>
          </div>

          {/* Signatures Area */}
          <div className="pt-6 border-t border-slate-200 text-xs">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-slate-500 mb-14">Mengetahui,<br /><strong className="text-slate-800">Kepala Pesantren</strong></p>
                <div className="border-t border-slate-300 pt-1 font-semibold text-slate-800">
                  Ust Cahyono
                </div>
                <p className="text-[10px] text-slate-400">NIP: PBQ-2018-003</p>
              </div>

              <div>
                <p className="text-slate-500 mb-14">Dibuat Oleh,<br /><strong className="text-slate-800">Bendahara / Operator</strong></p>
                <div className="border-t border-slate-300 pt-1 font-semibold text-slate-800">
                  Ust Akmal Yaqien
                </div>
                <p className="text-[10px] text-slate-400">NIP: PBQ-2020-007</p>
              </div>

              <div>
                <p className="text-slate-500 mb-14">Penerima,<br /><strong className="text-slate-800">Guru / Asatidz</strong></p>
                <div className="border-t border-slate-300 pt-1 font-semibold text-slate-800">
                  {teacher.name}
                </div>
                <p className="text-[10px] text-slate-400">NIP: {teacher.nip}</p>
              </div>
            </div>

            <div className="mt-8 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Dicetak secara otomatis melalui Sistem HRIS Pesantren Baitul Qur'an Al-Ikhwan</span>
              <span>Dokumen sah tanpa tanda tangan basah jika berstempel QR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
