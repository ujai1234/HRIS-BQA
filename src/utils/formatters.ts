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

export type ScheduleTimeStatus = 'OPEN' | 'NOT_TODAY' | 'TOO_EARLY' | 'EXPIRED';

export interface ScheduleTimeValidation {
  status: ScheduleTimeStatus;
  canClockIn: boolean;
  message: string;
  allowedStartTime: string;
  allowedEndTime: string;
  minutesDiff?: number;
}

export function getTodayIndonesianDayName(dateObj: Date = new Date()): string {
  const dayIndex = dateObj.getDay();
  const map: Record<number, string> = {
    0: 'Ahad',
    1: 'Senin',
    2: 'Selasa',
    3: 'Rabu',
    4: 'Kamis',
    5: 'Jumat',
    6: 'Sabtu',
  };
  return map[dayIndex] || 'Senin';
}

/**
 * Validates if the current time and day are within the designated schedule time window.
 * Buffer: 15 minutes before startTime up to endTime.
 */
export function validateScheduleTimeWindow(
  schedule: { dayOfWeek: string; startTime: string; endTime: string },
  currentTimeStr?: string,
  referenceDate: Date = new Date()
): ScheduleTimeValidation {
  const currentDayName = getTodayIndonesianDayName(referenceDate);

  // Normalize comparison for Ahad / Minggu
  const schedDay = schedule.dayOfWeek === 'Minggu' ? 'Ahad' : schedule.dayOfWeek;
  const todayDay = currentDayName === 'Minggu' ? 'Ahad' : currentDayName;

  // 1. Day of week check
  if (schedDay !== todayDay) {
    return {
      status: 'NOT_TODAY',
      canClockIn: false,
      message: `Jadwal hari ${schedule.dayOfWeek}. Hanya dapat diabsen pada hari ${schedule.dayOfWeek}.`,
      allowedStartTime: schedule.startTime,
      allowedEndTime: schedule.endTime,
    };
  }

  // 2. Parse schedule start and end time
  const [schedStartH, schedStartM] = schedule.startTime.split(':').map(Number);
  const [schedEndH, schedEndM] = schedule.endTime.split(':').map(Number);

  const schedStartMinutes = schedStartH * 60 + schedStartM;
  const schedEndMinutes = schedEndH * 60 + schedEndM;

  // Allowed early window: 15 minutes before start
  const earlyBufferMinutes = 15;
  const allowedStartMinutes = Math.max(0, schedStartMinutes - earlyBufferMinutes);

  const allowedStartH = Math.floor(allowedStartMinutes / 60);
  const allowedStartM = allowedStartMinutes % 60;
  const allowedStartTimeStr = `${String(allowedStartH).padStart(2, '0')}:${String(allowedStartM).padStart(2, '0')}`;

  // 3. Parse current time
  let currentTotalMinutes: number;
  if (currentTimeStr) {
    const [curH, curM] = currentTimeStr.split(':').map(Number);
    currentTotalMinutes = curH * 60 + curM;
  } else {
    currentTotalMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  }

  // Check if too early
  if (currentTotalMinutes < allowedStartMinutes) {
    const minutesLeft = allowedStartMinutes - currentTotalMinutes;
    return {
      status: 'TOO_EARLY',
      canClockIn: false,
      message: `Belum masuk waktu absensi. Dibuka pukul ${allowedStartTimeStr} WIB (${minutesLeft} menit lagi).`,
      allowedStartTime: allowedStartTimeStr,
      allowedEndTime: schedule.endTime,
      minutesDiff: minutesLeft,
    };
  }

  // Check if expired / passed session end time
  if (currentTotalMinutes > schedEndMinutes) {
    const minutesPassed = currentTotalMinutes - schedEndMinutes;
    return {
      status: 'EXPIRED',
      canClockIn: false,
      message: `Waktu absensi telah berakhir (Sesi KBM selesai pukul ${schedule.endTime} WIB).`,
      allowedStartTime: allowedStartTimeStr,
      allowedEndTime: schedule.endTime,
      minutesDiff: minutesPassed,
    };
  }

  // Valid and open
  return {
    status: 'OPEN',
    canClockIn: true,
    message: `Waktu absensi aktif (${schedule.startTime} - ${schedule.endTime} WIB).`,
    allowedStartTime: allowedStartTimeStr,
    allowedEndTime: schedule.endTime,
  };
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
  baseSalary?: number;
  totalTaughtHours?: number;
  hourlyRate?: number;
  teachingHonorarium?: number;
  totalPresentDays?: number;
  dailyTransportRate?: number;
  totalTransport?: number;
  totalBadalHours?: number;
  badalHonorarium?: number;
  latePenaltyTotal?: number;
  emptyJournalPenalty?: number;
  alphaPenalty?: number;
  otherDeductions?: number;
  totalDeductions?: number;
  netSalary?: number;
}

