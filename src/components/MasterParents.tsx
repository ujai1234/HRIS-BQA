import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, UserPlus, XCircle, Users, Link as LinkIcon, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const MasterParents: React.FC = () => {
  const [parents, setParents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'students'>('profile');
  const [selectedParent, setSelectedParent] = useState<any>(null);
  
  // Profile Form State
  const [profileData, setProfileData] = useState({
    nik: '', kkNumber: '', phone: '', address: '', job: '', income: '', vehicle: '', homeOwnership: ''
  });

  // Relation State
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const fetchParents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/parents');
      if (res.ok) {
        const data = await res.json();
        setParents(data);
      }
    } catch (error) {
      toast.error('Gagal memuat data wali santri');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        setAllStudents(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLinkedStudents = async (parentId: string) => {
    try {
      const res = await fetch(`/api/parents/${parentId}/linked-students`);
      if (res.ok) {
        const result = await res.json();
        setLinkedStudents(result.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchParents();
    fetchAllStudents();
  }, []);

  const openEditModal = (parent: any) => {
    setSelectedParent(parent);
    setProfileData({
      nik: parent.nik || '',
      kkNumber: parent.kkNumber || '',
      phone: parent.phone || '',
      address: parent.address || '',
      job: parent.job || '',
      income: parent.income || '',
      vehicle: parent.vehicle || '',
      homeOwnership: parent.homeOwnership || ''
    });
    fetchLinkedStudents(parent.id);
    setActiveTab('profile');
    setShowModal(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/parents/${selectedParent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        toast.success('Profil wali berhasil diperbarui');
        fetchParents();
      } else {
        toast.error('Gagal memperbarui profil');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const handleLinkStudent = async (studentId: string) => {
    setIsLinking(true);
    try {
      const res = await fetch(`/api/parents/${selectedParent.id}/link-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, relation: 'AYAH' })
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Santri berhasil dihubungkan');
        setSearchStudentQuery('');
        fetchLinkedStudents(selectedParent.id);
      } else {
        toast.error(result.error || 'Gagal menghubungkan santri');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkStudent = async (studentId: string) => {
    if (!confirm('Apakah Anda yakin ingin memutuskan relasi ini?')) return;
    try {
      const res = await fetch(`/api/parents/${selectedParent.id}/link-student/${studentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Relasi berhasil dihapus');
        fetchLinkedStudents(selectedParent.id);
      } else {
        toast.error('Gagal menghapus relasi');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const filteredParents = parents.filter(p => 
    p.userId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone?.includes(searchTerm)
  );

  const searchResults = searchStudentQuery.length > 2 
    ? allStudents.filter(s => 
        (s.name.toLowerCase().includes(searchStudentQuery.toLowerCase()) || s.nis.includes(searchStudentQuery)) &&
        !linkedStudents.find(ls => ls.id === s.id)
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bqa-card p-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-emerald-50">Master Data Wali Santri</h2>
          <p className="text-sm text-slate-500 dark:text-emerald-400/70 mt-1">Kelola profil wali dan hubungkan akun wali ke data santri.</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari User ID atau No HP..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#121f1a] border border-slate-200 dark:border-emerald-900/40 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-emerald-100 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bqa-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0f1a15] text-slate-500 dark:text-emerald-400/80 border-b border-slate-200 dark:border-emerald-900/40">
              <tr>
                <th className="px-6 py-4 font-semibold">User ID</th>
                <th className="px-6 py-4 font-semibold">NIK</th>
                <th className="px-6 py-4 font-semibold">No. HP</th>
                <th className="px-6 py-4 font-semibold">Alamat</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/40">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredParents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Belum ada data wali santri.</td>
                </tr>
              ) : (
                filteredParents.map((parent) => (
                  <tr key={parent.id} className="hover:bg-slate-50 dark:bg-[#0f1a15] dark:hover:bg-[#162720]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-emerald-50">{parent.userId}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-emerald-300/80">{parent.nik || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-emerald-100">{parent.phone || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-emerald-100 truncate max-w-xs">{parent.address || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditModal(parent)} className="text-emerald-600 hover:text-emerald-700 font-medium text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">Edit / Relasi</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-[#121f1a] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-emerald-900/40 flex justify-between items-center bg-slate-50 dark:bg-[#0f1a15]">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-emerald-50 text-lg">Kelola Wali Santri</h3>
                <p className="text-sm text-slate-500 dark:text-emerald-400/80">User ID: {selectedParent?.userId}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-[#121f1a] p-2 rounded-full shadow-sm border border-slate-200 dark:border-emerald-900/40">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-emerald-900/40 px-5 pt-2 bg-slate-50 dark:bg-[#0f1a15]/50 dark:bg-[#0f1a15]/50">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Profil Wali
              </button>
              <button 
                onClick={() => setActiveTab('students')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'students' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Santri Terhubung
                {linkedStudents.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{linkedStudents.length}</span>
                )}
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'profile' ? (
                <form id="profileForm" onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">NIK</label>
                      <input type="text" value={profileData.nik} onChange={e => setProfileData({...profileData, nik: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">No. KK</label>
                      <input type="text" value={profileData.kkNumber} onChange={e => setProfileData({...profileData, kkNumber: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">No. HP Aktif</label>
                    <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">Alamat Lengkap</label>
                    <textarea value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} rows={3} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">Pekerjaan</label>
                      <input type="text" value={profileData.job} onChange={e => setProfileData({...profileData, job: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">Penghasilan</label>
                      <input type="text" value={profileData.income} onChange={e => setProfileData({...profileData, income: e.target.value})} placeholder="Contoh: 3-5 Juta" className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Current Linked Students */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-emerald-50 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" /> Daftar Anak
                    </h4>
                    {linkedStudents.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 dark:bg-[#0f1a15] rounded-xl border border-dashed border-slate-200 dark:border-emerald-900/40 text-slate-500 text-sm">
                        Belum ada santri yang terhubung dengan wali ini.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {linkedStudents.map(student => (
                          <div key={student.id} className="flex justify-between items-center bg-white dark:bg-[#0f1a15] p-3 rounded-xl border border-slate-200 dark:border-emerald-900/40 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-slate-800 dark:text-emerald-50">{student.name}</p>
                                <p className="text-xs text-slate-500 dark:text-emerald-400/70">NIS: {student.nis} • Kelas: {student.className}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleUnlinkStudent(student.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Putus Relasi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Link */}
                  <div className="pt-4 border-t border-slate-200 dark:border-emerald-900/40">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-emerald-50 mb-3 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-emerald-600" /> Hubungkan Santri Baru
                    </h4>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Cari nama atau NIS (minimal 3 karakter)..." 
                        value={searchStudentQuery}
                        onChange={e => setSearchStudentQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500"
                      />
                      
                      {/* Autocomplete Results */}
                      {searchStudentQuery.length > 2 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#121f1a] border border-slate-200 dark:border-emerald-800/40 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {searchResults.length === 0 ? (
                            <div className="p-3 text-sm text-slate-500 text-center">Tidak ada santri ditemukan</div>
                          ) : (
                            searchResults.map(s => (
                              <div key={s.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:bg-[#0f1a15] dark:hover:bg-[#162720] border-b border-slate-100 dark:border-emerald-900/20 last:border-0 cursor-pointer">
                                <div>
                                  <p className="font-medium text-sm text-slate-800 dark:text-emerald-50">{s.name}</p>
                                  <p className="text-xs text-slate-500">NIS: {s.nis}</p>
                                </div>
                                <button 
                                  onClick={() => handleLinkStudent(s.id)}
                                  disabled={isLinking}
                                  className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-md font-bold transition-colors disabled:opacity-50"
                                >
                                  Hubungkan
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {activeTab === 'profile' && (
              <div className="p-5 border-t border-slate-200 dark:border-emerald-900/40 flex justify-end gap-3 bg-slate-50 dark:bg-[#0f1a15]">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40 rounded-lg transition-colors">Batal</button>
                <button type="submit" form="profileForm" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Simpan Profil
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};
