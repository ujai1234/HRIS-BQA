import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Table as TableIcon, 
  Search, 
  RefreshCw, 
  X, 
  Terminal, 
  FileCode, 
  Layers, 
  CheckCircle2, 
  Server,
  Code2,
  HardDrive
} from 'lucide-react';

interface ColumnMeta {
  name: string;
  type: string;
  notNull: boolean;
  isPk: boolean;
  defaultValue: any;
}

interface TableMeta {
  name: string;
  rowCount: number;
  columns: ColumnMeta[];
}

interface DbExplorerMeta {
  engine: string;
  orm: string;
  databaseFile: string;
  tables: TableMeta[];
}

interface DatabaseExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseExplorerModal: React.FC<DatabaseExplorerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'schema' | 'console'>('tables');
  const [meta, setMeta] = useState<DbExplorerMeta | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('teachers');
  const [tableData, setTableData] = useState<{ columns: string[]; rows: any[]; totalRows: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sqlConsoleQuery, setSqlConsoleQuery] = useState('SELECT * FROM teachers LIMIT 10;');
  const [sqlConsoleResult, setSqlConsoleResult] = useState<{ columns: string[]; rows: any[]; rowCount: number; error?: string } | null>(null);
  const [isQueryRunning, setIsQueryRunning] = useState(false);

  // Fetch Database Metadata
  const fetchMetadata = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/db-explorer/tables');
      if (res.ok) {
        const data: DbExplorerMeta = await res.json();
        setMeta(data);
        if (data.tables.length > 0 && !selectedTable) {
          setSelectedTable(data.tables[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to fetch DB metadata:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Table Data
  const fetchTableData = async (tableName: string, querySearch: string = '') => {
    if (!tableName) return;
    setIsLoading(true);
    try {
      const url = `/api/db-explorer/data/${encodeURIComponent(tableName)}?limit=100&search=${encodeURIComponent(querySearch)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTableData({
          columns: data.columns || [],
          rows: data.rows || [],
          totalRows: data.totalRows || 0
        });
      }
    } catch (err) {
      console.error(`Failed to fetch data for ${tableName}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedTable) {
      fetchTableData(selectedTable, searchQuery);
    }
  }, [selectedTable, isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTableData(selectedTable, searchQuery);
  };

  const runCustomQuery = async () => {
    if (!sqlConsoleQuery.trim()) return;
    setIsQueryRunning(true);
    setSqlConsoleResult(null);
    try {
      const res = await fetch('/api/db-explorer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlConsoleQuery })
      });
      const data = await res.json();
      if (res.ok) {
        setSqlConsoleResult({
          columns: data.columns || [],
          rows: data.rows || [],
          rowCount: data.rowCount || 0
        });
      } else {
        setSqlConsoleResult({
          columns: [],
          rows: [],
          rowCount: 0,
          error: data.details || data.error || 'Query failed'
        });
      }
    } catch (err: any) {
      setSqlConsoleResult({
        columns: [],
        rows: [],
        rowCount: 0,
        error: String(err)
      });
    } finally {
      setIsQueryRunning(false);
    }
  };

  if (!isOpen) return null;

  const currentTableMeta = meta?.tables.find(t => t.name === selectedTable);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c1813] border border-slate-200 dark:border-emerald-800/40 rounded-2xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden font-sans">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#09130f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 dark:text-emerald-100 text-base tracking-tight">
                  Drizzle ORM & SQLite Database Viewer
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                  SQLite (better-sqlite3)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-full border border-blue-300 dark:border-blue-800">
                  Drizzle ORM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-emerald-400/70 flex items-center gap-2 mt-0.5">
                <HardDrive className="w-3.5 h-3.5 inline text-emerald-600 dark:text-emerald-400" />
                <span>File DB: <code className="font-mono text-[11px] font-semibold text-slate-700 dark:text-emerald-200">{meta?.databaseFile || 'sqlite.db'}</code></span>
                <span>•</span>
                <span>Backend API & Client Integrasi Terverifikasi</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchMetadata();
                fetchTableData(selectedTable, searchQuery);
              }}
              disabled={isLoading}
              className="p-2 text-slate-600 dark:text-emerald-300 hover:bg-slate-200 dark:hover:bg-[#152820] rounded-xl transition-colors cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#152820] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-100/80 dark:bg-[#07110c] border-b border-slate-200 dark:border-emerald-900/40 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'tables'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-white dark:bg-[#0c1813]'
                : 'border-transparent text-slate-600 dark:text-emerald-400/60 hover:text-slate-900 dark:hover:text-emerald-200'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Tabel & Baris Data ({meta?.tables.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-white dark:bg-[#0c1813]'
                : 'border-transparent text-slate-600 dark:text-emerald-400/60 hover:text-slate-900 dark:hover:text-emerald-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Skema Kolom Drizzle</span>
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`px-4 py-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'console'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-white dark:bg-[#0c1813]'
                : 'border-transparent text-slate-600 dark:text-emerald-400/60 hover:text-slate-900 dark:hover:text-emerald-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>SQL Console Query</span>
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 flex min-h-0">

          {/* TAB 1: TABLES & ROWS */}
          {activeTab === 'tables' && (
            <div className="flex-1 flex min-h-0">
              
              {/* Left Sidebar: List of Tables */}
              <div className="w-64 border-r border-slate-200 dark:border-emerald-900/40 bg-slate-50/50 dark:bg-[#08130e] p-3 flex flex-col gap-1 overflow-y-auto">
                <p className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-emerald-400/60 uppercase tracking-wider">
                  Daftar Tabel SQLite
                </p>

                {meta?.tables.map((t) => {
                  const isSelected = selectedTable === t.name;
                  return (
                    <button
                      key={t.name}
                      onClick={() => {
                        setSelectedTable(t.name);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm font-bold'
                          : 'text-slate-700 dark:text-emerald-200 hover:bg-slate-200 dark:hover:bg-[#12231c]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <TableIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                        <span className="truncate">{t.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300'
                      }`}>
                        {t.rowCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Main Content Area: Data Table */}
              <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0c1813]">
                
                {/* Search & Action Bar */}
                <div className="p-4 border-b border-slate-200 dark:border-emerald-900/40 flex items-center justify-between gap-4 bg-slate-50/30 dark:bg-[#0a1510]">
                  <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-emerald-400/60" />
                    <input
                      type="text"
                      placeholder={`Cari data dalam tabel ${selectedTable}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#12231b] border border-slate-200 dark:border-emerald-800/40 rounded-xl text-slate-800 dark:text-emerald-100 focus:outline-none focus:border-emerald-500 shadow-xs"
                    />
                  </form>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-emerald-400/70">
                    <span>Total Baris: <strong className="text-slate-800 dark:text-emerald-200">{tableData?.totalRows || 0}</strong></span>
                  </div>
                </div>

                {/* Data Table Grid */}
                <div className="flex-1 overflow-auto p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-emerald-400/60 text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-600" />
                      <span>Memuat data tabel {selectedTable}...</span>
                    </div>
                  ) : !tableData || tableData.rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-emerald-400/60 text-xs gap-2">
                      <TableIcon className="w-8 h-8 opacity-40" />
                      <p>Tidak ada data ditemukan dalam tabel {selectedTable}</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-emerald-800/40 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-[#11221b] border-b border-slate-200 dark:border-emerald-800/40">
                            {tableData.columns.map((col) => (
                              <th key={col} className="px-4 py-3 font-bold text-slate-700 dark:text-emerald-200 uppercase tracking-wider text-[11px] whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/30 font-mono text-[11px]">
                          {tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-[#14261e] transition-colors">
                              {tableData.columns.map((col) => {
                                const val = row[col];
                                let renderedVal = String(val ?? '');
                                if (typeof val === 'object' && val !== null) {
                                  renderedVal = JSON.stringify(val);
                                }
                                if (typeof val === 'boolean') {
                                  return (
                                    <td key={col} className="px-4 py-2.5 whitespace-nowrap">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        val ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                      }`}>
                                        {val ? 'TRUE' : 'FALSE'}
                                      </span>
                                    </td>
                                  );
                                }
                                return (
                                  <td key={col} className="px-4 py-2.5 text-slate-800 dark:text-emerald-100 max-w-xs truncate" title={renderedVal}>
                                    {val === null || val === undefined ? (
                                      <span className="text-slate-300 dark:text-emerald-700 italic">NULL</span>
                                    ) : (
                                      renderedVal
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: DRIZZLE ORM SCHEMA */}
          {activeTab === 'schema' && (
            <div className="flex-1 overflow-auto p-6 bg-white dark:bg-[#0c1813]">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Definisi Drizzle ORM Schema
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300/80 mt-0.5">
                      Lokasi File: <code className="font-mono bg-white/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">src/db/schema.ts</code>
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs">
                    SQLite Core
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {meta?.tables.map((t) => (
                    <div key={t.name} className="p-4 border border-slate-200 dark:border-emerald-800/40 rounded-2xl bg-slate-50/50 dark:bg-[#0e1c16] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 dark:text-emerald-100 text-sm font-mono flex items-center gap-2">
                          <TableIcon className="w-4 h-4 text-emerald-600" />
                          {t.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 rounded">
                          {t.columns.length} Kolom
                        </span>
                      </div>

                      <div className="border border-slate-200 dark:border-emerald-900/40 rounded-xl overflow-hidden bg-white dark:bg-[#0a1410]">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-[#12231b] border-b border-slate-200 dark:border-emerald-900/40 text-[10px] uppercase text-slate-500 dark:text-emerald-400">
                              <th className="px-3 py-1.5">Kolom</th>
                              <th className="px-3 py-1.5">Tipe Data</th>
                              <th className="px-3 py-1.5">Key</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-emerald-950">
                            {t.columns.map((c) => (
                              <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-[#14261e]">
                                <td className="px-3 py-1.5 font-semibold text-slate-800 dark:text-emerald-100">
                                  {c.name}
                                </td>
                                <td className="px-3 py-1.5 text-emerald-700 dark:text-emerald-400">
                                  {c.type}
                                </td>
                                <td className="px-3 py-1.5">
                                  {c.isPk && (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded text-[9px] font-bold">
                                      PK
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SQL CONSOLE */}
          {activeTab === 'console' && (
            <div className="flex-1 flex flex-col p-6 bg-white dark:bg-[#0c1813] space-y-4 overflow-auto">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-emerald-100 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    <span>Eksekusi SQL Query Interactive</span>
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-emerald-400/60">
                    Mendukung query SELECT, EXPLAIN, dan PRAGMA
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={sqlConsoleQuery}
                    onChange={(e) => setSqlConsoleQuery(e.target.value)}
                    placeholder="Contoh: SELECT * FROM teachers WHERE unit = 'SMP';"
                    className="w-full p-4 font-mono text-xs bg-slate-950 text-emerald-400 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                  <button
                    onClick={runCustomQuery}
                    disabled={isQueryRunning || !sqlConsoleQuery.trim()}
                    className="absolute right-3 bottom-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md"
                  >
                    {isQueryRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                    <span>Jalankan Query</span>
                  </button>
                </div>
              </div>

              {/* Console Results */}
              {sqlConsoleResult && (
                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-emerald-100">
                      Hasil Eksekusi
                    </h4>
                    {sqlConsoleResult.error ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded text-[10px] font-bold">
                        Error
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded text-[10px] font-bold">
                        {sqlConsoleResult.rowCount} Baris Ditemukan
                      </span>
                    )}
                  </div>

                  {sqlConsoleResult.error ? (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-700 dark:text-rose-300 font-mono text-xs">
                      {sqlConsoleResult.error}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-auto border border-slate-200 dark:border-emerald-800/40 rounded-xl shadow-xs bg-slate-50/40 dark:bg-[#0a1510]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-[#11221b] border-b border-slate-200 dark:border-emerald-800/40 font-mono text-[11px]">
                            {sqlConsoleResult.columns.map((col) => (
                              <th key={col} className="px-4 py-2.5 font-bold text-slate-700 dark:text-emerald-200 uppercase">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-emerald-950 font-mono text-[11px]">
                          {sqlConsoleResult.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-[#14261e]">
                              {sqlConsoleResult.columns.map((col) => (
                                <td key={col} className="px-4 py-2 text-slate-800 dark:text-emerald-100 max-w-xs truncate">
                                  {row[col] === null ? 'NULL' : typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Institutional Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#09130f] border-t border-slate-200 dark:border-emerald-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-emerald-400/60 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-slate-700 dark:text-emerald-200">Database SQLite Integrasi Drizzle ORM Aktif</span>
          </div>
          <span>Baitul Qur'an Al-Ikhwan • HRIS & Kafa'ah</span>
        </div>

      </div>
    </div>
  );
};