export function generateSalarySlipPDF(data: PrintSlipData): jsPDF {
  const {
    teacherName,
    nip = 'BQA-008',
    unit = 'SMP',
    position = 'Guru Pengampu',
    bankName = 'BSI (Bank Syariah Indonesia)',
    accountNumber = '7123-4567-89',
    period,
    isPrivacyMode = false,
    baseSalary = 700000,
    totalTaughtHours = 16,
    hourlyRate = 40000,
    teachingHonorarium = 640000,
    totalPresentDays = 16,
    dailyTransportRate = 10000,
    totalTransport = 160000,
    totalBadalHours = 0,
    badalHonorarium = 0,
    latePenaltyTotal = 90000,
    emptyJournalPenalty = 40000,
    alphaPenalty = 0,
    otherDeductions = 0,
    totalDeductions = 130000,
    netSalary = 1370000,
  } = data;

  const mask = (val: string) => isPrivacyMode ? '••••••••' : val;
  const maskNumber = (num: number) => isPrivacyMode ? '••••••••' : formatRupiah(num);

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

  const cleanPeriodId = period.replace(/\s+/g, '-').toUpperCase();
  const docSlipId = `SLP-${cleanPeriodId}-${nip.replace(/[^A-Za-z0-9]/g, '')}`;

  // 1. Draw outer border card & background accent
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.rect(12, 12, 186, 260); // outer card wrapper

  // 2. Official Header Text (Centered, Logo and Code Slip Badge removed as requested)
  // Header Title & Yayasan
  doc.setTextColor(176, 137, 104); // #B08968 (warm accent)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("YAYASAN BAITUL QUR'AN AL-IKHWAN", 105, 21, { align: 'center' });

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("PONDOK PESANTREN BAITUL QUR'AN AL-IKHWAN", 105, 26.5, { align: 'center' });

  // Address lines (Clean spacing with no overlap)
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text("Jl. Sungai Kendal No.21, RT.8/RW.5, Marunda, Cilincing, Kota Jakarta Utara 14150", 105, 31, { align: 'center' });
  
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(7);
  doc.text("Hotline: 0858-8302-2643 • Email: sekretariat@bqa.sch.id • NSPP: 510032", 105, 35, { align: 'center' });

  // Double Divider Line (Header separation)
  doc.setDrawColor(27, 67, 50);
  doc.setLineWidth(0.6);
  doc.line(18, 39, 192, 39);
  doc.setDrawColor(176, 137, 104);
  doc.setLineWidth(0.2);
  doc.line(18, 40.5, 192, 40.5);

  // 3. Document Title Section
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("TANDA BUKTI PENERIMAAN KAFA'AH ASATIDZ", 105, 47, { align: "center" });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Periode KBM: ${period} • Unit: ${unit}`, 105, 51.5, { align: "center" });

  // 4. Teacher Profile Info Box (Clean 4-column layout)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(18, 55, 174, 22, 1.5, 1.5, 'FD');

  // Col 1: Nama Asatidz
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Nama Asatidz", 22, 60.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(teacherName, 22, 66);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP: ${nip}`, 22, 71);

  // Col 2: Unit & Jabatan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Unit & Penugasan", 72, 60.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(unit, 72, 66);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(position, 72, 71);

  // Col 3: Beban Mengajar & Kehadiran
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Beban Jam & Kehadiran", 116, 60.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalTaughtHours} JP Terlaksana`, 116, 66);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`${totalPresentDays} Hari Hadir Bertugas`, 116, 71);

  // Col 4: Rekening Penyaluran
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Rekening Penyaluran", 154, 60.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(bankName.split(' ')[0] || 'BSI', 154, 66);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(accountNumber, 154, 71);

  // 5. Ledger Breakdown (2 Columns: Income vs Deductions)
  // Left Column Header: A. Pendapatan / Hak Kafa'ah
  doc.setFillColor(241, 245, 249);
  doc.rect(18, 81, 84, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(18, 81, 84, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(27, 67, 50);
  doc.text("A. KOMPONEN PENDAPATAN", 21, 85.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Jumlah (Rp)", 98, 85.2, { align: 'right' });

  // Right Column Header: B. Potongan Disiplin & SOP
  doc.setFillColor(254, 242, 242); // rose-50
  doc.rect(108, 81, 84, 6, 'F');
  doc.rect(108, 81, 84, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28); // rose-700
  doc.text("B. POTONGAN & KEDISIPLINAN", 111, 85.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Jumlah (Rp)", 188, 85.2, { align: 'right' });

  // Rows Left: Pendapatan
  let yLeft = 93;

  // 1. Gaji Pokok
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("1. Gaji Pokok Asatidz", 21, yLeft);
  doc.setFont('helvetica', 'bold');
  doc.text(maskNumber(baseSalary), 98, yLeft, { align: 'right' });

  // 2. Honor Mengajar
  yLeft += 8;
  doc.setFont('helvetica', 'normal');
  doc.text("2. Honor Mengajar KBM", 21, yLeft);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`(${totalTaughtHours} JP × ${formatRupiah(hourlyRate)})`, 21, yLeft + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(maskNumber(teachingHonorarium), 98, yLeft, { align: 'right' });

  // 3. Uang Transport
  yLeft += 9;
  doc.setFont('helvetica', 'normal');
  doc.text("3. Uang Transport Kehadiran", 21, yLeft);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`(${totalPresentDays} Hari × ${formatRupiah(dailyTransportRate)})`, 21, yLeft + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(maskNumber(totalTransport), 98, yLeft, { align: 'right' });

  // 4. Honor Badal (if any)
  yLeft += 9;
  doc.setFont('helvetica', 'normal');
  doc.text("4. Honor Badal / Pengganti", 21, yLeft);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(totalBadalHours > 0 ? `(${totalBadalHours} JP Badal)` : "(Tidak ada penugasan)", 21, yLeft + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(maskNumber(badalHonorarium), 98, yLeft, { align: 'right' });

  // Subtotal Pendapatan Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(18, 126, 102, 126);

  const totalGross = baseSalary + teachingHonorarium + totalTransport + badalHonorarium;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(27, 67, 50);
  doc.text("Total Pendapatan (Gross)", 21, 131.5);
  doc.setFontSize(9);
  doc.text(maskNumber(totalGross), 98, 131.5, { align: 'right' });

  // Rows Right: Potongan
  let yRight = 93;

  // 1. Denda Keterlambatan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("1. Denda Keterlambatan", 111, yRight);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(latePenaltyTotal > 0 ? mask(`-${formatRupiah(latePenaltyTotal)}`) : mask('Rp 0'), 188, yRight, { align: 'right' });

  // 2. Penalti Jurnal Belum Terisi
  yRight += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text("2. Penalti Jurnal Belum Terisi", 111, yRight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Sesuai SOP Administrasi KBM", 111, yRight + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text(emptyJournalPenalty > 0 ? mask(`-${formatRupiah(emptyJournalPenalty)}`) : mask('Rp 0'), 188, yRight, { align: 'right' });

  // 3. Potongan Alpa / Ketidakhadiran
  yRight += 9;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text("3. Potongan Alpa / Tanpa Izin", 111, yRight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Potongan KBM & Transport", 111, yRight + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text(alphaPenalty > 0 ? mask(`-${formatRupiah(alphaPenalty)}`) : mask('Rp 0'), 188, yRight, { align: 'right' });

  // 4. Potongan Lain-lain
  yRight += 9;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text("4. Potongan Lain-Lain", 111, yRight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Iuran / Kas Wajib / Pinjaman", 111, yRight + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text(otherDeductions > 0 ? mask(`-${formatRupiah(otherDeductions)}`) : mask('Rp 0'), 188, yRight, { align: 'right' });

  // Subtotal Potongan Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(108, 126, 192, 126);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text("Total Potongan", 111, 131.5);
  doc.setFontSize(9);
  doc.text(totalDeductions > 0 ? mask(`-${formatRupiah(totalDeductions)}`) : mask('Rp 0'), 188, 131.5, { align: 'right' });

  // 6. Highlight Box: Take Home Pay (Total Kafa'ah Bersih - Transfer status removed as requested)
  doc.setFillColor(27, 67, 50); // Deep forest green
  doc.roundedRect(18, 138, 174, 18, 2, 2, 'F');

  doc.setTextColor(212, 163, 115); // #D4A373 Warm gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("TOTAL KAFA'AH DITERIMA (TAKE HOME PAY)", 24, 144);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text(
    isPrivacyMode ? 'Nominal Dirahasiakan (Mode Privasi Aktif)' : `Terbilang: "${terbilang(netSalary)}"`,
    24, 150
  );

  // Large Net Salary on the right
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(mask(formatRupiah(netSalary)), 186, 149, { align: 'right' });

  // 7. Signature / Pengesahan Section (2 Columns)
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(18, 170, 192, 170);

  // Signature Left: Bendahara Yayasan
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("Diverifikasi & Disahkan,", 58, 178, { align: 'center' });
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Bendahara HRD Pesantren", 58, 183, { align: 'center' });
  
  // Digital Stamp Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(36, 188, 44, 15, 1.5, 1.5, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text("VERIFIED & TRANSFERRED", 58, 194.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text("Sistem HRIS Terenkripsi", 58, 199.5, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("Ust. Ahmad Syahid, M.Pd.", 58, 211, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text("NIP: BQA-2021-003", 58, 215.5, { align: 'center' });

  // Signature Right: Asatidz Penerima
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("Penerima Kafa'ah,", 152, 178, { align: 'center' });
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Asatidz yang Bersangkutan", 152, 183, { align: 'center' });

  // Digital Signature Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(130, 188, 44, 15, 1.5, 1.5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text("[ Tanda Tangan Digital ]", 152, 197, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(teacherName, 152, 211, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP: ${nip}`, 152, 215.5, { align: 'center' });

  // 8. Footer Bottom Note
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(18, 226, 192, 226);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    `✓ Dokumen Digital Sah HRIS Pesantren Baitul Qur'an Al-Ikhwan • Dicetak pada ${currentDate}`,
    18, 232
  );
  doc.text(
    `Sistem Penggajian & Disiplin KBM Terintegrasi`,
    192, 232, { align: 'right' }
  );

  return doc;
}

export function printSalarySlipDocument(data: PrintSlipData): void {
  const doc = generateSalarySlipPDF(data);
  const safeName = data.teacherName.replace(/\s+/g, '_').toLowerCase();
  const safePeriod = data.period.replace(/\s+/g, '_').toLowerCase();
  doc.save(`slip_kafaah_${safeName}_${safePeriod}.pdf`);
}

