import React, { useState } from 'react';

interface Submission {
  id: string;
  name: string;
  task: string;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
  date: string;
  score: number | null;
  feedback?: string;
  content?: string;
}

export const GradingSuite: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'GRADED' | 'LATE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dummy student submissions with premium, realistic data
  const [submissions, setSubmissions] = useState<Submission[]>([
    { 
      id: '1', 
      name: 'Ahmad Faris', 
      task: 'Setoran Surah Al-Mulk (Ayat 1-10)', 
      status: 'SUBMITTED', 
      date: 'Hari ini, 08:30', 
      score: null,
      content: 'Bismillah, berikut rekaman lisan setoran Surah Al-Mulk ayat 1-10 untuk dicek tajwid dan kelancarannya, Ustadz. Jazakallah khair.'
    },
    { 
      id: '2', 
      name: 'Zahra Aulia', 
      task: 'Kuis Teori Tajwid (Hukum Nun Sukun)', 
      status: 'GRADED', 
      date: 'Kemarin, 14:15', 
      score: 95,
      feedback: 'Alhamdulillah, pemahaman sangat mendalam. Hanya perlu koreksi sedikit di nomor 4 terkait Idgham Bighunnah.',
      content: 'Jawaban Kuis Teori: \n1. Idzhar Halqi: Membaca nun mati jelas.\n2. Idgham Bighunnah: Memasukkan suara dengan mendengung.\n3. Ikhfa Haqiqi: Menyamarkan bunyi.'
    },
    { 
      id: '3', 
      name: 'Budi Santoso', 
      task: 'Hafalan Surah Ya-Sin (Ayat 1-15)', 
      status: 'LATE', 
      date: 'Terlambat 2 hari', 
      score: null,
      content: 'Mohon maaf Ustadz, baru bisa menyerahkan rekaman hari ini karena kemarin sempat kendala teknis mikrofon.'
    },
    { 
      id: '4', 
      name: 'Siti Aminah', 
      task: 'Setoran Surah Al-Mulk (Ayat 1-10)', 
      status: 'SUBMITTED', 
      date: 'Hari ini, 09:10', 
      score: null,
      content: 'Setoran hafalan Surah Al-Mulk ayat 1-10 lengkap tanpa melihat mushaf. Mohon koreksinya.'
    },
  ]);

  const [activeSubmission, setActiveSubmission] = useState<Submission>(submissions[0]);

  const filtered = submissions.filter(s => {
    const matchesFilter = filter === 'ALL' || s.status === filter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.task.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const [scores, setScores] = useState({
    kelancaran: 'A',
    makhraj: 'A',
    tajwid: 'B'
  });

  const [inputScore, setInputScore] = useState<number | ''>('');
  const [inputTextFeedback, setInputTextFeedback] = useState('');

  const handleSaveGrade = () => {
    if (activeSubmission) {
      const finalScore = inputScore === '' ? 85 : Number(inputScore);
      setSubmissions(submissions.map(s => {
        if (s.id === activeSubmission.id) {
          return {
            ...s,
            status: 'GRADED',
            score: finalScore,
            feedback: inputTextFeedback || 'Tugas dinilai dengan baik.'
          };
        }
        return s;
      }));
      
      // Update local view item
      setActiveSubmission({
        ...activeSubmission,
        status: 'GRADED',
        score: finalScore,
        feedback: inputTextFeedback || 'Tugas dinilai dengan baik.'
      });

      // Clear scoring state
      setInputScore('');
      setInputTextFeedback('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-center">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
          🚧 Fitur Grading Suite ini masih dalam purwarupa visual (Coming Soon) dan belum menyimpan ke database utama.
        </p>
      </div>

      {/* 1. Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Penilaian & Koreksi Tugas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluasi jawaban, periksa rubrik kelancaran tajwid, dan berikan nilai asatidz langsung ke database.
          </p>
        </div>
      </div>

      {/* 2. Interactive Split-Screen Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Submission List with Filters (1 Column) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          
          {/* Header Search and Filters */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
            <input 
              type="text" 
              placeholder="Cari siswa atau materi tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-slate-900 dark:focus:border-slate-100"
            />
            
            <div className="flex gap-1 overflow-x-auto pb-1">
              {(['ALL', 'SUBMITTED', 'GRADED', 'LATE'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-tight whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    filter === opt
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-white text-slate-500 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt === 'ALL' ? 'Semua' : opt === 'SUBMITTED' ? 'Diserahkan' : opt === 'GRADED' ? 'Dinilai' : 'Terlambat'}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions Feed */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {filtered.map(sub => {
              const isActive = activeSubmission.id === sub.id;
              return (
                <div 
                  key={sub.id} 
                  onClick={() => {
                    setActiveSubmission(sub);
                    setInputScore(sub.score || '');
                    setInputTextFeedback(sub.feedback || '');
                  }}
                  className={`p-3.5 transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                    isActive 
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-l-2 border-slate-900 dark:border-slate-100' 
                      : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/10'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-xs text-slate-850 dark:text-slate-200">{sub.name}</span>
                    {sub.score !== null ? (
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                        {sub.score} Pts
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                        Koreksi
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="truncate max-w-[150px]">{sub.task}</span>
                    <span className={`font-medium ${sub.status === 'LATE' ? 'text-rose-500' : ''}`}>{sub.date}</span>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Tidak ada pengajuan tugas yang cocok.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Split Submission Review & Grading Rubric (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2">
          
          {/* Column A: Submission Response Content */}
          <div className="p-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pengajuan Jawaban</span>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-1">
                {activeSubmission.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {activeSubmission.task}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-850 min-h-[180px]">
              <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-line font-medium">
                {activeSubmission.content || 'Tidak ada teks jawaban terlampir.'}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
              Status: <span className="font-bold text-slate-600 dark:text-slate-400">{activeSubmission.status}</span>
            </div>
          </div>

          {/* Column B: Professional Rubric & Score Input */}
          <div className="p-5 space-y-4 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rubrik Penilaian</span>
              </div>

              {/* Rubric Evaluator Selectors */}
              <div className="space-y-3">
                {[
                  { key: 'kelancaran', label: 'Kelancaran Hafalan' },
                  { key: 'makhraj', label: 'Makharijul Huruf' },
                  { key: 'tajwid', label: 'Hukum Tajwid & Harakat' }
                ].map((rubric) => (
                  <div key={rubric.key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">{rubric.label}</span>
                    <select 
                      value={(scores as any)[rubric.key]}
                      onChange={(e) => setScores({ ...scores, [rubric.key]: e.target.value })}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="A">A (Sangat Baik)</option>
                      <option value="B">B (Baik / Layak)</option>
                      <option value="C">C (Cukup / Mengulang)</option>
                    </select>
                  </div>
                ))}
              </div>

              {/* Raw Grade Output */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nilai Angka (0-100)
                </label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={inputScore}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setInputScore(val);
                  }}
                  placeholder="Contoh: 85"
                  className="w-full text-lg font-mono font-bold px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-slate-900 dark:focus:border-slate-100"
                />
              </div>

              {/* Feedback Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Catatan Umpan Balik (Feedback)
                </label>
                <textarea 
                  rows={3}
                  value={inputTextFeedback}
                  onChange={(e) => setInputTextFeedback(e.target.value)}
                  placeholder="Tulis saran kelancaran makhraj bagi santri..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Action Save Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
              <button 
                onClick={handleSaveGrade}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-lg shadow-sm transition-all duration-150 cursor-pointer text-center"
              >
                Simpan & Tandai Selesai
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
