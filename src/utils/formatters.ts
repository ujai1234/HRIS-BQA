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
