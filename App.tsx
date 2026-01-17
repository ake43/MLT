
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
  Info,
  Table as TableIcon
} from 'lucide-react';
import { Database } from './services/db';
import { ExcelService } from './services/excelService';
import { getTrainingInsights } from './services/geminiService';
import { Employee, Course, TrainingSession, Registration, AttendanceRecord, UserRole } from './types';
import { DEPARTMENTS, CATEGORIES } from './constants';

// --- Helper Components ---

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

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

// --- Specialized Components ---

/**
 * Individual Training Record Report (Audit Friendly)
 */
const EmployeeTrainingReport: React.FC<{ 
  employee: Employee; 
  onBack: () => void;
  role: UserRole;
}> = ({ employee, onBack, role }) => {
  const db = Database.get();
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Link attendance to courses for this employee
  const trainingHistory = useMemo(() => {
    const result: any[] = [];
    const empRegs = db.registrations.filter(r => r.employeeId === employee.id);
    
    empRegs.forEach(reg => {
      const session = db.sessions.find(s => s.id === reg.sessionId);
      if (!session) return;
      const course = db.courses.find(c => c.code === session.courseCode);
      if (!course) return;

      if (filterCategory !== 'All' && course.category !== filterCategory) return;

      const atts = db.attendance.filter(a => a.registrationId === reg.id);
      atts.forEach(att => {
        if (filterDateStart && att.date < filterDateStart) return;
        if (filterDateEnd && att.date > filterDateEnd) return;
        
        result.push({
          courseCode: course.code,
          courseName: course.name,
          category: course.category,
          date: att.date,
          hours: att.hours,
          trainer: session.trainer || 'Internal',
          organizer: session.organizer || 'Company'
        });
      });
    });

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [employee, db, filterDateStart, filterDateEnd, filterCategory]);

  const totalHours = trainingHistory.reduce((sum, item) => sum + item.hours, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls - Hidden on Print */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold">Individual Training Record</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
            <Filter size={14} className="text-slate-400" />
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-transparent focus:outline-none"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input 
            type="date" 
            className="text-xs border rounded-lg px-3 py-1.5 focus:outline-none" 
            value={filterDateStart} 
            onChange={(e) => setFilterDateStart(e.target.value)}
          />
          <span className="text-slate-400 text-xs">to</span>
          <input 
            type="date" 
            className="text-xs border rounded-lg px-3 py-1.5 focus:outline-none" 
            value={filterDateEnd} 
            onChange={(e) => setFilterDateEnd(e.target.value)}
          />
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 font-medium text-sm transition-all"
          >
            <Printer size={16} /> Print Record
          </button>
        </div>
      </div>

      {/* Printable Report Content */}
      <div className="bg-white border border-slate-200 shadow-sm p-10 mx-auto max-w-[210mm] print:border-0 print:shadow-none print:p-0">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">EMPLOYEE TRAINING RECORD</h1>
            <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest">Organizational Compliance Document</p>
          </div>
          <div className="text-right">
             <div className="bg-slate-100 p-2 rounded text-xs font-bold mb-1">AUDIT REF: {employee.id}-{new Date().getFullYear()}</div>
             <p className="text-[10px] text-slate-400">Date of Issue: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Employee Header */}
        <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-6 rounded-lg border border-slate-100">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Employee Name</label>
              <p className="text-lg font-bold text-slate-900">{employee.name}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Employee ID</label>
              <p className="font-semibold">{employee.id}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
              <p className="font-semibold">{employee.department}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Position</label>
              <p className="font-semibold">{employee.position}</p>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-3 text-[10px] font-bold text-slate-900 uppercase pr-4">Course</th>
                <th className="py-3 text-[10px] font-bold text-slate-900 uppercase pr-4">Category</th>
                <th className="py-3 text-[10px] font-bold text-slate-900 uppercase pr-4">Date</th>
                <th className="py-3 text-[10px] font-bold text-slate-900 uppercase pr-4 text-center">Hrs</th>
                <th className="py-3 text-[10px] font-bold text-slate-900 uppercase text-right">Trainer/Organizer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trainingHistory.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 print:hover:bg-transparent">
                  <td className="py-4 pr-4">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{item.courseName}</p>
                    <p className="text-[10px] text-slate-400">{item.courseCode}</p>
                  </td>
                  <td className="py-4 pr-4 text-xs">{item.category}</td>
                  <td className="py-4 pr-4 text-xs font-mono">{item.date}</td>
                  <td className="py-4 pr-4 text-xs text-center font-bold">{item.hours}</td>
                  <td className="py-4 text-xs text-right">
                    <p className="font-medium">{item.trainer}</p>
                    <p className="text-[10px] text-slate-400 italic">{item.organizer}</p>
                  </td>
                </tr>
              ))}
              {trainingHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 italic text-sm">No training records found for the selected filters.</td>
                </tr>
              )}
            </tbody>
            <tfoot>
               <tr className="border-t-2 border-slate-900">
                 <td colSpan={3} className="py-4 text-right font-bold text-sm uppercase">Accumulated Training Hours:</td>
                 <td className="py-4 text-center text-lg font-black text-blue-600">{totalHours}</td>
                 <td></td>
               </tr>
            </tfoot>
          </table>
        </div>

        {/* Audit Signatures */}
        <div className="mt-16 grid grid-cols-3 gap-8">
           <div className="space-y-12">
             <div className="border-b border-slate-400 pb-2 h-10"></div>
             <p className="text-[10px] font-bold text-center uppercase tracking-widest text-slate-500">Employee Signature</p>
           </div>
           <div className="space-y-12">
             <div className="border-b border-slate-400 pb-2 h-10"></div>
             <p className="text-[10px] font-bold text-center uppercase tracking-widest text-slate-500">HR Verification</p>
           </div>
           <div className="space-y-12">
             <div className="border-b border-slate-400 pb-2 h-10"></div>
             <p className="text-[10px] font-bold text-center uppercase tracking-widest text-slate-500">Department Manager</p>
           </div>
        </div>

        <div className="mt-20 text-[8px] text-slate-300 text-center border-t border-slate-50 pt-4 print:mt-10">
          This document is generated by MLT Training Data Management System. Confidential. © {new Date().getFullYear()} MLT Enterprise.
        </div>
      </div>
    </div>
  );
};

