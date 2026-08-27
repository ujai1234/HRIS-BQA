import { jsPDF } from 'jspdf';
import { LateCategory } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function formatIndonesianDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function calculateLatePenalty(
  actualClockIn: string, 
  scheduledStartTime: string,
  dailyTransport: number = 10000,
  sessionHours: number = 2,
  hourlyRate: number = 40000
): {
  lateMinutes: number;
  category: LateCategory;
  penalty: number;
} {
  const [actualH, actualM] = actualClockIn.split(':').map(Number);
  const [schedH, schedM] = scheduledStartTime.split(':').map(Number);

  const actualTotalMinutes = actualH * 60 + actualM;
  const schedTotalMinutes = schedH * 60 + schedM;

  const diffMinutes = Math.max(0, actualTotalMinutes - schedTotalMinutes);

  if (diffMinutes <= 4) {
    return {
      lateMinutes: diffMinutes,
      category: 'TEPAT_WAKTU',
      penalty: 0,
    };
  } else if (diffMinutes <= 15) {
    // Terlambat 5-15 menit: Potong Transport per hari
    return {
      lateMinutes: diffMinutes,
      category: 'TERLAMBAT_RINGAN',
      penalty: dailyTransport,
    };
  } else if (diffMinutes <= 30) {
    // Terlambat 16-30 menit: Potong (Transport per hari + 50% Honor)
    return {
      lateMinutes: diffMinutes,
      category: 'TERLAMBAT_SEDANG',
      penalty: dailyTransport + 0.5 * (sessionHours * hourlyRate),
    };
  } else {
    // Terlambat >30 menit: Dianggap Izin (Potong transport + honor penuh sesi)
    return {
      lateMinutes: diffMinutes,
      category: 'TERLAMBAT_BERAT',
      penalty: dailyTransport + (sessionHours * hourlyRate),
    };
  }
}

