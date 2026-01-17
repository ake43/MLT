
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  FileUp, 
  LayoutDashboard,
  Search,
  Plus,
  Download,
  AlertCircle,
  BrainCircuit,
  Settings,
  ChevronRight,
  Printer,
  FileText,
  Filter,
  ArrowLeft,
  X,
  CheckCircle2,
  UserPlus,
  ClipboardCheck,
  History,
  Info,
  Table as TableIcon,
  HelpCircle
} from 'lucide-react';
import { Database } from './services/db';
import { ExcelService } from './services/excelService';
import { getTrainingInsights } from './services/geminiService';
import { Employee, Course, TrainingSession, Registration, AttendanceRecord, UserRole, AttendanceStatus, AppState } from './types';
import { DEPARTMENTS, CATEGORIES } from './constants';

// --- Global Reactivity Hook ---

const useDatabase = () => {
  const [dbState, setDbState] = useState<AppState>(Database.get());

  useEffect(() => {
    const handleUpdate = () => setDbState({ ...Database.get() });
    window.addEventListener('db-updated', handleUpdate);
    return () => window.removeEventListener('db-updated', handleUpdate);
  }, []);

  return dbState;
};

// --- Shared UI Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200 transition-all' : ''} ${className}`}
  >
    {children}
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const Badge: React.FC<{ children: React.ReactNode; type?: 'success' | 'warning' | 'info' | 'error' }> = ({ children, type = 'info' }) => {
  const styles = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[type]}`}>
      {children}
    </span>
  );
};

// --- Specialized Features ---

const EmployeeTrainingReport: React.FC<{ employee: Employee; onBack: () => void; db: AppState }> = ({ employee, onBack, db }) => {
  const trainingHistory = useMemo(() => {
    const result: any[] = [];
    const empId = String(employee.id).trim().toLowerCase();
    
    const registrations = db.registrations.filter(r => 
      String(r.employeeId).trim().toLowerCase() === empId
    );

    registrations.forEach(reg => {
      const session = db.sessions.find(s => s.id === reg.sessionId);
      if (!session) return;
      
      const course = db.courses.find(c => 
        String(c.code).trim().toLowerCase() === String(session.courseCode).trim().toLowerCase()
      );
      if (!course) return;

      const atts = db.attendance.filter(a => a.registrationId === reg.id);
      atts.forEach(att => {
        result.push({
          courseName: course.name,
          date: att.date,
          hours: att.hours,
          trainer: session.trainer || 'Internal',
          location: session.location
        });
      });
    });

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [employee.id, db]);

  const totalHrs = trainingHistory.reduce((s, i) => s + i.hours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 print:hidden">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-bold">Compliance Audit: {employee.name}</h2>
        <button onClick={() => window.print()} className="ml-auto bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg"><Printer size={16}/> Print Record</button>
      </div>

      <div className="bg-white p-12 border border-slate-200 shadow-sm print:shadow-none print:border-0 max-w-[210mm] mx-auto min-h-[297mm]">
        <div className="border-b-4 border-slate-900 pb-8 mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">TRAINING AUDIT LOG</h1>
            <p className="text-sm text-slate-500 uppercase tracking-widest mt-1">Official Human Resources Data Transcript</p>
          </div>
          <div className="text-right">
            <Badge type="info">VALIDATED SYSTEM RECORD</Badge>
            <p className="text-xs font-bold text-slate-900 mt-2">Export Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12 bg-slate-50 p-8 rounded-2xl border border-slate-100">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Details</label>
            <p className="text-xl font-bold text-slate-900 mt-1">{employee.name}</p>
            <p className="text-sm font-medium text-slate-600">ID: {employee.id}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignment</label>
            <p className="text-lg font-bold text-slate-900 mt-1">{employee.department}</p>
            <p className="text-sm font-medium text-slate-600">{employee.position}</p>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-900">
              <th className="py-4">Course Descriptor</th>
              <th className="py-4">Record Date</th>
              <th className="py-4 text-center">Duration</th>
              <th className="py-4 text-right">Venue / Lead</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trainingHistory.map((item, idx) => (
              <tr key={idx} className="text-xs">
                <td className="py-5 font-bold text-slate-900 pr-6">{item.courseName}</td>
                <td className="py-5 font-mono text-slate-600">{item.date}</td>
                <td className="py-5 text-center font-black text-slate-900">{item.hours} hrs</td>
                <td className="py-5 text-right">
                  <p className="font-bold text-slate-800">{item.trainer}</p>
                  <p className="text-[10px] text-slate-400 italic">{item.location}</p>
                </td>
              </tr>
            ))}
            {trainingHistory.length === 0 && (
              <tr><td colSpan={4} className="py-20 text-center text-slate-400 italic">No validated attendance records on file for this ID.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 bg-slate-50/50">
              <td colSpan={2} className="py-6 text-right font-black uppercase text-[10px] tracking-widest text-slate-500">Total Validated Credit Hours:</td>
              <td className="py-6 text-center text-2xl font-black text-blue-600">{totalHrs}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-40 grid grid-cols-2 gap-32">
          <div className="border-t border-slate-300 pt-2 text-[10px] font-black uppercase text-slate-400 text-center">Employee Signature</div>
          <div className="border-t border-slate-300 pt-2 text-[10px] font-black uppercase text-slate-400 text-center">HR Administrator Date</div>
        </div>
      </div>
    </div>
  );
};

const ManualHistoryForm: React.FC<{ onSuccess: () => void; db: AppState }> = ({ onSuccess, db }) => {
  const [formData, setFormData] = useState({ 
    employeeId: '', 
    courseCode: db.courses[0]?.code || '', 
    date: new Date().toISOString().split('T')[0], 
    hours: 8,
    trainer: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.courseCode) return;
    Database.addManualHistory(formData);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 text-[10px] font-black uppercase">
        Rapid Entry Mode - Directly updates compliance log
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Staff</label>
        <select 
          className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.employeeId}
          onChange={e => setFormData({...formData, employeeId: e.target.value})}
          required
        >
          <option value="">Choose Employee...</option>
          {db.employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Curriculum</label>
        <select 
          className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.courseCode}
          onChange={e => setFormData({...formData, courseCode: e.target.value})}
          required
        >
          {db.courses.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
          <input type="date" className="w-full border rounded-lg p-3" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Credit Hrs</label>
          <input type="number" className="w-full border rounded-lg p-3" value={formData.hours} onChange={e => setFormData({...formData, hours: Number(e.target.value)})} required />
        </div>
      </div>
      <button className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg mt-4 hover:bg-slate-800 transition-all">
        Finalize Manual Entry
      </button>
    </form>
  );
};

// --- Import Center Sub-View ---

const ImportView: React.FC = () => {
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
            <Badge type="info">XLSX / CSV Ready</Badge>
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
              
              <div className="bg-slate-50 border rounded-xl overflow-hidden mb-3">
                <table className="w-full text-[10px] text-left">
                  <thead className="bg-slate-200/50 font-black uppercase text-slate-500 border-b">
                    <tr>
                      <th className="px-3 py-2">EmployeeID</th>
                      <th className="px-3 py-2">CourseCode</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-slate-400">
                    <tr>
                      <td className="px-3 py-2">EMP001</td>
                      <td className="px-3 py-2">SEC101</td>
                      <td className="px-3 py-2">2023-12-01</td>
                      <td className="px-3 py-2">4</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <input type="file" className="text-xs file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white cursor-pointer w-full" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'history')} />
            </div>

            {/* Employee Import */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-black text-slate-900">2. Employee Master</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Upload personnel directory</p>
                </div>
                <button onClick={() => ExcelService.downloadTemplate('employee')} className="text-blue-600 flex items-center gap-1 text-[10px] font-black uppercase hover:underline"><Download size={14}/> Template</button>
              </div>

              <div className="bg-slate-50 border rounded-xl overflow-hidden mb-3">
                <table className="w-full text-[10px] text-left">
                  <thead className="bg-slate-200/50 font-black uppercase text-slate-500 border-b">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2">Position</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-slate-400">
                    <tr>
                      <td className="px-3 py-2">E123</td>
                      <td className="px-3 py-2">Alex Doe</td>
                      <td className="px-3 py-2">Engineering</td>
                      <td className="px-3 py-2">Staff Eng</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <input type="file" className="text-xs file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-900 file:text-white cursor-pointer w-full" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'employee')} />
            </div>
          </div>
        </Card>

        <Card className="bg-blue-900 text-white border-none shadow-xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg"><HelpCircle size={20}/></div>
              <h4 className="font-black text-sm uppercase tracking-widest">Infallible Ingestion Rules</h4>
           </div>
           <ul className="space-y-3 text-xs opacity-80 font-medium">
              <li className="flex gap-2"><span>•</span> <strong>Employee ID Match:</strong> Must match existing records exactly (Case-Insensitive).</li>
              <li className="flex gap-2"><span>•</span> <strong>Date Standards:</strong> Use YYYY-MM-DD or MM/DD/YYYY formats.</li>
              <li className="flex gap-2"><span>•</span> <strong>Required Columns:</strong> Do not rename the headers shown in the guide tables.</li>
           </ul>
        </Card>
      </div>

      <Card className="bg-slate-900 text-white font-mono p-6 rounded-2xl text-[10px] overflow-y-auto max-h-[700px] border-none shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
          <h4 className="text-slate-500 font-black uppercase tracking-[0.2em]">Runtime Terminal Output</h4>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={i} className={`p-2 rounded border-l-2 ${log.type === 'error' ? 'text-red-400 bg-red-400/5 border-red-500' : 'text-emerald-400 bg-emerald-400/5 border-emerald-500'}`}>
              <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString()}]</span>
              <span className="font-bold">{log.type === 'error' ? 'ERR_PROC_FAILURE' : 'SYNC_COMPLETE'}</span>: {log.msg}
            </div>
          ))}
          {uploading && <div className="text-blue-400 animate-pulse mt-4 font-bold">> PARSING_BINARY_BLOB...</div>}
          {logs.length === 0 && <p className="text-slate-700 italic">> Awaiting Excel payload sequence...</p>}
        </div>
      </Card>
    </div>
  );
};

// --- Main App Controller ---

export default function App() {
  const db = useDatabase();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'courses' | 'registrations' | 'import'>('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeModal, setActiveModal] = useState<'session' | 'enroll' | 'hours' | 'history' | 'addEmp' | 'addCourse' | null>(null);

  const renderTabContent = () => {
    if (selectedEmployee) return <EmployeeTrainingReport employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} db={db} />;

    switch (activeTab) {
      case 'dashboard': return <DashboardView db={db} />;
      case 'employees': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black">Personnel Registry</h2>
            <button onClick={() => setActiveModal('addEmp')} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 transition-all"><Plus size={20}/> Add Profile</button>
          </div>
          <Card>
            <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100"><th className="px-4 py-4">ID</th><th className="px-4 py-4">Full Name</th><th className="px-4 py-4">Department</th><th className="px-4 py-4 text-right">Audit</th></tr></thead><tbody className="divide-y divide-slate-100">{db.employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-5 font-mono font-black text-blue-600">{emp.id}</td>
                <td className="px-4 py-5 font-bold text-slate-900">{emp.name}</td>
                <td className="px-4 py-5 text-slate-500 font-medium">{emp.department}</td>
                <td className="px-4 py-5 text-right"><button onClick={() => setSelectedEmployee(emp)} className="p-3 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 shadow-sm transition-all"><FileText size={18}/></button></td>
              </tr>
            ))}</tbody></table></div>
          </Card>
        </div>
      );
      case 'courses': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black">Curriculum Pool</h2>
            <button onClick={() => setActiveModal('addCourse')} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 font-bold shadow-lg transition-all"><Plus size={20}/> Define Curriculum</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{db.courses.map(c => (
            <Card key={c.code} className="hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start mb-5"><Badge type="info">{c.category}</Badge><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{c.code}</span></div>
              <h4 className="font-black text-slate-900 text-lg leading-tight mb-4">{c.name}</h4>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50"><div className="flex items-center gap-2 text-slate-500 font-bold text-xs"><Calendar size={14} className="text-blue-600"/> {c.totalHours} Hrs</div>{c.validityMonths && <Badge type="warning">{c.validityMonths}mo valid</Badge>}</div>
            </Card>
          ))}</div>
        </div>
      );
      case 'registrations': return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card onClick={() => setActiveModal('session')} className="flex flex-col items-center justify-center py-10 text-center gap-3 group bg-blue-50/30 border-blue-100">
              <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><Calendar size={24}/></div>
              <p className="font-black text-slate-900">New Session</p>
            </Card>
            <Card onClick={() => setActiveModal('enroll')} className="flex flex-col items-center justify-center py-10 text-center gap-3 group bg-purple-50/30 border-purple-100">
              <div className="p-4 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-100"><UserPlus size={24}/></div>
              <p className="font-black text-slate-900">Enroll Staff</p>
            </Card>
            <Card onClick={() => setActiveModal('hours')} className="flex flex-col items-center justify-center py-10 text-center gap-3 group bg-emerald-50/30 border-emerald-100">
              <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100"><ClipboardCheck size={24}/></div>
              <p className="font-black text-slate-900">Log Hours</p>
            </Card>
            <Card onClick={() => setActiveModal('history')} className="flex flex-col items-center justify-center py-10 text-center gap-3 group bg-slate-900 border-slate-800 text-white shadow-xl">
              <div className="p-4 bg-white text-slate-900 rounded-2xl shadow-lg"><History size={24}/></div>
              <p className="font-black">Quick History</p>
            </Card>
          </div>
          <Card>
            <h3 className="font-black mb-6 flex items-center gap-2 text-slate-800"><TableIcon size={18} className="text-blue-600"/> Latest Enrollment Context</h3>
            <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400"><th className="px-4 py-4">Employee</th><th className="px-4 py-4">Course Ref</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Completion</th></tr></thead><tbody className="divide-y divide-slate-100">{db.registrations.slice(-12).reverse().map(reg => {
              const emp = db.employees.find(e => String(e.id).trim().toLowerCase() === String(reg.employeeId).trim().toLowerCase());
              const session = db.sessions.find(s => s.id === reg.sessionId);
              const course = db.courses.find(c => String(c.code).trim().toLowerCase() === String(session?.courseCode).trim().toLowerCase());
              const totalAtt = db.attendance.filter(a => a.registrationId === reg.id).reduce((s, a) => s + a.hours, 0);
              return <tr key={reg.id} className="text-sm font-medium"><td className="px-4 py-5 font-black text-slate-900">{emp?.name || reg.employeeId}</td><td className="px-4 py-5 font-bold">{course?.name}</td><td className="px-4 py-5"><Badge type={reg.status === AttendanceStatus.ATTENDED ? 'success' : 'warning'}>{reg.status}</Badge></td><td className="px-4 py-5 font-mono font-black text-slate-900">{totalAtt} / {course?.totalHours || '?'} H</td></tr>
            })}</tbody></table></div>
          </Card>
        </div>
      );
      case 'import': return <ImportView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 print:hidden">
        <div className="flex items-center space-x-3 mb-12 px-2">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100"><LayoutDashboard size={24} /></div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">MLT <span className="text-blue-600">LMS</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'dashboard' && !selectedEmployee} onClick={() => { setActiveTab('dashboard'); setSelectedEmployee(null); }} />
          <SidebarItem icon={<Users size={20}/>} label="Personnel" active={activeTab === 'employees' || selectedEmployee !== null} onClick={() => { setActiveTab('employees'); setSelectedEmployee(null); }} />
          <SidebarItem icon={<ClipboardCheck size={20}/>} label="Workflows" active={activeTab === 'registrations'} onClick={() => { setActiveTab('registrations'); setSelectedEmployee(null); }} />
          <SidebarItem icon={<BookOpen size={20}/>} label="Catalog" active={activeTab === 'courses'} onClick={() => { setActiveTab('courses'); setSelectedEmployee(null); }} />
          <SidebarItem icon={<FileUp size={20}/>} label="Import Center" active={activeTab === 'import'} onClick={() => { setActiveTab('import'); setSelectedEmployee(null); }} />
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-100">
           <div className="p-4 bg-slate-900 text-white rounded-2xl">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Authenticated As</p>
              <p className="text-sm font-black">Super Admin</p>
           </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50 print:bg-white relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold tracking-wider uppercase">
            <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setActiveTab('dashboard')}>Home</span>
            <ChevronRight size={14} />
            <span className="text-slate-900">{selectedEmployee ? 'Audit Workspace' : activeTab}</span>
          </div>
          <div className="flex items-center gap-4">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff&bold=true" className="w-10 h-10 rounded-2xl shadow-sm border-2 border-white" />
          </div>
        </header>

        <div className="p-10 print:p-0">
          {renderTabContent()}
        </div>
      </main>

      {/* Shared Modals */}
      <Modal isOpen={activeModal === 'session'} onClose={() => setActiveModal(null)} title="Schedule Training Session">
        <form onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          Database.addSession({
            id: `SESS_${Math.random().toString(36).substr(2, 6)}`,
            courseCode: String(d.get('course')),
            startDate: String(d.get('date')),
            endDate: String(d.get('date')),
            location: String(d.get('loc')),
            trainer: String(d.get('trainer'))
          });
          setActiveModal(null);
        }} className="space-y-4">
          <div><label className="text-xs font-black text-slate-400 uppercase">Curriculum</label>
          <select name="course" className="w-full border rounded-lg p-3 mt-1">{db.courses.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Target Date</label><input name="date" type="date" className="w-full border rounded-lg p-3 mt-1" required /></div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Venue</label><input name="loc" className="w-full border rounded-lg p-3 mt-1" required /></div>
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg mt-4">Publish Session</button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'enroll'} onClose={() => setActiveModal(null)} title="Staff Enrollment">
        <form onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          Database.registerEmployee({
            id: `REG_${Math.random().toString(36).substr(2, 6)}`,
            employeeId: String(d.get('emp')),
            sessionId: String(d.get('sess')),
            status: AttendanceStatus.REGISTERED
          });
          setActiveModal(null);
        }} className="space-y-4">
          <div><label className="text-xs font-black text-slate-400 uppercase">Employee</label>
          <select name="emp" className="w-full border rounded-lg p-3 mt-1" required><option value="">Select...</option>{db.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Live Session</label>
          <select name="sess" className="w-full border rounded-lg p-3 mt-1" required><option value="">Select...</option>{db.sessions.map(s => <option key={s.id} value={s.id}>{db.courses.find(c => c.code === s.courseCode)?.name} ({s.startDate})</option>)}</select></div>
          <button className="w-full bg-purple-600 text-white font-black py-4 rounded-xl shadow-lg mt-4">Confirm Enrollment</button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'hours'} onClose={() => setActiveModal(null)} title="Log Attendance">
        <form onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          Database.recordAttendance({
            id: `ATT_${Math.random().toString(36).substr(2, 6)}`,
            registrationId: String(d.get('reg')),
            date: String(d.get('date')),
            hours: Number(d.get('hrs'))
          });
          setActiveModal(null);
        }} className="space-y-4">
          <div><label className="text-xs font-black text-slate-400 uppercase">Enrollment Record</label>
          <select name="reg" className="w-full border rounded-lg p-3 mt-1" required><option value="">Select...</option>{db.registrations.map(r => <option key={r.id} value={r.id}>{db.employees.find(e => e.id === r.employeeId)?.name} - {db.courses.find(c => c.code === db.sessions.find(s => s.id === r.sessionId)?.courseCode)?.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-black text-slate-400 uppercase">Date</label><input name="date" type="date" className="w-full border rounded-lg p-3 mt-1" required /></div>
            <div><label className="text-xs font-black text-slate-400 uppercase">Credit (H)</label><input name="hrs" type="number" className="w-full border rounded-lg p-3 mt-1" required /></div>
          </div>
          <button className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg mt-4">Save Record</button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'history'} onClose={() => setActiveModal(null)} title="Quick Manual Entry">
        <ManualHistoryForm db={db} onSuccess={() => setActiveModal(null)} />
      </Modal>

      <Modal isOpen={activeModal === 'addEmp'} onClose={() => setActiveModal(null)} title="Register New Personnel">
        <form onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          Database.addEmployee({ id: String(d.get('id')), name: String(d.get('name')), department: String(d.get('dept')), position: String(d.get('pos')) });
          setActiveModal(null);
        }} className="space-y-4">
          <div><label className="text-xs font-black text-slate-400 uppercase">Personnel ID</label><input name="id" className="w-full border rounded-lg p-3 mt-1" required /></div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Full Name</label><input name="name" className="w-full border rounded-lg p-3 mt-1" required /></div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Department</label><select name="dept" className="w-full border rounded-lg p-3 mt-1">{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Job Title</label><input name="pos" className="w-full border rounded-lg p-3 mt-1" required /></div>
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-xl mt-4 shadow-lg">Create Profile</button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'addCourse'} onClose={() => setActiveModal(null)} title="Define New Curriculum">
        <form onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          Database.addCourse({ code: String(d.get('code')), name: String(d.get('name')), category: String(d.get('cat')), totalHours: Number(d.get('hrs')), validityMonths: d.get('val') ? Number(d.get('val')) : undefined });
          setActiveModal(null);
        }} className="space-y-4">
          <div><label className="text-xs font-black text-slate-400 uppercase">Curriculum Code</label><input name="code" className="w-full border rounded-lg p-3 mt-1" required /></div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Subject Name</label><input name="name" className="w-full border rounded-lg p-3 mt-1" required /></div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Category</label><select name="cat" className="w-full border rounded-lg p-3 mt-1">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-black text-slate-400 uppercase">Total Hrs</label><input name="hrs" type="number" className="w-full border rounded-lg p-3 mt-1" required /></div>
            <div><label className="text-xs font-black text-slate-400 uppercase">Validity (Mos)</label><input name="val" type="number" className="w-full border rounded-lg p-3 mt-1" /></div>
          </div>
          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-xl mt-4 shadow-lg">Publish Curriculum</button>
        </form>
      </Modal>

      <style>{`
        @media print {
          aside, header, .print:hidden, button, select, input { display: none !important; }
          main { overflow: visible !important; }
          .p-10 { padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all ${
      active ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 font-bold' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
    }`}
  >
    <div className={`${active ? 'text-white' : 'text-slate-400'}`}>{icon}</div>
    <span className="text-sm tracking-tight">{label}</span>
  </button>
);

const DashboardView: React.FC<{ db: AppState }> = ({ db }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const totalHrs = db.attendance.reduce((s, a) => s + a.hours, 0);

  useEffect(() => {
    const fetchInsights = async () => {
      if (db.attendance.length === 0) return;
      setLoading(true);
      try {
        const data = await getTrainingInsights();
        setInsights(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchInsights();
  }, [db.attendance.length]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 border-l-4 border-l-blue-600"><div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24}/></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Staff</p><p className="text-2xl font-black">{db.employees.length}</p></div></Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-green-600"><div className="p-3 bg-green-50 text-green-600 rounded-lg"><BookOpen size={24}/></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Curriculums</p><p className="text-2xl font-black">{db.courses.length}</p></div></Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-purple-600"><div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={24}/></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Sessions</p><p className="text-2xl font-black">{db.sessions.length}</p></div></Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-orange-600"><div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><BarChart3 size={24}/></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Credit Hours</p><p className="text-2xl font-black">{totalHrs}</p></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 text-lg"><BrainCircuit className="text-blue-600" size={20}/> AI Training Strategy</h3>
            {loading && <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>}
          </div>
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-5 bg-slate-50 border border-slate-100 rounded-xl flex gap-5 hover:border-blue-200 transition-colors">
                <div className="bg-white p-3 rounded-lg shadow-sm self-start text-blue-600 font-black text-lg h-12 w-12 flex items-center justify-center border border-slate-100">{idx + 1}</div>
                <div>
                  <p className="font-black text-slate-900 leading-tight">{insight.title}</p>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{insight.insight}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Impact Score</span>
                    <p className="text-xs text-slate-800 font-bold">{insight.impact}</p>
                  </div>
                </div>
              </div>
            ))}
            {insights.length === 0 && !loading && (
              <div className="py-20 text-center">
                <BrainCircuit size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 italic">Generate insights by logging more employee attendance records.</p>
              </div>
            )}
          </div>
        </Card>
        <Card>
          <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-800"><CheckCircle2 className="text-green-600" size={18}/> Verification Stream</h3>
          <div className="space-y-5">
            {db.attendance.slice(-6).reverse().map(att => {
              const reg = db.registrations.find(r => r.id === att.registrationId);
              const emp = db.employees.find(e => String(e.id).trim().toLowerCase() === String(reg?.employeeId).trim().toLowerCase());
              return (
                <div key={att.id} className="flex justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 group">
                  <div>
                    <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{emp?.name || 'Manual Entry'}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{att.date}</p>
                  </div>
                  <Badge type="success">+{att.hours}h</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
