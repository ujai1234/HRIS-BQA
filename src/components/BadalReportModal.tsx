import React, { useEffect, useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { BadalAssignment, ClassSchedule, Teacher, UnitType } from '../types';
import { formatIndonesianDate, formatRupiah } from '../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface BadalReportModalProps {
  badalList: BadalAssignment[];
  schedules: ClassSchedule[];
  teachers: Teacher[];
  selectedUnit: string;
  userUnit: string;
  onClose: () => void;
}

export const BadalReportModal: React.FC<BadalReportModalProps> = ({
  badalList,
  schedules,
  teachers,
  selectedUnit,
  userUnit,
  onClose
}) => {
  const [docNumber] = useState(
    `BQ/BADAL/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/019`
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const totalJP = badalList.reduce((sum, b) => {
    const sched = schedules.find((s) => s.id === b.scheduleId);
    return sum + (sched ? sched.hours : 2);
  }, 0);

  const totalHonor = badalList.reduce((sum, b) => {
    const sched = schedules.find((s) => s.id === b.scheduleId);
    const badalTeacher = teachers.find((t) => t.id === b.badalTeacherId);
    const jp = sched ? sched.hours : 2;
    const rate = badalTeacher ? badalTeacher.hourlyRate : 40000;
    return sum + jp * rate;
  }, 0);

  const scopeTitle =
    selectedUnit === 'ALL'
      ? 'Seluruh Unit (SMP, MA, Pesantren)'
      : `Unit ${selectedUnit === 'PESANTREN' ? 'Pesantren' : selectedUnit}`;

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Clean Official Kop Surat (Header)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("PONDOK PESANTREN BAITUL QUR'AN AL-IKHWAN", 14, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Lembaga Pendidikan Islam & Tahfiz Quran • SMP IT • MA • Pesantren", 14, 21);
      doc.text("Jl. Sungai Kendal No.21, RT.8/RW.5, Marunda, Cilincing, Jakarta Utara 14150", 14, 26);
      doc.text("Hotline: 0858-8302-2643 / 0812-8294-9922 • Email: sekretariat@bqa.sch.id", 14, 31);

      // Separator double line
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.8);
      doc.line(14, 35, 196, 35);
      doc.setLineWidth(0.2);
      doc.line(14, 36.2, 196, 36.2);

      // 2. Document Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("REKAPITULASI PENUGASAN GURU BADAL & KAFA'AH", 105, 43, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Nomor: ${docNumber}`, 105, 48, { align: 'center' });

      // 3. Metadata Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 52, 182, 14, 1.5, 1.5, 'FD');

      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Tanggal Cetak: ${todayStr}`, 18, 57);
      doc.text(`Lingkup Unit: ${scopeTitle}`, 110, 57);
      doc.text(`Total Penugasan: ${badalList.length} Sesi (${totalJP} JP)`, 18, 62);
      doc.text(`Total Kafa'ah Badal: ${formatRupiah(totalHonor)}`, 110, 62);

      // 4. Data Table
      const tableRows = badalList.map((b, idx) => {
        const sched = schedules.find((s) => s.id === b.scheduleId);
        const origTeacher = teachers.find((t) => t.id === b.originalTeacherId);
        const badalTeacher = teachers.find((t) => t.id === b.badalTeacherId);
        const jp = sched ? sched.hours : 2;
        const rate = badalTeacher ? badalTeacher.hourlyRate : 40000;

        return [
          String(idx + 1),
          formatIndonesianDate(b.date),
          sched?.unit || '-',
          `${sched?.subject || 'KBM'} (${sched?.className || '-'})`,
          origTeacher?.name || '-',
          badalTeacher?.name || '-',
          b.reason || '-',
          `${jp} JP`,
          formatRupiah(jp * rate),
          b.status === 'COMPLETED' ? 'Selesai' : b.status === 'APPROVED' ? 'Disetujui' : 'Menunggu'
        ];
      });

      autoTable(doc, {
        startY: 70,
        head: [['No', 'Tanggal', 'Unit', 'Mapel & Kelas', 'Guru Utama', 'Guru Badal', 'Alasan', 'JP', 'Kafa’ah', 'Status']],
        body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'Tidak ada data penugasan badal', '-', '-', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: {
          fillColor: [27, 67, 50],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 2.5
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59],
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 18 },
          2: { cellWidth: 12 },
          3: { cellWidth: 32 },
          4: { cellWidth: 28 },
          5: { cellWidth: 28 },
          6: { cellWidth: 20 },
          7: { cellWidth: 11, halign: 'center' },
          8: { cellWidth: 20, halign: 'right' },
          9: { cellWidth: 16 }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Halaman ${data.pageNumber} dari ${pageCount} • Baitul Qur'an HRIS`,
            14,
            doc.internal.pageSize.height - 10
          );
        }
      });

      // 5. Signatures
      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 180;
      if (finalY < 240) {
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Jakarta Utara, ${todayStr}`, 140, finalY);

        doc.text('Mengetahui,', 24, finalY + 6);
        doc.text('Kepala Unit / Mudir', 24, finalY + 10);
        doc.line(24, finalY + 30, 65, finalY + 30);
        doc.text('Ust. H. Ahmad Dahlan, Lc.', 24, finalY + 34);
        doc.setFontSize(7);
        doc.text('NIP. BQA-DIR-001', 24, finalY + 38);

        doc.setFontSize(8);
        doc.text('Penanggung Jawab KBM / Badal,', 130, finalY + 6);
        doc.text('Bagian Kurikulum', 130, finalY + 10);
        doc.line(130, finalY + 30, 180, finalY + 30);
        doc.text('Ust. Muhammad Faiz, S.Pd.I', 130, finalY + 34);
        doc.setFontSize(7);
        doc.text('NIP. BQA-KUR-003', 130, finalY + 38);
      }

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`Laporan_Guru_Badal_${selectedUnit}_${fileDate}.pdf`);
      toast.success('Laporan Guru Badal berhasil diunduh dalam format PDF');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh laporan PDF');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Printable Style definition */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #badal-report-paper, #badal-report-paper * {
            visibility: visible !important;
          }
          #badal-report-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 1.2cm !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      <div className="bg-stone-900 border border-stone-800 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Control Bar */}
        <div className="px-4 py-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-3 text-stone-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white tracking-wide">
              Pratinjau Dokumen Rekapitulasi Guru Badal
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Area */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-stone-950/40">
          <div
            id="badal-report-paper"
            className="bg-white text-stone-900 rounded-lg p-6 sm:p-10 shadow-lg max-w-3xl mx-auto space-y-5 text-xs font-serif"
          >
            {/* 1. Official Letterhead (KOP SURAT) */}
            <div className="border-b-2 border-stone-900 pb-3 font-sans">
              <div className="flex items-center justify-between gap-4">
                <div className="w-14 h-14 rounded-lg bg-stone-900 text-white flex items-center justify-center font-extrabold text-xl shrink-0">
                  BQA
                </div>
                <div className="text-center flex-1 space-y-0.5">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
                    Yayasan Al-Ikhwan Mandiri Sejahtera
                  </p>
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-stone-950 uppercase leading-none">
                    PONDOK PESANTREN BAITUL QUR'AN AL-IKHWAN
                  </h1>
                  <p className="text-[11px] font-semibold text-stone-700">
                    Lembaga Pendidikan Islam & Tahfiz Quran • SMP IT • MA • Pesantren
                  </p>
                  <p className="text-[10px] text-stone-500 font-medium">
                    Jl. Sungai Kendal No.21, RT.8/RW.5, Marunda, Cilincing, Jakarta Utara 14150
                  </p>
                  <p className="text-[9px] text-stone-400 font-mono">
                    Hotline: 0858-8302-2643 / 0812-8294-9922 • Email: sekretariat@bqa.sch.id
                  </p>
                </div>
                <div className="w-14 text-right hidden sm:block">
                  <span className="text-[8px] font-bold text-stone-900 block uppercase">Jakarta Utara</span>
                  <span className="text-[8px] font-mono text-stone-400 block">NSPP: 510032</span>
                </div>
              </div>
              <div className="mt-2 border-t border-stone-300" />
            </div>

            {/* 2. Document Title */}
            <div className="text-center font-sans space-y-1 pt-1">
              <h2 className="text-sm sm:text-base font-bold text-stone-950 underline underline-offset-4 uppercase tracking-wide">
                LAPORAN REKAPITULASI PENUGASAN GURU BADAL
              </h2>
              <div className="flex items-center justify-center gap-2 text-xs text-stone-500 font-mono pt-1">
                <span>Nomor: <strong>{docNumber}</strong></span>
                <span>•</span>
                <span>{scopeTitle}</span>
              </div>
            </div>

            {/* 3. Summary Metadata Box */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs font-sans grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-stone-500 block">Tanggal Dokumen</span>
                <span className="font-medium text-stone-900">{todayStr}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">Lingkup Satuan</span>
                <span className="font-medium text-stone-900">{scopeTitle}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">Total Sesi & Jam</span>
                <span className="font-semibold text-stone-900 font-mono">
                  {badalList.length} Sesi ({totalJP} JP)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">Total Kafa'ah Badal</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {formatRupiah(totalHonor)}
                </span>
              </div>
            </div>

            {/* 4. Structured Table */}
            <div className="font-sans overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse border border-stone-300">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-300 text-[10px] uppercase">
                    <th className="p-2 border-r border-stone-300 text-center w-8">No</th>
                    <th className="p-2 border-r border-stone-300">Tanggal</th>
                    <th className="p-2 border-r border-stone-300">Unit</th>
                    <th className="p-2 border-r border-stone-300">Mapel & Kelas</th>
                    <th className="p-2 border-r border-stone-300">Guru Utama</th>
                    <th className="p-2 border-r border-stone-300">Guru Badal</th>
                    <th className="p-2 border-r border-stone-300 text-center">JP</th>
                    <th className="p-2 border-r border-stone-300 text-right">Kafa'ah</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {badalList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-stone-400 italic">
                        Tidak ada penugasan guru badal pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    badalList.map((b, idx) => {
                      const sched = schedules.find((s) => s.id === b.scheduleId);
                      const origTeacher = teachers.find((t) => t.id === b.originalTeacherId);
                      const badalTeacher = teachers.find((t) => t.id === b.badalTeacherId);
                      const jp = sched ? sched.hours : 2;
                      const rate = badalTeacher ? badalTeacher.hourlyRate : 40000;

                      return (
                        <tr key={b.id} className={idx % 2 === 1 ? 'bg-stone-50/50' : 'bg-white'}>
                          <td className="p-2 border-r border-stone-200 text-center text-stone-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-r border-stone-200 whitespace-nowrap">
                            {formatIndonesianDate(b.date)}
                          </td>
                          <td className="p-2 border-r border-stone-200 font-medium">
                            {sched?.unit || '-'}
                          </td>
                          <td className="p-2 border-r border-stone-200">
                            <span className="font-semibold text-stone-900 block">
                              {sched?.subject || 'KBM'}
                            </span>
                            <span className="text-[10px] text-stone-500">{sched?.className}</span>
                          </td>
                          <td className="p-2 border-r border-stone-200 text-stone-700">
                            {origTeacher?.name || '-'}
                          </td>
                          <td className="p-2 border-r border-stone-200 font-medium text-stone-900">
                            {badalTeacher?.name || '-'}
                          </td>
                          <td className="p-2 border-r border-stone-200 text-center font-mono font-medium">
                            {jp} JP
                          </td>
                          <td className="p-2 border-r border-stone-200 text-right font-mono font-semibold text-emerald-800">
                            {formatRupiah(jp * rate)}
                          </td>
                          <td className="p-2 text-center font-medium">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                b.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'APPROVED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {b.status === 'COMPLETED'
                                ? 'Selesai'
                                : b.status === 'APPROVED'
                                ? 'Disetujui'
                                : 'Menunggu'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-100 font-bold text-stone-900 border-t-2 border-stone-300">
                    <td colSpan={6} className="p-2 border-r border-stone-300 text-right">
                      Total Akumulasi
                    </td>
                    <td className="p-2 border-r border-stone-300 text-center font-mono">
                      {totalJP} JP
                    </td>
                    <td className="p-2 border-r border-stone-300 text-right font-mono text-emerald-800">
                      {formatRupiah(totalHonor)}
                    </td>
                    <td className="p-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 5. Official Signatures Block */}
            <div className="pt-6 font-sans">
              <div className="grid grid-cols-2 gap-8 text-center text-xs text-stone-800">
                <div className="space-y-12">
                  <p className="font-semibold text-stone-700">
                    Mengetahui,<br />Kepala Unit / Mudir
                  </p>
                  <div className="space-y-0.5">
                    <p className="font-bold underline text-stone-900">
                      Ust. H. Ahmad Dahlan, Lc.
                    </p>
                    <p className="text-[10px] text-stone-500 font-mono">NIP. BQA-DIR-001</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <p className="font-semibold text-stone-700">
                    Jakarta Utara, {todayStr}<br />Penanggung Jawab Kurikulum / Badal
                  </p>
                  <div className="space-y-0.5">
                    <p className="font-bold underline text-stone-900">
                      Ust. Muhammad Faiz, S.Pd.I
                    </p>
                    <p className="text-[10px] text-stone-500 font-mono">NIP. BQA-KUR-003</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
