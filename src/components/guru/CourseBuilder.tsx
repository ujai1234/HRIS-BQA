import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  GripVertical, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Plus,
  MoreVertical,
  BookOpen
} from 'lucide-react';

export const CourseBuilder: React.FC = () => {
  const [modules, setModules] = useState([
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
        { id: 'i4', type: 'quiz', title: 'Kuis Praktik' },
      ]
    }
  ]);

  const toggleModule = (id: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, isOpen: !m.isOpen } : m));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-sky-500" />;
      case 'document': return <FileText className="w-4 h-4 text-rose-500" />;
      case 'link': return <LinkIcon className="w-4 h-4 text-emerald-500" />;
      default: return <BookOpen className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Manajemen Kelas & Materi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Susun kurikulum modular dan bahan ajar Anda
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4" />
          Modul Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Curriculumn Builder */}
        <div className="lg:col-span-2 space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-all">
              <div 
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                onClick={() => toggleModule(mod.id)}
              >
                <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                <div className="flex-1 font-medium text-slate-900 dark:text-slate-100 text-sm">
                  {mod.title}
                </div>
                {mod.isOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
              
              {mod.isOpen && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-2">
                  {mod.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg group">
                      <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md">
                        {getIcon(item.type)}
                      </div>
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                        {item.title}
                      </span>
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button className="w-full mt-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-lg text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Tambah Materi
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Content Editor Panel (Static Placeholder for Split View) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm p-5 h-fit sticky top-24">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Editor Konten
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Judul Materi</label>
              <input 
                type="text" 
                defaultValue="Materi PDF: Ringkasan Sifat Huruf" 
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Deskripsi</label>
              <textarea 
                rows={4}
                defaultValue="Pelajari ringkasan sifat-sifat huruf hijaiyah yang memiliki lawan dan yang tidak memiliki lawan."
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium text-sm rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Ganti Lampiran (PDF)
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Batal</button>
              <button className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
