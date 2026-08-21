import React, { useState } from 'react';
import { 
  CreditCard, 
  Printer, 
  Search, 
  Calendar, 
  Building2, 
  User, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { SalarySlipModal } from './SalarySlipModal';
import { formatRupiah, terbilang } from '../utils/formatters';

export const SlipGajiView: React.FC = () => {
  const { 
    teachers, 
    currentUser, 
    currentRole, 
    selectedPeriod, 
    setSelectedPeriod,
    calculateTeacherPayroll 
  } = useHRIS();

  // If role is GURU, default to themselves. If ADMIN/KEPSEK, can select any of the 23 teachers!
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(currentUser.id);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const selectedTeacherPayroll = calculateTeacherPayroll(selectedTeacherId, selectedPeriod);
  const targetTeacher = selectedTeacherPayroll.teacher;

  return (
    <div className="space-y-6">
      {/* Header & Teacher Picker */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
              Dokumen Resmi Penggajian
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Pesantren Baitul Qur'an Al-Ikhwan
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Slip Gaji Asatidz & Guru</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rincian penerimaan Gaji Pokok, Honor Mengajar, Uang Transport, serta potongan kedisiplinan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Select Teacher */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold">
            <User className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-500">Pilih Guru:</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-semibold text-slate-800 max-w-[160px] truncate"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.position})
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold">
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
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Embedded Live Slip Gaji Preview Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-10 max-w-4xl mx-auto space-y-6">
        {/* Letterhead */}
        <div className="border-b-2 border-emerald-800 pb-4 text-center">
          <p className="text-sm font-serif italic text-emerald-900 font-semibold mb-0.5">
            بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shrink-0">
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

        {/* Teacher Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-28 text-slate-500 font-medium">Nama Guru</span>
              <span className="font-semibold text-slate-900">: {targetTeacher.name}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500 font-medium">Nomor Induk (NIP)</span>
              <span className="font-mono font-medium text-slate-800">: {targetTeacher.nip}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500 font-medium">Jabatan</span>
              <span className="font-medium text-slate-800">: {targetTeacher.position}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-28 text-slate-500 font-medium">Periode</span>
              <span className="font-semibold text-emerald-800">: {selectedTeacherPayroll.period}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500 font-medium">Unit</span>
              <span className="font-medium text-slate-800">: {targetTeacher.unit}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500 font-medium">Tanggal Terbit</span>
              <span className="text-slate-800">
                : {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Earnings */}
          <div className="border border-emerald-200/90 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-emerald-800 text-white font-semibold text-xs px-4 py-2 flex items-center justify-between">
              <span>A. PENERIMAAN (PENGHASILAN)</span>
              <span className="text-[10px] text-emerald-200">KREDIT</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">1. Gaji Pokok</p>
                  <p className="text-[10px] text-slate-400">Sesuai SK Penugasan Pesantren</p>
                </div>
                <span className="font-semibold text-slate-900">{formatRupiah(selectedTeacherPayroll.baseSalary)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">2. Honor Jam Mengajar</p>
                  <p className="text-[10px] text-slate-500">
                    {selectedTeacherPayroll.totalTaughtHours} JP × {formatRupiah(selectedTeacherPayroll.hourlyRate)}
                    {selectedTeacherPayroll.totalBadalHours > 0 && ` (termasuk ${selectedTeacherPayroll.totalBadalHours} JP Badal)`}
                  </p>
                </div>
                <span className="font-semibold text-slate-900">{formatRupiah(selectedTeacherPayroll.teachingHonorarium)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">3. Uang Transport Harian</p>
                  <p className="text-[10px] text-slate-500">
                    {selectedTeacherPayroll.totalPresentDays} Hari Hadir × {formatRupiah(selectedTeacherPayroll.dailyTransport)}
                  </p>
                </div>
                <span className="font-semibold text-slate-900">{formatRupiah(selectedTeacherPayroll.totalTransport)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 text-emerald-950 font-bold bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                <span>Total Penerimaan Bruto</span>
                <span className="text-sm font-bold text-emerald-900">{formatRupiah(selectedTeacherPayroll.grossSalary)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-rose-200/90 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-rose-900 text-white font-semibold text-xs px-4 py-2 flex items-center justify-between">
              <span>B. POTONGAN KEDISIPLINAN</span>
              <span className="text-[10px] text-rose-200">DEBET</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">1. Denda Keterlambatan</p>
                  <p className="text-[10px] text-slate-500">
                    {selectedTeacherPayroll.latePenaltyTotal > 0 ? 'Akumulasi menit terlambat' : 'Tidak ada keterlambatan'}
                  </p>
                </div>
                <span className={`font-semibold ${selectedTeacherPayroll.latePenaltyTotal > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {selectedTeacherPayroll.latePenaltyTotal > 0 ? `-${formatRupiah(selectedTeacherPayroll.latePenaltyTotal)}` : 'Rp 0'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">2. Denda Jurnal Kosong</p>
                  <p className="text-[10px] text-slate-500">
                    {selectedTeacherPayroll.emptyJournalCount > 0 ? `${selectedTeacherPayroll.emptyJournalCount} sesi × 50% honor` : 'Semua jurnal terisi'}
                  </p>
                </div>
                <span className={`font-semibold ${selectedTeacherPayroll.emptyJournalPenalty > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {selectedTeacherPayroll.emptyJournalPenalty > 0 ? `-${formatRupiah(selectedTeacherPayroll.emptyJournalPenalty)}` : 'Rp 0'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">3. Potongan Alpa</p>
                  <p className="text-[10px] text-slate-500">
                    {selectedTeacherPayroll.alphaDays > 0 ? `${selectedTeacherPayroll.alphaDays} hari (Transport + Honor + 5% GP)` : 'Nihil'}
                  </p>
                </div>
                <span className={`font-semibold ${selectedTeacherPayroll.alphaPenalty > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {selectedTeacherPayroll.alphaPenalty > 0 ? `-${formatRupiah(selectedTeacherPayroll.alphaPenalty)}` : 'Rp 0'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 text-rose-950 font-bold bg-rose-50/70 p-2.5 rounded-lg border border-rose-100">
                <span>Total Potongan</span>
                <span className="text-sm font-bold text-rose-900">
                  {selectedTeacherPayroll.totalDeductions > 0 ? `-${formatRupiah(selectedTeacherPayroll.totalDeductions)}` : 'Rp 0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Take Home Pay */}
        <div className="bg-slate-900 text-white p-5 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
          <div>
            <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">
              GAJI BERSIH DITERIMA (TAKE HOME PAY)
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
              {formatRupiah(selectedTeacherPayroll.netSalary)}
            </div>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6 max-w-sm">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Terbilang:</span>
            <p className="text-xs font-semibold italic text-emerald-200">
              "{terbilang(selectedTeacherPayroll.netSalary)}"
            </p>
          </div>
        </div>

        {/* Signatures */}
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
                {targetTeacher.name}
              </div>
              <p className="text-[10px] text-slate-400">NIP: {targetTeacher.nip}</p>
            </div>
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