// --- Dashboard Component ---

const Dashboard: React.FC = () => {
  const db = Database.get();
  const [insights, setInsights] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const data = await getTrainingInsights();
      setInsights(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const totalHours = db.attendance.reduce((sum, a) => sum + a.hours, 0);

  return (
    <div className="space-y-6 print:hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
          <div><p className="text-slate-500 text-sm">Employees</p><p className="text-2xl font-bold">{db.employees.length}</p></div>
        </Card>
        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><BookOpen size={24} /></div>
          <div><p className="text-slate-500 text-sm">Courses</p><p className="text-2xl font-bold">{db.courses.length}</p></div>
        </Card>
        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={24} /></div>
          <div><p className="text-slate-500 text-sm">Sessions</p><p className="text-2xl font-bold">{db.sessions.length}</p></div>
        </Card>
        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><BarChart3 size={24} /></div>
          <div><p className="text-slate-500 text-sm">Total Training Hrs</p><p className="text-2xl font-bold">{totalHours}</p></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <BrainCircuit className="text-blue-600" size={20} />
              AI Strategic Insights
            </h3>
            <button 
              onClick={fetchInsights}
              disabled={loadingInsights}
              className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          {loadingInsights ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex gap-4">
                   <div className="bg-white p-2 rounded shadow-sm self-start text-blue-600 font-bold">{idx + 1}</div>
                   <div>
                     <p className="font-semibold text-slate-800">{insight.title}</p>
                     <p className="text-sm text-slate-600 mt-1">{insight.insight}</p>
                     <p className="text-xs text-blue-600 mt-2 font-medium">Impact: {insight.impact}</p>
                   </div>
                </div>
              ))}
              {insights.length === 0 && <p className="text-slate-400 text-center py-10">No insights generated yet. Click refresh to begin.</p>}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-bold mb-4">Upcoming Sessions</h3>
          <div className="space-y-4">
            {db.sessions.slice(0, 5).map(session => (
              <div key={session.id} className="flex items-start justify-between pb-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold">{session.courseCode}</p>
                  <p className="text-xs text-slate-500">{session.startDate}</p>
                </div>
                <Badge type="info">Active</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- Employees Directory Page ---

const EmployeesPage: React.FC<{ onViewRecord: (emp: Employee) => void }> = ({ onViewRecord }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState(Database.get().employees);

  useEffect(() => {
    const filtered = Database.get().employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setEmployees(filtered);
  }, [searchTerm]);

  return (
    <Card className="print:hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Employee Directory</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-y border-slate-100">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">ID</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">Department</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">Total Hours</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => {
               const hrs = Database.get().attendance
                 .filter(a => {
                    const reg = Database.get().registrations.find(r => r.id === a.registrationId);
                    return reg?.employeeId === emp.id;
                 })
                 .reduce((sum, a) => sum + a.hours, 0);
               return (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4 font-medium text-blue-600">{emp.id}</td>
                  <td className="px-4 py-4 font-semibold">{emp.name}</td>
                  <td className="px-4 py-4">{emp.department}</td>
                  <td className="px-4 py-4 font-bold">{hrs} hrs</td>
                  <td className="px-4 py-4 text-right">
                    <button 
                      onClick={() => onViewRecord(emp)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-900 hover:text-white transition-all"
                    >
                      <FileText size={14} /> View Record
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const ImportPage: React.FC = () => {
  const [logs, setLogs] = useState<{msg: string, type: 'success' | 'error'}[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File, type: 'employee' | 'course' | 'history') => {
    setUploading(true);
    let errors: string[] = [];
    try {
      if (type === 'employee') errors = await ExcelService.importEmployees(file);
      else if (type === 'course') errors = await ExcelService.importCourses(file);
      else if (type === 'history') errors = await ExcelService.importHistory(file);

      if (errors.length > 0) {
        setLogs(prev => [...errors.map(err => ({ msg: err, type: 'error' as const })), ...prev]);
      } else {
        setLogs(prev => [{ msg: `Successfully imported ${type} data`, type: 'success' as const }, ...prev]);
      }
    } catch (e) {
      setLogs(prev => [{ msg: `Error importing ${type}: ${String(e)}`, type: 'error' as const }, ...prev]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 print:hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-6">Data Import Central</h2>
          <div className="space-y-6">
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 transition-colors group">
              <h3 className="font-semibold mb-2 flex items-center justify-between">
                Employees & History
                <button onClick={() => ExcelService.downloadTemplate('history')} className="text-blue-600 text-xs flex items-center gap-1"><Download size={14}/> Template</button>
              </h3>
              <p className="text-sm text-slate-500 mb-4">Upload employee records or training history Excel files.</p>
              <input 
                type="file" 
                accept=".xlsx" 
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'history')}
              />
            </div>

            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 transition-colors group">
              <h3 className="font-semibold mb-2 flex items-center justify-between">
                Course Master
                <button onClick={() => ExcelService.downloadTemplate('course')} className="text-blue-600 text-xs flex items-center gap-1"><Download size={14}/> Template</button>
              </h3>
              <p className="text-sm text-slate-500 mb-4">Define new courses or update existing ones.</p>
              <input 
                type="file" 
                accept=".xlsx" 
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'course')}
              />
            </div>
          </div>
        </Card>

        <Card className="flex flex-col">
          <h2 className="text-xl font-bold mb-6">Processing Logs</h2>
          <div className="flex-1 bg-slate-900 rounded-lg p-4 font-mono text-xs text-white overflow-y-auto max-h-[400px]">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic">No activity logs yet...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                  <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> {log.msg}
                </div>
              ))
            )}
            {uploading && <div className="text-blue-400 animate-pulse mt-2">Uploading and processing file...</div>}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-6">
          <Info size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold">Import Format Guide</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TableIcon size={16} /> Course Master Format
            </h3>
            <div className="bg-slate-50 p-4 rounded-lg overflow-x-auto">
              <table className="min-w-full text-[11px] font-mono text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 text-left font-bold text-slate-900">Code</th>
                    <th className="py-2 text-left font-bold text-slate-900">Name</th>
                    <th className="py-2 text-left font-bold text-slate-900">Category</th>
                    <th className="py-2 text-left font-bold text-slate-900">Hours</th>
                    <th className="py-2 text-left font-bold text-slate-900">Validity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2">SAFE101</td>
                    <td className="py-2">Fire Safety</td>
                    <td className="py-2">Safety</td>
                    <td className="py-2">4</td>
                    <td className="py-2">24</td>
                  </tr>
                  <tr>
                    <td className="py-2">SOFT202</td>
                    <td className="py-2">Public Speaking</td>
                    <td className="py-2">Soft Skills</td>
                    <td className="py-2">8</td>
                    <td className="py-2 text-slate-400">blank</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">* Validity is optional (months). Categories must match system list.</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TableIcon size={16} /> Training History Format
            </h3>
            <div className="bg-slate-50 p-4 rounded-lg overflow-x-auto">
              <table className="min-w-full text-[11px] font-mono text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 text-left font-bold text-slate-900">EmployeeID</th>
                    <th className="py-2 text-left font-bold text-slate-900">CourseCode</th>
                    <th className="py-2 text-left font-bold text-slate-900">Date</th>
                    <th className="py-2 text-left font-bold text-slate-900">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2">EMP001</td>
                    <td className="py-2">SAFE101</td>
                    <td className="py-2">2024-05-10</td>
                    <td className="py-2">4</td>
                  </tr>
                  <tr>
                    <td className="py-2">EMP002</td>
                    <td className="py-2">SAFE101</td>
                    <td className="py-2">2024-05-10</td>
                    <td className="py-2">2</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">* Dates should be YYYY-MM-DD. Hours represent the specific session duration.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- App Shell ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'courses' | 'import'>('dashboard');
  const [role, setRole] = useState<UserRole>(UserRole.HR);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // If we are looking at a specific employee record, we stay in that view
  const handleViewRecord = (emp: Employee) => {
    setSelectedEmployee(emp);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Hidden on Print */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 print:hidden">
        <div className="flex items-center space-x-2 mb-10 px-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MLT Training</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard' && !selectedEmployee} 
            onClick={() => { setActiveTab('dashboard'); setSelectedEmployee(null); }} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Employees" 
            active={activeTab === 'employees' || selectedEmployee !== null} 
            onClick={() => { setActiveTab('employees'); setSelectedEmployee(null); }} 
          />
          <SidebarItem 
            icon={<BookOpen size={20} />} 
            label="Course Master" 
            active={activeTab === 'courses' && !selectedEmployee} 
            onClick={() => { setActiveTab('courses'); setSelectedEmployee(null); }} 
          />
          <SidebarItem 
            icon={<FileUp size={20} />} 
            label="Import Center" 
            active={activeTab === 'import' && !selectedEmployee} 
            onClick={() => { setActiveTab('import'); setSelectedEmployee(null); }} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Access Level</p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">{role}</span>
              <button onClick={() => setRole(role === UserRole.HR ? UserRole.MANAGER : UserRole.HR)}>
                <Settings size={16} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 print:bg-white">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span>Home</span>
            <ChevronRight size={14} />
            <span className="capitalize font-medium text-slate-900">
              {selectedEmployee ? 'Employee Record' : activeTab}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <AlertCircle size={20} />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold leading-none">Admin User</p>
                <p className="text-xs text-slate-500 mt-1">Global HR Lead</p>
              </div>
              <img src="https://picsum.photos/40/40" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            </div>
          </div>
        </header>

        <div className="p-8 print:p-0">
          {selectedEmployee ? (
            <EmployeeTrainingReport 
              employee={selectedEmployee} 
              onBack={() => setSelectedEmployee(null)} 
              role={role}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'employees' && <EmployeesPage onViewRecord={handleViewRecord} />}
              {activeTab === 'import' && <ImportPage />}
              {activeTab === 'courses' && (
                <Card>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Course Master Data</h2>
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium text-sm">
                      <Plus size={18} /> New Course
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Database.get().courses.map(course => (
                      <div key={course.code} className="p-5 border border-slate-100 rounded-xl hover:shadow-md transition-shadow group bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <Badge type="info">{course.category}</Badge>
                          <span className="text-xs font-bold text-slate-400">{course.code}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{course.name}</h4>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1"><Calendar size={14}/> {course.totalHours} hrs</div>
                          {course.validityMonths && (
                            <div className="flex items-center gap-1 text-amber-600 font-medium">
                              <AlertCircle size={14}/> {course.validityMonths}mo validity
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      {/* Global Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
          }
          aside, header, .print-hidden, button, select, input[type="date"] {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .p-8 {
            padding: 0 !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
}
