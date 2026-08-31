import React, { useState } from 'react';

interface MaterialItem {
  id: string;
  type: 'video' | 'document' | 'link' | 'quiz';
  title: string;
}

interface Module {
  id: string;
  title: string;
  isOpen: boolean;
  items: MaterialItem[];
}

export const CourseBuilder: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([
    {
      id: 'm1',
      title: 'Modul 1: Pengenalan Tajwid & Makharijul Huruf',
      isOpen: true,
      items: [
        { id: 'i1', type: 'video', title: 'Video: Makharijul Huruf Dasar' },
        { id: 'i2', type: 'document', title: 'Materi PDF: Ringkasan Sifat Huruf' },
      ]
    },
    {
      id: 'm2',
      title: 'Modul 2: Hukum Nun Mati dan Tanwin',
      isOpen: false,
      items: [
        { id: 'i3', type: 'document', title: 'Materi: Idgham Bighunnah' },
        { id: 'i4', type: 'quiz', title: 'Kuis Praktik Tajwid' },
      ]
    }
  ]);

  const [activeItem, setActiveItem] = useState<MaterialItem>({
    id: 'i2',
    type: 'document',
    title: 'Materi PDF: Ringkasan Sifat Huruf'
  });

  const toggleModule = (id: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, isOpen: !m.isOpen } : m));
  };

  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-center">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
          🚧 Fitur Manajemen Kelas & Materi ini masih dalam tahap pengembangan (Coming Soon) dan belum terintegrasi database.
        </p>
      </div>

      {/* 1. Header with minimalist design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Manajemen Kelas & Kurikulum
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Susun modul kurikulum, bahan ajar, dan lampiran referensi pengajaran Anda.
          </p>
        </div>
        <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-sm transition-colors duration-150 cursor-pointer">
          Buat Modul Baru
        </button>
      </div>

      {/* 2. Modular split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Curriculumn / Module Builder (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          {modules.map((mod) => (
            <div 
              key={mod.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all duration-150"
            >
              {/* Module Accordion Trigger */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 select-none"
                onClick={() => toggleModule(mod.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                    ID: {mod.id.toUpperCase()}
                  </span>
                  <span className="font-semibold text-slate-850 dark:text-slate-200 text-sm">
                    {mod.title}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {mod.isOpen ? 'Sembunyikan' : 'Buka Modul'}
                </span>
              </div>
              
              {/* Module Content */}
              {mod.isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 p-4 space-y-2">
                  {mod.items.map(item => {
                    const isSelected = activeItem.id === item.id;
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => setActiveItem(item)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900' 
                            : 'bg-white border-slate-200/60 dark:bg-slate-800 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-650 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            isSelected 
                              ? 'bg-white/10 text-white dark:bg-slate-900/10 dark:text-slate-900' 
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {item.type}
                          </span>
                          <span className="text-xs font-semibold">
                            {item.title}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}>
                          Edit Konten
                        </span>
                      </div>
                    );
                  })}
                  
                  <button className="w-full mt-2 p-3 border-2 border-dashed border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer">
                    + Tambah Materi Pembelajaran
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Content Editor Panel (Static Sandbox Layout for Split-Screen Workflow) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm p-4 sm:p-5 h-fit sticky top-24 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Panel Editor Materi
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Aktif: <span className="font-bold text-slate-800 dark:text-slate-200">{activeItem.title}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Judul Materi</label>
              <input 
                type="text" 
                value={activeItem.title}
                onChange={(e) => setActiveItem({ ...activeItem, title: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tipe Lampiran</label>
              <select 
                value={activeItem.type}
                onChange={(e) => setActiveItem({ ...activeItem, type: e.target.value as any })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100"
              >
                <option value="video">Video Pembelajaran</option>
                <option value="document">Dokumen / PDF Ringkasan</option>
                <option value="link">Tautan Web / Referensi</option>
                <option value="quiz">Kuis / Evaluasi Praktik</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Catatan Tambahan</label>
              <textarea 
                rows={4}
                placeholder="Tuliskan petunjuk pembelajaran bagi santri..."
                defaultValue="Pelajari ringkasan materi secara mendalam sebelum melakukan setoran lisan."
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button className="w-full py-2 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer">
                Ganti Lampiran File (PDF/MP4)
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250 cursor-pointer">
                Batal
              </button>
              <button className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-sm transition-colors duration-150 cursor-pointer">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
