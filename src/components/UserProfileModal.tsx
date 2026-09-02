import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Check, 
  User, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  Building2, 
  Sparkles,
  FlipHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRIS } from '../context/HRISContext';
import { Teacher, getRoleDisplayName } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateTeacher } = useHRIS();

  const [mode, setMode] = useState<'VIEW' | 'CAMERA'>('VIEW');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(currentUser?.avatarUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSnap, setCapturedSnap] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentUser) {
      setPhone(currentUser.phone || '');
      setPreviewPhoto(currentUser.avatarUrl || null);
    }
  }, [currentUser, isOpen]);

  // Cleanup camera stream on close or mode change
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setMode('VIEW');
      setCapturedSnap(null);
      setCameraError(null);
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  // Start Camera Stream
  const startCamera = async (facing: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    setCapturedSnap(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errMsg = 'Gagal membuka kamera perangkat.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Izin kamera ditolak. Mohon izinkan akses kamera pada browser Anda.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'Kamera tidak ditemukan pada perangkat ini.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Kamera sedang digunakan oleh aplikasi lain.';
      }
      setCameraError(errMsg);
      setIsCameraActive(false);
    }
  };

  const handleOpenCamera = () => {
    setMode('CAMERA');
    startCamera('user');
  };

  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Capture photo frame from video
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    const size = Math.min(video.videoWidth || 400, video.videoHeight || 400);
    canvas.width = 300;
    canvas.height = 300;

    // Crop center square
    const sx = ((video.videoWidth || size) - size) / 2;
    const sy = ((video.videoHeight || size) - size) / 2;

    // Flip horizontally if facing user for natural mirror look
    if (facingMode === 'user') {
      context.translate(300, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedSnap(dataUrl);
    setIsCapturing(false);
  };

  const handleApplyCapturedSnap = () => {
    if (capturedSnap) {
      setPreviewPhoto(capturedSnap);
      stopCamera();
      setMode('VIEW');
      toast.info('Foto kamera berhasil dipilih. Klik "Simpan Profil" untuk memperbarui.');
    }
  };

  // Handle File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Harap pilih file gambar (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 8 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 300, 300);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewPhoto(resizedDataUrl);
          toast.info('Foto dari galeri dipilih. Klik "Simpan Profil" untuk menerapkan.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewPhoto(null);
    toast.info('Foto profil akan dihapus.');
  };

  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    try {
      await updateTeacher(currentUser.id, {
        avatarUrl: previewPhoto || undefined,
        phone: phone.trim(),
      });
      toast.success('Profil & Foto Asatidz berhasil diperbarui!');
      onClose();
    } catch (err) {
      console.error('Save profile error:', err);
      toast.error('Gagal memperbarui profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121f1a] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-emerald-800/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-emerald-900/30 flex items-center justify-between bg-slate-50/50 dark:bg-[#0f1a15]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
                Pengaturan Profil Asatidz
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-emerald-400/70">
                Ubah foto profil & informasi kontak akun Anda
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-emerald-400/60 dark:hover:text-emerald-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#182a22] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {mode === 'VIEW' ? (
            <>
              {/* Photo Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-[#0e1814] border border-slate-100 dark:border-emerald-900/30">
                {/* Photo Display */}
                <div className="relative group shrink-0">
                  {previewPhoto ? (
                    <img
                      src={previewPhoto}
                      alt={currentUser.name}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
                    />
                  ) : (
                    <div
                      className={`w-24 h-24 rounded-2xl ${
                        currentUser.avatarColor || 'bg-emerald-700'
                      } text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-emerald-500/30`}
                    >
                      {currentUser.name ? currentUser.name[0] : 'U'}
                    </div>
                  )}

                  {previewPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Hapus Foto"
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Photo Actions */}
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-emerald-100">
                    Foto Profil Asatidz
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-emerald-400/70 leading-relaxed">
                    Ambil foto langsung melalui kamera HP/Laptop Anda atau unggah dari file.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenCamera}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Ambil Foto via Kamera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#182922] hover:bg-slate-100 dark:hover:bg-[#1f352c] text-slate-700 dark:text-emerald-200 border border-slate-200 dark:border-emerald-800/40 transition-all cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-emerald-400/80" />
                      <span>Unggah File</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* User Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-emerald-300/80 mb-1">
                      Nama Lengkap (Sesuai SK)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.name}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#0e1713] text-slate-500 dark:text-emerald-400/60 border border-slate-200 dark:border-emerald-900/30 cursor-not-allowed font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-emerald-300/80 mb-1">
                      NIP / Kode Asatidz
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.nip}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#0e1713] text-slate-500 dark:text-emerald-400/60 border border-slate-200 dark:border-emerald-900/30 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-emerald-300/80 mb-1">
                      Jabatan Amanah
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={currentUser.position}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#0e1713] text-slate-500 dark:text-emerald-400/60 border border-slate-200 dark:border-emerald-900/30 cursor-not-allowed font-medium pl-8"
                      />
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-emerald-300/80 mb-1">
                      Unit Penugasan
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={`Unit ${currentUser.unit}`}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#0e1713] text-slate-500 dark:text-emerald-400/60 border border-slate-200 dark:border-emerald-900/30 cursor-not-allowed font-medium pl-8"
                      />
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-emerald-200 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812xxxxxxx"
                      className="w-full px-3 py-2 pl-8 text-xs rounded-xl bg-white dark:bg-[#0e1814] text-slate-900 dark:text-emerald-50 border border-slate-200 dark:border-emerald-800/50 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-medium transition-colors"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-emerald-400/70 absolute left-2.5 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-emerald-400/60 mt-1">
                    Digunakan untuk koordinasi jadwal KBM & informasi penting pesantren.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Live Camera Capture Interface */
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-emerald-900/30">
                <div className="text-left">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-emerald-100 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Kamera Perangkat</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-emerald-400/60">
                    Posisikan wajah Anda secara simetris di dalam bingkai
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isCameraActive && !capturedSnap && (
                    <button
                      type="button"
                      onClick={handleToggleFacingMode}
                      className="p-1.5 text-xs rounded-lg bg-slate-100 dark:bg-[#182922] text-slate-700 dark:text-emerald-200 hover:bg-slate-200 dark:hover:bg-[#1f352c] transition-colors flex items-center gap-1 cursor-pointer"
                      title="Ganti Kamera Depan/Belakang"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      <span className="text-[10px] hidden sm:inline">Putar Kamera</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setMode('VIEW');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-emerald-400/60 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Camera Stream / Snapshot Display */}
              <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden bg-slate-950 border-4 border-emerald-500/50 shadow-xl flex items-center justify-center">
                {!capturedSnap ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${
                        facingMode === 'user' ? 'scale-x-[-1]' : ''
                      }`}
                    />

                    {/* Target Guide Ring Overlay */}
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/60 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full border border-emerald-400/40 animate-pulse" />
                    </div>

                    {!isCameraActive && !cameraError && (
                      <div className="absolute inset-0 bg-slate-900/90 text-white flex flex-col items-center justify-center p-4">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
                        <p className="text-xs font-medium">Membuka kamera...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <img
                    src={capturedSnap}
                    alt="Hasil Tangkapan Kamera"
                    className="w-full h-full object-cover animate-in zoom-in-95 duration-150"
                  />
                )}

                {/* Hidden canvas for capturing video frame */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera Error Alert */}
              {cameraError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 text-xs text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="mt-1.5 px-2.5 py-1 text-[11px] font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}

              {/* Camera Actions */}
              <div className="pt-2 flex items-center justify-center gap-3">
                {!capturedSnap ? (
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    disabled={!isCameraActive || isCapturing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil Foto</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedSnap(null);
                        startCamera();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#182a22] hover:bg-slate-200 dark:hover:bg-[#1f362c] text-slate-700 dark:text-emerald-200 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Foto Ulang</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyCapturedSnap}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Gunakan Foto Ini</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {mode === 'VIEW' && (
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-emerald-900/30 bg-slate-50/50 dark:bg-[#0f1a15] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-emerald-300 hover:bg-slate-200/70 dark:hover:bg-[#182922] transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Simpan Profil</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
