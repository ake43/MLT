
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  FileUp, 
  LayoutDashboard,
  Plus,
  Download,
  BrainCircuit,
  ChevronRight,
  Printer,
  FileText,
  ArrowLeft,
  X,
  CheckCircle2,
  UserPlus,
  ClipboardCheck,
  History,
  Table as TableIcon,
  HelpCircle,
  UserCheck,
  Trash2,
  Ban,
  Save,
  AlertTriangle,
  RefreshCw,
  Filter,
  UploadCloud
} from 'lucide-react';
import { Database } from './services/db';
import { ExcelService } from './services/excelService';
import { getTrainingInsights } from './services/geminiService';
import { Employee, Course, TrainingSession, Registration, AttendanceRecord, AttendanceStatus, AppState } from './types';
import { DEPARTMENTS, CATEGORIES } from './constants';
import { ImportView } from './ImportView';

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
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200 transition-all' : ''} ${className}`}>
    {children}
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; type?: 'success' | 'warning' | 'info' | 'error' | 'secondary' }> = ({ children, type = 'info' }) => {
  const styles = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    secondary: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[type]}`}>{children}</span>;
};

// --- Specialized Features ---
const EmployeeTrainingReport: React.FC<{ employee: Employee; onBack: () => void; db: AppState }> = ({ employee, onBack, db }) => {
  const trainingHistory = useMemo(() => {
    const result: any[] = [];
    const empId = String(employee.id).trim().toLowerCase();
    const registrations = db.registrations.filter(r => String(r.employeeId).trim().toLowerCase() === empId);
    registrations.forEach(reg => {
      const session = db.sessions.find(s => s.id === reg.sessionId);
      if (!session) return;
      const course = db.courses.find(c => String(c.code).trim().toLowerCase() === String(session.courseCode).trim().toLowerCase());
      if (!course) return;
      const atts = db.attendance.filter(a => a.registrationId === reg.id);
      atts.forEach(att => {
        result.push({ courseNameTh: course.nameTh, courseNameEn: course.nameEn, date: att.date, hours: att.hours, trainer: session.trainer || 'Internal', location: session.location });
      });
    });
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [employee.id, db]);
  const totalHrs = trainingHistory.reduce((s, i) => s + i.hours, 0);
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 print:hidden">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-bold">Audit: {employee.nameEn}</h2>
        <button onClick={() => window.print()} className="ml-auto bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg"><Printer size={16}/> Print</button>
      </div>
      <div className="bg-white p-12 border border-slate-200 shadow-sm max-w-[210mm] mx-auto min-h-[297mm]">
        <div className="border-b-4 border-slate-900 pb-8 mb-10 flex justify-between items-start">
          <div><h1 className="text-3xl font-black text-slate-900 uppercase">TRAINING AUDIT LOG</h1></div>
          <Badge type={employee.isActive ? 'info' : 'secondary'}>{employee.isActive ? 'ACTIVE' : 'RESIGNED'}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-12 mb-12 bg-slate-50 p-8 rounded-2xl">
          <div><p className="text-xl font-bold">{employee.nameEn}</p><p className="text-md text-slate-600 italic">{employee.nameTh}</p><p className="text-sm mt-2">ID: {employee.id}</p></div>
          <div><p className="text-lg font-bold">{employee.department}</p><p className="text-sm">{employee.position}</p></div>
        </div>
        <table className="w-full text-left">
          <thead className="border-b-2 border-slate-900 text-[10px] font-black uppercase"><tr><th className="py-4">Course</th><th className="py-4">Date</th><th className="py-4 text-center">Hrs</th><th className="py-4 text-right">Venue</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {trainingHistory.map((item, idx) => (
              <tr key={idx} className="text-xs">
                <td className="py-5 pr-6"><p className="font-bold">{item.courseNameEn}</p><p className="text-slate-500 italic">{item.courseNameTh}</p></td>
                <td className="py-5">{item.date}</td><td className="py-5 text-center font-black">{item.hours}</td><td className="py-5 text-right">{item.trainer}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t-2 border-slate-900"><td colSpan={2} className="py-6 text-right font-black">Total Credit Hours:</td><td className="py-6 text-center text-2xl font-black text-blue-600">{totalHrs}</td><td></td></tr></tfoot>
        </table>
      </div>
    </div>
  );
};

// --- Main App Controller ---
export default function App() {
  const db = useDatabase();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'courses' | 'registrations' | 'import'>('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeModal, setActiveModal] = useState<'session' | 'enroll' | 'hours' | 'history' | 'addEmp' | 'addCourse' | 'confirmDelete' | null>(null);
  const [empFilter, setEmpFilter] = useState<'active' | 'resigned' | 'all'>('active');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [employeeToTarget, setEmployeeToTarget] = useState<string | null>(null);

  const handleOpenDeleteConfirm = (id: string) => {
    setEmployeeToTarget(id);
    setActiveModal('confirmDelete');
  };

  const executeDelete = () => {
    if (employeeToTarget) {
      Database.deleteEmployee(employeeToTarget);
      setActiveModal(null);
      setEmployeeToTarget(null);
    }
  };

  const handleBackup = () => {
    Database.exportData();
  };

  const handleRestore = async (file: File) => {
    try {
      await Database.importData(file);
      window.location.reload(); // Reload to refresh all state
    } catch (e) {
      alert("Failed to restore: " + (e as Error).message);
    }
  };

  const filteredEmployees = useMemo(() => {
    return db.employees.filter(emp => {
      const matchesStatus = empFilter === 'all' ? true : empFilter === 'active' ? emp.isActive : !emp.isActive;
      const matchesDept = selectedDept === 'all' ? true : emp.department === selectedDept;
      return matchesStatus && matchesDept;
    });
  }, [db.employees, empFilter, selectedDept]);

  const renderTabContent = () => {
    if (selectedEmployee) return <EmployeeTrainingReport employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} db={db} />;
    switch (activeTab) {
      case 'dashboard': return <DashboardView db={db} onBackup={handleBackup} onRestore={handleRestore} />;
      case 'employees': return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-black">Employee Registry</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                <Filter size={16} className="text-slate-400" />
                <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer">
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setEmpFilter('active')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${empFilter === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ACTIVE</button>
                <button onClick={() => setEmpFilter('resigned')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${empFilter === 'resigned' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>RESIGNED</button>
                <button onClick={() => setEmpFilter('all')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${empFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ALL</button>
              </div>
              <button onClick={() => setActiveModal('addEmp')} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold shadow-lg transition-all"><Plus size={20}/> Add Profile</button>
            </div>
          </div>
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100"><tr className="text-[10px] font-black uppercase tracking-widest text-slate-400"><th className="px-6 py-4">Status</th><th className="px-6 py-4">ID</th><th className="px-6 py-4">Full Name</th><th className="px-6 py-4">Department</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className={`hover:bg-slate-50 transition-colors ${!emp.isActive ? 'bg-slate-50/50 grayscale-[0.5]' : ''}`}>
                      <td className="px-6 py-5"><Badge type={emp.isActive ? 'success' : 'secondary'}>{emp.isActive ? 'Active' : 'Resigned'}</Badge></td>
                      <td className={`px-6 py-5 font-mono font-black ${emp.isActive ? 'text-blue-600' : 'text-slate-400'}`}>{emp.id}</td>
                      <td className="px-6 py-5"><p className="font-bold">{emp.nameEn}</p><p className="text-xs text-slate-400 italic">{emp.nameTh}</p></td>
                      <td className="px-6 py-5 text-slate-500 font-medium">{emp.department}</td>
                      <td className="px-6 py-5 text-right flex justify-end gap-2">
                        <button onClick={() => setSelectedEmployee(emp)} className="p-2.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 shadow-sm transition-all"><FileText size={18}/></button>
                        <button onClick={() => Database.toggleEmployeeStatus(emp.id)} className={`p-2.5 border rounded-xl shadow-sm transition-all ${emp.isActive ? 'text-slate-400 hover:text-amber-600' : 'text-amber-600 bg-amber-50'}`}>{emp.isActive ? <Ban size={18}/> : <UserCheck size={18}/>}</button>
                        <button onClick={() => handleOpenDeleteConfirm(emp.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent rounded-xl shadow-sm transition-all"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium italic">No employees found for this filter combination.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      );
      case 'courses': return <CoursesView db={db} onAdd={() => setActiveModal('addCourse')} />;
      case 'registrations': return <RegistrationsView db={db} onModal={(m) => setActiveModal(m)} />;
      case 'import': return <ImportView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 print:hidden">
        <div className="flex items-center space-x-3 mb-12 px-2">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg"><LayoutDashboard size={24} /></div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">MLT <span className="text-blue-600">LMS</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setSelectedEmployee(null);}} />
          <SidebarItem icon={<Users size={20}/>} label="Employees" active={activeTab === 'employees'} onClick={() => {setActiveTab('employees'); setSelectedEmployee(null);}} />
          <SidebarItem icon={<ClipboardCheck size={20}/>} label="Workflows" active={activeTab === 'registrations'} onClick={() => setActiveTab('registrations')} />
          <SidebarItem icon={<BookOpen size={20}/>} label="Catalog" active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} />
          <SidebarItem icon={<FileUp size={20}/>} label="Import Center" active={activeTab === 'import'} onClick={() => setActiveTab('import')} />
        </nav>
        <button onClick={handleBackup} className="mt-auto flex items-center gap-3 px-5 py-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all font-bold text-xs"><Save size={16}/> Backup Database</button>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold tracking-wider uppercase">
            <span>Home</span><ChevronRight size={14} /><span className="text-slate-900 uppercase font-black">{activeTab}</span>
          </div>
        </header>
        <div className="p-10">{renderTabContent()}</div>
      </main>

      {/* Confirmation Modal */}
      <Modal isOpen={activeModal === 'confirmDelete'} onClose={() => setActiveModal(null)} title="ยืนยันการลบพนักงาน">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-red-50 rounded-full text-red-600"><AlertTriangle size={48} /></div>
          <p className="text-sm text-slate-600 leading-relaxed">
            คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานรายนี้? <br/>
            <span className="font-bold text-red-600">⚠️ คำเตือน: ประวัติการอบรมและเวลาเรียนทั้งหมดจะถูกลบอย่างถาวรและไม่สามารถเรียกคืนได้</span>
          </p>
          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            <button onClick={() => setActiveModal(null)} className="px-4 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all">ยกเลิก</button>
            <button onClick={executeDelete} className="px-4 py-3 bg-red-600 rounded-xl font-bold text-white hover:bg-red-700 shadow-lg shadow-red-100 transition-all">ยืนยันการลบ</button>
          </div>
        </div>
      </Modal>

      {/* Other Modals (Same as before but keeping code compact) */}
      <Modal isOpen={activeModal === 'addEmp'} onClose={() => setActiveModal(null)} title="New Employee Profile">
        <form onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); Database.addEmployee({ id: String(d.get('id')), nameTh: String(d.get('nameTh')), nameEn: String(d.get('nameEn')), department: String(d.get('dept')), position: String(d.get('pos')), isActive: true }); setActiveModal(null); }} className="space-y-4">
          <div><label className="text-xs font-black text-slate-400 uppercase">Personnel ID</label><input name="id" className="w-full border rounded-lg p-3 mt-1 outline-none" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-black text-slate-400 uppercase">ชื่อ (ไทย)</label><input name="nameTh" className="w-full border rounded-lg p-3 mt-1 outline-none" required /></div>
            <div><label className="text-xs font-black text-slate-400 uppercase">Full Name (EN)</label><input name="nameEn" className="w-full border rounded-lg p-3 mt-1 outline-none" required /></div>
          </div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Department</label><select name="dept" className="w-full border rounded-lg p-3 mt-1 outline-none">{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Position</label><input name="pos" className="w-full border rounded-lg p-3 mt-1 outline-none" required /></div>
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg mt-4">Register Employee</button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'addCourse'} onClose={() => setActiveModal(null)} title="Publish New Course">
        <form onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); Database.addCourse({ code: String(d.get('code')), nameTh: String(d.get('nameTh')), nameEn: String(d.get('nameEn')), category: String(d.get('cat')), totalHours: Number(d.get('hrs')), validityMonths: d.get('val') ? Number(d.get('val')) : undefined }); setActiveModal(null); }} className="space-y-4">
          <div><label className="text-xs font-black text-slate-400 uppercase">Course Code</label><input name="code" className="w-full border rounded-lg p-3 mt-1 outline-none" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-black text-slate-400 uppercase">ชื่อคอร์ส (ไทย)</label><input name="nameTh" className="w-full border rounded-lg p-3 mt-1 outline-none" required /></div>
            <div><label className="text-xs font-black text-slate-400 uppercase">Course Name (EN)</label><input name="nameEn" className="w-full border rounded-lg p-3 mt-1 outline-none" required /></div>
          </div>
          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg mt-4">Publish Course</button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'session'} onClose={() => setActiveModal(null)} title="Schedule Session">
        <form onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); Database.addSession({ id: `SESS_${Math.random().toString(36).substr(2, 6)}`, courseCode: String(d.get('course')), startDate: String(d.get('date')), endDate: String(d.get('date')), location: String(d.get('loc')), trainer: String(d.get('trainer')) }); setActiveModal(null); }} className="space-y-4">
          <div><label className="text-xs font-black text-slate-400 uppercase">Select Course</label><select name="course" className="w-full border rounded-lg p-3 mt-1 outline-none">{db.courses.map(c => <option key={c.code} value={c.code}>{c.nameEn}</option>)}</select></div>
          <div><label className="text-xs font-black text-slate-400 uppercase">Date</label><input name="date" type="date" className="w-full border rounded-lg p-3 mt-1 outline-none" required /></div>
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg mt-4">Broadcast Session</button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'enroll'} onClose={() => setActiveModal(null)} title="Staff Enrollment">
        <form onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); Database.registerEmployee({ id: `REG_${Math.random().toString(36).substr(2, 6)}`, employeeId: String(d.get('emp')), sessionId: String(d.get('sess')), status: AttendanceStatus.REGISTERED }); setActiveModal(null); }} className="space-y-4">
          <select name="emp" className="w-full border rounded-lg p-3 mt-1" required>
            <option value="">Select Staff...</option>
            {db.employees.filter(e => e.isActive).map(e => <option key={e.id} value={e.id}>{e.nameEn}</option>)}
          </select>
          <select name="sess" className="w-full border rounded-lg p-3 mt-1" required>
            <option value="">Select Session...</option>
            {db.sessions.map(s => <option key={s.id} value={s.id}>{db.courses.find(c => c.code === s.courseCode)?.nameEn}</option>)}
          </select>
          <button className="w-full bg-purple-600 text-white font-black py-4 rounded-xl shadow-lg mt-4">Confirm Enrollment</button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'hours'} onClose={() => setActiveModal(null)} title="Log Attendance">
        <form onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); Database.recordAttendance({ id: `ATT_${Math.random().toString(36).substr(2, 6)}`, registrationId: String(d.get('reg')), date: String(d.get('date')), hours: Number(d.get('hrs')) }); setActiveModal(null); }} className="space-y-4">
          <select name="reg" className="w-full border rounded-lg p-3 mt-1" required>
            <option value="">Select Enrollment...</option>
            {db.registrations.map(r => {
              const emp = db.employees.find(e => e.id === r.employeeId);
              const sess = db.sessions.find(s => s.id === r.sessionId);
              const course = db.courses.find(c => c.code === sess?.courseCode);
              return <option key={r.id} value={r.id}>{emp?.nameEn} | {course?.nameEn}</option>
            })}
          </select>
          <input name="hrs" type="number" step="0.5" className="w-full border rounded-lg p-3 mt-1" placeholder="Hours" required />
          <button className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg mt-4">Update Attendance</button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'history'} onClose={() => setActiveModal(null)} title="Direct History Entry">
        <ManualHistoryForm db={db} onSuccess={() => setActiveModal(null)} />
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
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 font-bold' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}>
    <div className={`${active ? 'text-white' : 'text-slate-400'}`}>{icon}</div><span className="text-sm font-bold tracking-tight">{label}</span>
  </button>
);

const DashboardView: React.FC<{ db: AppState; onBackup: () => void; onRestore: (file: File) => void }> = ({ db, onBackup, onRestore }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalHrs = db.attendance.reduce((s, a) => s + a.hours, 0);
  const activeStaffCount = db.employees.filter(e => e.isActive).length;

  useEffect(() => {
    const fetchInsights = async () => {
      if (db.attendance.length === 0) return;
      setLoading(true);
      try { const data = await getTrainingInsights(); setInsights(data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchInsights();
  }, [db.attendance.length]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600 shadow-md"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Active Personnel</p><p className="text-2xl font-black text-slate-900">{activeStaffCount} <span className="text-xs text-slate-300 font-normal">/ {db.employees.length}</span></p></Card>
        <Card className="border-l-4 border-l-green-600 shadow-md"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Cataloged Courses</p><p className="text-2xl font-black text-slate-900">{db.courses.length}</p></Card>
        <Card className="border-l-4 border-l-purple-600 shadow-md"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Active Sessions</p><p className="text-2xl font-black text-slate-900">{db.sessions.length}</p></Card>
        <Card className="border-l-4 border-l-orange-600 shadow-md"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Training Hours</p><p className="text-2xl font-black text-slate-900">{totalHrs}</p></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6"><h3 className="font-bold flex items-center gap-2 text-lg text-slate-800"><BrainCircuit className="text-blue-600"/> HR Strategic Analytics</h3>{loading && <RefreshCw className="animate-spin text-blue-600" size={18}/>}</div>
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-5 bg-slate-50 border border-slate-100 rounded-xl flex gap-5 hover:border-blue-200 transition-colors group">
                <div className="bg-white p-3 rounded-lg shadow-sm font-black text-blue-600 h-12 w-12 flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">{idx + 1}</div>
                <div><p className="font-black text-slate-900 leading-tight">{insight.title}</p><p className="text-sm text-slate-600 mt-2 leading-relaxed">{insight.insight}</p></div>
              </div>
            ))}
            {insights.length === 0 && !loading && <div className="py-12 text-center text-slate-300 italic text-sm font-medium border-2 border-dashed border-slate-50 rounded-2xl">Awaiting sufficient attendance data for AI synthesis...</div>}
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-none shadow-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Save className="text-blue-400" size={18}/> Data Continuity</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Protect your data from loss. Use these tools to transfer data between computers.</p>
            <div className="space-y-3">
              <button onClick={onBackup} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"><Download size={18}/> Backup JSON</button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-800 hover:bg-slate-700 text-blue-400 font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-700"><UploadCloud size={18}/> Restore JSON</button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={e => e.target.files?.[0] && onRestore(e.target.files[0])} />
            </div>
          </Card>
          <Card>
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest"><CheckCircle2 className="text-green-600" size={18}/> Events Stream</h3>
            <div className="space-y-4">
              {db.attendance.slice(-5).reverse().map(att => {
                const reg = db.registrations.find(r => r.id === att.registrationId);
                const emp = db.employees.find(e => e.id === reg?.employeeId);
                return (
                  <div key={att.id} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-black text-slate-900">{emp?.nameEn || 'N/A'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{att.date}</p>
                    </div>
                    <Badge type="success">+{att.hours}h</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// (Keeping helper components like CoursesView, RegistrationsView, etc. same as before)
const CoursesView: React.FC<{ db: AppState, onAdd: () => void }> = ({ db, onAdd }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex justify-between items-center"><h2 className="text-2xl font-black text-slate-900">Curriculum Pool</h2><button onClick={onAdd} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 hover:bg-slate-800"><Plus size={20}/> New Course</button></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{db.courses.map(c => (
      <Card key={c.code} className="hover:scale-[1.02] transition-transform">
        <div className="flex justify-between mb-4"><Badge type="info">{c.category}</Badge><span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">{c.code}</span></div>
        <h4 className="font-black text-slate-900 leading-tight">{c.nameEn}</h4><p className="text-sm text-slate-500 italic mb-4">{c.nameTh}</p>
        <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-500"><div className="flex items-center gap-1"><Calendar size={14} className="text-blue-600"/> {c.totalHours} Hrs</div></div>
      </Card>
    ))}</div>
  </div>
);

const RegistrationsView: React.FC<{ db: AppState, onModal: (m: any) => void }> = ({ db, onModal }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <QuickAction icon={<Calendar size={24}/>} label="New Session" color="blue" onClick={() => onModal('session')} />
      <QuickAction icon={<UserPlus size={24}/>} label="Enroll Staff" color="purple" onClick={() => onModal('enroll')} />
      <QuickAction icon={<ClipboardCheck size={24}/>} label="Log Hours" color="emerald" onClick={() => onModal('hours')} />
      <QuickAction icon={<History size={24}/>} label="Quick Entry" color="amber" onClick={() => onModal('history')} />
    </div>
    <Card className="p-0 overflow-hidden">
      <h3 className="font-black p-6 border-b border-slate-100 flex items-center gap-2 text-slate-800 uppercase tracking-widest text-sm"><TableIcon size={18} className="text-blue-600"/> Enrollment Stream</h3>
      <div className="overflow-x-auto"><table className="w-full text-left">
        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100"><tr className="px-6"> <th className="px-6 py-4">Employee</th><th className="px-6 py-4">Course</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Validated Hrs</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{db.registrations.slice(-10).reverse().map(reg => {
          const emp = db.employees.find(e => e.id === reg.employeeId);
          const sess = db.sessions.find(s => s.id === reg.sessionId);
          const course = db.courses.find(c => c.code === sess?.courseCode);
          return <tr key={reg.id} className="text-sm font-medium hover:bg-slate-50 transition-colors">
            <td className="px-6 py-5"><p className="font-black text-slate-900">{emp?.nameEn}</p></td>
            <td className="px-6 py-5 text-slate-600">{course?.nameEn}</td>
            <td className="px-6 py-5"><Badge type={reg.status === AttendanceStatus.ATTENDED ? 'success' : 'warning'}>{reg.status}</Badge></td>
            <td className="px-6 py-5 font-mono font-black text-slate-900">{db.attendance.filter(a => a.registrationId === reg.id).reduce((s, a) => s + a.hours, 0)}h</td>
          </tr>
        })}</tbody></table></div>
    </Card>
  </div>
);

const ManualHistoryForm: React.FC<{ onSuccess: () => void; db: AppState }> = ({ onSuccess, db }) => {
  const [formData, setFormData] = useState({ employeeId: '', courseCode: db.courses[0]?.code || '', date: new Date().toISOString().split('T')[0], hours: 8, trainer: '' });
  const activeEmployees = useMemo(() => db.employees.filter(e => e.isActive), [db.employees]);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.employeeId || !formData.courseCode) return; Database.addManualHistory(formData); onSuccess(); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <select className="w-full border rounded-lg p-3" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} required><option value="">Select Staff...</option>{activeEmployees.map(e => <option key={e.id} value={e.id}>{e.nameEn}</option>)}</select>
      <select className="w-full border rounded-lg p-3" value={formData.courseCode} onChange={e => setFormData({...formData, courseCode: e.target.value})} required>{db.courses.map(c => <option key={c.code} value={c.code}>{c.nameEn}</option>)}</select>
      <input type="number" className="w-full border rounded-lg p-3" value={formData.hours} onChange={e => setFormData({...formData, hours: Number(e.target.value)})} required />
      <button className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg mt-4">Publish History Record</button>
    </form>
  );
};

const QuickAction: React.FC<{ icon: React.ReactNode, label: string, color: string, onClick: () => void }> = ({ icon, label, color, onClick }) => {
  const colors: any = { blue: 'bg-blue-600 shadow-blue-100', purple: 'bg-purple-600 shadow-purple-100', emerald: 'bg-emerald-600 shadow-emerald-100', amber: 'bg-amber-600 shadow-amber-100' };
  return (
    <Card onClick={onClick} className="flex flex-col items-center justify-center py-8 gap-3 group hover:border-blue-500/30">
      <div className={`p-4 text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform ${colors[color]}`}>{icon}</div>
      <p className="font-black text-slate-900 uppercase tracking-tight text-xs">{label}</p>
    </Card>
  );
};
