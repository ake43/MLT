
import React, { useState } from 'react';
import { FileUp, Download, HelpCircle } from 'lucide-react';
import { Card, Badge } from './App'; // Assuming shared components are exported
import { ExcelService } from './services/excelService';

export const ImportView: React.FC = () => {
  const [logs, setLogs] = useState<{msg: string, type: 'success' | 'error'}[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File, type: 'employee' | 'course' | 'history') => {
    setUploading(true);
    try {
      let errors: string[] = [];
      if (type === 'employee') errors = await ExcelService.importEmployees(file);
      else if (type === 'course') errors = await ExcelService.importCourses(file);
      else if (type === 'history') errors = await ExcelService.importHistory(file);
      
      if (errors.length > 0) {
        setLogs(prev => [...errors.map(err => ({ msg: err, type: 'error' as const })), ...prev]);
      } else {
        setLogs(prev => [{ msg: `Batch processing complete for ${type} dataset.`, type: 'success' as const }, ...prev]);
      }
    } catch (e) {
      setLogs(prev => [{ msg: `Process Critical Error: ${String(e)}`, type: 'error' as const }, ...prev]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black flex items-center gap-2"><FileUp className="text-blue-600"/> Excel Import Engine</h3>
            <Badge type="info">Bilingual Ready</Badge>
          </div>

          <div className="space-y-8">
            {/* History Import */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-black text-slate-900">1. Training History</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Bulk log past attendance records</p>
                </div>
                <button onClick={() => ExcelService.downloadTemplate('history')} className="text-blue-600 flex items-center gap-1 text-[10px] font-black uppercase hover:underline"><Download size={14}/> Template</button>
              </div>
              <input type="file" className="text-xs file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white cursor-pointer w-full" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'history')} />
            </div>

            {/* Employee Import */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-black text-slate-900">2. Employee Master (2 Languages)</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Upload personnel directory</p>
                </div>
                <button onClick={() => ExcelService.downloadTemplate('employee')} className="text-blue-600 flex items-center gap-1 text-[10px] font-black uppercase hover:underline"><Download size={14}/> Template</button>
              </div>
              <input type="file" className="text-xs file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-900 file:text-white cursor-pointer w-full" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'employee')} />
            </div>
          </div>
        </Card>

        <Card className="bg-blue-900 text-white border-none shadow-xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg"><HelpCircle size={20}/></div>
              <h4 className="font-black text-sm uppercase tracking-widest">Bilingual Ingestion Rules</h4>
           </div>
           <ul className="space-y-3 text-xs opacity-80 font-medium">
              <li className="flex gap-2"><span>•</span> <strong>Columns Names:</strong> Ensure headers like <code>Name_TH</code> and <code>Name_EN</code> are present.</li>
              <li className="flex gap-2"><span>•</span> <strong>Fallback:</strong> If one name is missing, the system will use the other as fallback.</li>
           </ul>
        </Card>
      </div>

      <Card className="bg-slate-900 text-white font-mono p-6 rounded-2xl text-[10px] overflow-y-auto max-h-[700px] border-none shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
          <h4 className="text-slate-500 font-black uppercase tracking-[0.2em]">Runtime Terminal Output</h4>
        </div>
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={i} className={`p-2 rounded border-l-2 ${log.type === 'error' ? 'text-red-400 bg-red-400/5 border-red-500' : 'text-emerald-400 bg-emerald-400/5 border-emerald-500'}`}>
              <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString()}]</span>
              <span className="font-bold">{log.type === 'error' ? 'ERR_PROC_FAILURE' : 'SYNC_COMPLETE'}</span>: {log.msg}
            </div>
          ))}
          {uploading && <div className="text-blue-400 animate-pulse mt-4 font-bold">> PROCESSING_BILINGUAL_DATA...</div>}
        </div>
      </Card>
    </div>
  );
};