export function getLateCategoryLabel(category: LateCategory): { label: string; color: string; badge: string } {
  switch (category) {
    case 'TEPAT_WAKTU':
      return { label: 'Tepat Waktu (≤4 mnt)', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'TERLAMBAT_RINGAN':
      return { label: 'Terlambat Ringan (5-15 mnt)', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'TERLAMBAT_SEDANG':
      return { label: 'Terlambat Sedang (16-30 mnt)', color: 'text-orange-700', badge: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'TERLAMBAT_BERAT':
      return { label: 'Terlambat Berat (>30 mnt)', color: 'text-rose-700', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
}

export function terbilang(n: number): string {
  if (n < 0) return 'Minus ' + terbilang(Math.abs(n));
  if (n === 0) return 'Nol Rupiah';

  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function convert(num: number): string {
    if (num < 12) {
      return satuan[num];
    } else if (num < 20) {
      return convert(num - 10) + ' Belas';
    } else if (num < 100) {
      return convert(Math.floor(num / 10)) + ' Puluh ' + convert(num % 10);
    } else if (num < 200) {
      return 'Seratus ' + convert(num - 100);
    } else if (num < 1000) {
      return convert(Math.floor(num / 100)) + ' Ratus ' + convert(num % 100);
    } else if (num < 2000) {
      return 'Seribu ' + convert(num - 1000);
    } else if (num < 1000000) {
      return convert(Math.floor(num / 1000)) + ' Ribu ' + convert(num % 1000);
    } else if (num < 1000000000) {
      return convert(Math.floor(num / 1000000)) + ' Juta ' + convert(num % 1000000);
    } else if (num < 1000000000000) {
      return convert(Math.floor(num / 1000000000)) + ' Milyar ' + convert(num % 1000000000);
    }
    return '';
  }

  const result = convert(Math.floor(n)).trim().replace(/\s+/g, ' ');
  return result + ' Rupiah';
}

export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const csvContent = '\uFEFF' + rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Currency Input Parser & Formatter with strict Indonesian Rupiah validation
export function parseCurrencyInput(value: string | number): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : Math.max(0, Math.floor(value));
  }
  if (!value) return 0;
  // Remove all non-numeric characters except digits
  const cleanStr = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatCurrencyInput(value: number | string): string {
  const num = parseCurrencyInput(value);
  if (num === 0) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

export interface CurrencyValidationResult {
  isValid: boolean;
  message?: string;
  status: 'valid' | 'warning' | 'error';
}

export function validateCurrencyRate(
  amount: number,
  type: 'baseSalary' | 'hourlyRate' | 'dailyTransport'
): CurrencyValidationResult {
  if (isNaN(amount) || amount < 0) {
    return {
      isValid: false,
      message: 'Nominal tidak boleh negatif atau kosong',
      status: 'error',
    };
  }

  if (type === 'hourlyRate') {
    if (amount === 0) {
      return {
        isValid: false,
        message: 'Kafa\'ah per jam tidak boleh Rp 0 untuk guru aktif',
        status: 'error',
      };
    }
    if (amount < 25000) {
      return {
        isValid: true,
        message: 'Nominal di bawah standar rata-rata kafa\'ah per jam (min. Rp 25.000)',
        status: 'warning',
      };
    }
    if (amount > 150000) {
      return {
        isValid: true,
        message: 'Nominal melebihi batas wajar kafa\'ah guru (maks. Rp 150.000/JP)',
        status: 'warning',
      };
    }
    return {
      isValid: true,
      status: 'valid',
    };
  }

  if (type === 'baseSalary') {
    if (amount > 10000000) {
      return {
        isValid: true,
        message: 'Nominal gaji pokok melebihi batas standar pesantren (> Rp 10.000.000)',
        status: 'warning',
      };
    }
    return {
      isValid: true,
      status: 'valid',
    };
  }

  if (type === 'dailyTransport') {
    if (amount > 100000) {
      return {
        isValid: true,
        message: 'Uang transport harian lebih dari Rp 100.000/hari',
        status: 'warning',
      };
    }
    return {
      isValid: true,
      status: 'valid',
    };
  }

  return { isValid: true, status: 'valid' };
}

export interface PrintSlipData {
  teacherName: string;
  nip?: string;
  unit: string;
  position: string;
  bankName?: string;
  accountNumber?: string;
  period: string;
  isPrivacyMode?: boolean;
}

export function printSalarySlipDocument(data: PrintSlipData): void {
  const {
    teacherName,
    nip = 'BQ-008',
    unit,
    position,
    bankName = 'BSI (Bank Syariah Indonesia)',
    accountNumber = '7123-4567-89',
    period,
    isPrivacyMode = false
  } = data;

  const mask = (val: string) => isPrivacyMode ? '••••••••' : val;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const currentDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // 1. Draw outer border card
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.rect(10, 10, 190, 235); // outer card wrapper

  // 2. Header logo box
  doc.setFillColor(27, 67, 50); // Deep green #1B4332
  doc.rect(15, 15, 16, 16, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BQA', 23, 25, { align: 'center' });

  // Header Titles
  doc.setTextColor(176, 137, 104); // #B08968 (warm accent)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("YAYASAN BAITUL QUR'AN AL-IKHWAN", 36, 20);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text("Tanda Bukti Penerimaan Kafa'ah Asatidz", 36, 26);

  // Meta info (Right side)
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("Periode & ID Dokumen", 195, 20, { align: "right" });

  doc.setTextColor(27, 67, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`${period} • SLP-${period.replace(' ', '-').toUpperCase()}-${nip}`, 195, 26, { align: "right" });

  // Divider Line
  doc.setDrawColor(27, 67, 50);
  doc.setLineWidth(0.8);
  doc.line(15, 36, 195, 36);

  // 3. Teacher Info Box
  doc.setFillColor(250, 250, 249); // stone-50
  doc.setDrawColor(231, 229, 228); // stone-200
  doc.setLineWidth(0.3);
  doc.rect(15, 41, 180, 25, 'FD');

  // Field: Nama Asatidz
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108); // stone-500
  doc.text("Nama Asatidz", 20, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(teacherName, 20, 53);

  // Field: NIP & Unit
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text("NIP & Unit", 65, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${nip} • ${unit}`, 65, 53);

  // Field: Jabatan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text("Jabatan", 110, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(position, 110, 53);

  // Field: Rekening
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text("Rekening Penyaluran", 150, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${bankName.split(' ')[0]} - ${accountNumber}`, 150, 53);

  // 4. Ledger (Two Columns: Income vs Deductions)
  // Left Column: Income
  doc.setDrawColor(214, 211, 209); // stone-300
  doc.setLineWidth(0.6);
  doc.line(15, 78, 95, 78);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 67, 50);
  doc.text("A. Pendapatan", 15, 74);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text("Jumlah", 95, 74, { align: 'right' });

  // Rows Left:
  // Row 1: Gaji Pokok
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(64, 64, 64);
  doc.text("Gaji Pokok", 15, 85);
  doc.setFont('courier', 'bold');
  doc.text(mask("Rp 700.000"), 95, 85, { align: 'right' });

  // Row 2: Honor Mengajar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(64, 64, 64);
  doc.text("Honor Mengajar", 15, 93);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 113, 108);
  doc.text("16 JP x Rp 40.000", 15, 96.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(64, 64, 64);
  doc.text(mask("Rp 640.000"), 95, 93, { align: 'right' });

  // Row 3: Uang Transport
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(64, 64, 64);
  doc.text("Uang Transport", 15, 104);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 113, 108);
  doc.text("16 Hari x Rp 10.000", 15, 107.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(64, 64, 64);
  doc.text(mask("Rp 160.000"), 95, 104, { align: 'right' });

  // Divider Left subtotal
  doc.setDrawColor(231, 229, 228);
  doc.setLineWidth(0.3);
  doc.line(15, 114, 95, 114);

  // Subtotal Income
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 67, 50);
  doc.text("Total Pendapatan", 15, 120);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text(mask("Rp 1.500.000"), 95, 120, { align: 'right' });


  // Right Column: Deductions
  doc.setDrawColor(214, 211, 209);
  doc.setLineWidth(0.6);
  doc.line(115, 78, 195, 78);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(176, 137, 104);
  doc.text("B. Potongan", 115, 74);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text("Jumlah", 195, 74, { align: 'right' });

  // Rows Right:
  // Row 1: Denda Keterlambatan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(64, 64, 64);
  doc.text("Denda Keterlambatan", 115, 85);
  doc.setFont('courier', 'bold');
  doc.setTextColor(190, 18, 60); // rose-700
  doc.text(mask("-Rp 90.000"), 195, 85, { align: 'right' });

  // Row 2: Penalti Jurnal Kosong
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(64, 64, 64);
  doc.text("Penalti Jurnal Kosong", 115, 93);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 113, 108);
  doc.text("1 sesi belum terisi", 115, 96.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(190, 18, 60);
  doc.text(mask("-Rp 40.000"), 195, 93, { align: 'right' });

  // Row 3: Potongan Izin / Sakit
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(64, 64, 64);
  doc.text("Potongan Izin / Sakit", 115, 104);
  doc.setFont('courier', 'normal');
  doc.setTextColor(120, 113, 108);
  doc.text(mask("Rp 0"), 195, 104, { align: 'right' });

  // Row 4: Potongan Alpa
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(64, 64, 64);
  doc.text("Potongan Alpa", 115, 112);
  doc.setFont('courier', 'normal');
  doc.text(mask("Rp 0"), 195, 112, { align: 'right' });

  // Divider Right subtotal
  doc.setDrawColor(231, 229, 228);
  doc.setLineWidth(0.3);
  doc.line(115, 116, 195, 116);

  // Subtotal Deduction
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(190, 18, 60);
  doc.text("Total Potongan", 115, 121);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text(mask("-Rp 130.000"), 195, 121, { align: 'right' });


  // 5. Summary dark green bar (THP)
  doc.setFillColor(27, 67, 50);
  doc.rect(15, 131, 180, 23, 'F');

  // THP labels (White and Cream)
  doc.setTextColor(212, 163, 115); // #d4a373 (cream/brown accent)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("TOTAL KAFA'AH DITERIMA (TAKE HOME PAY)", 20, 137);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text(isPrivacyMode ? 'Nominal Dirahasiakan' : 'Terbilang: "Satu Juta Tiga Ratus Tujuh Puluh Ribu Rupiah"', 20, 143);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text("Status: Telah Ditransfer ke Rekening", 20, 148);

  // THP Amount large (white)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(mask("Rp 1.370.000"), 190, 145, { align: 'right' });


  // 6. Signature Sections
  doc.setDrawColor(231, 229, 228);
  doc.setLineWidth(0.3);
  doc.line(15, 162, 195, 162);

  // Signature Left (Bendahara)
  doc.setTextColor(120, 113, 108);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("Diverifikasi oleh,", 55, 170, { align: 'center' });
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Bendahara HRD Pesantren", 55, 174, { align: 'center' });
  
  doc.setTextColor(27, 67, 50);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.text("[ Ttd & Cap Digital ]", 55, 190, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("Ust. Ahmad Syahid, M.Pd.", 55, 202, { align: 'center' });
  doc.setTextColor(120, 113, 108);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("NIP: BQA-2021-003", 55, 206, { align: 'center' });


  // Signature Right (Penerima)
  doc.setTextColor(120, 113, 108);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("Penerima Kafa'ah,", 155, 170, { align: 'center' });
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Asatidz yang bersangkutan", 155, 174, { align: 'center' });
  
  doc.setTextColor(27, 67, 50);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.text("[ Ttd Penerima ]", 155, 190, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(teacherName, 155, 202, { align: 'center' });
  doc.setTextColor(120, 113, 108);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP: ${nip}`, 155, 206, { align: 'center' });


  // 7. Footer Bottom Line
  doc.setDrawColor(231, 229, 228);
  doc.setLineWidth(0.3);
  doc.line(15, 218, 195, 218);

  doc.setTextColor(120, 113, 108);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`✓ Dokumen Digital Terverifikasi HRIS Pesantren Baitul Qur'an Al-Ikhwan • Dicetak ${currentDate}`, 15, 224);
  doc.text(`Penerima: ${teacherName} | Bendahara: Ust. Ahmad Syahid, M.Pd.`, 195, 224, { align: 'right' });


  // Save & Download!
  const safeName = teacherName.replace(/\s+/g, '_').toLowerCase();
  const safePeriod = period.replace(/\s+/g, '_').toLowerCase();
  doc.save(`slip_kafaah_${safeName}_${safePeriod}.pdf`);
}

