
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
  Table as TableIcon,
  X,
  CheckCircle2,
  UserPlus,
  ClipboardCheck
} from 'lucide-react';
import { Database } from './services/db';
import { ExcelService } from './services/excelService';
import { getTrainingInsights } from './services/geminiService';
import { Employee, Course, TrainingSession, Registration, AttendanceRecord, UserRole, AttendanceStatus } from './types';
import { DEPARTMENTS, CATEGORIES } from './constants';

// --- Global UI Components ---

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

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
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

// --- Form Components ---

const EmployeeForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({ id: '', name: '', department: DEPARTMENTS[0], position: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) return setError('ID and Name are required');
    const success = Database.addEmployee(formData);
    if (success) {
      onSuccess();
    } else {
      setError('Employee ID already exists');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex gap-2 items-center"><AlertCircle size={16}/>{error}</div>}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Employee ID</label>
        <input 
          type="text" 
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="e.g. EMP001"
          value={formData.id}
          onChange={e => setFormData({...formData, id: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
        <input 
          type="text" 
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="John Smith"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Department</label>
        <select 
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.department}
          onChange={e => setFormData({...formData, department: e.target.value})}
        >
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Position</label>
        <input 
          type="text" 
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="Assistant Manager"
          value={formData.position}
          onChange={e => setFormData({...formData, position: e.target.value})}
        />
      </div>
      <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-4">
        Save Employee
      </button>
    </form>
  );
};

const CourseForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({ code: '', name: '', category: CATEGORIES[0], totalHours: 8, validityMonths: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Database.addCourse({
      ...formData,
      validityMonths: formData.validityMonths > 0 ? formData.validityMonths : undefined
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Course Code</label>
        <input 
          type="text" 
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="C101"
          value={formData.code}
          onChange={e => setFormData({...formData, code: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Course Name</label>
        <input 
          type="text" 
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="General Safety Training"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Total Hours</label>
          <input 
            type="number" 
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
            value={formData.totalHours}
            onChange={e => setFormData({...formData, totalHours: Number(e.target.value)})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Validity (Mos)</label>
          <input 
            type="number" 
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="0 = Forever"
            value={formData.validityMonths}
            onChange={e => setFormData({...formData, validityMonths: Number(e.target.value)})}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
        <select 
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.category}
          onChange={e => setFormData({...formData, category: e.target.value})}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg mt-4">
        Create Course
      </button>
    </form>
  );
};

// --- Specialized Components ---

const RegistrationPanel: React.FC = () => {
  const db = Database.get();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  
  // Registration Form State
  const [regData, setRegData] = useState({ empId: '', sessionId: '' });
  const [attData, setAttData] = useState({ regId: '', date: new Date().toISOString().split('T')[0], hours: 1 });
  const [sessionData, setSessionData] = useState({ courseCode: db.courses[0]?.code || '', date: '', location: '', trainer: '', organizer: '' });

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    Database.addSession({
      id: `SESS_${Math.random().toString(36).substr(2, 6)}`,
      courseCode: sessionData.courseCode,
      startDate: sessionData.date,
      endDate: sessionData.date,
      location: sessionData.location,
      trainer: sessionData.trainer,
      organizer: sessionData.organizer
    });
    setShowSessionModal(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.empId || !regData.sessionId) return;
    Database.registerEmployee({
      id: `REG_${Math.random().toString(36).substr(2, 6)}`,
      employeeId: regData.empId,
      sessionId: regData.sessionId,
      status: AttendanceStatus.REGISTERED
    });
    setShowRegModal(false);
  };

  const handleRecordAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attData.regId) return;
    Database.recordAttendance({
      id: `ATT_${Math.random().toString(36).substr(2, 6)}`,
      registrationId: attData.regId,
      date: attData.date,
      hours: attData.hours
    });
    setShowAttModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-blue-300 transition-colors cursor-pointer group" onClick={() => setShowSessionModal(true)}>
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Calendar size={24}/></div>
             <div>
               <p className="font-bold">Create Session</p>
               <p className="text-xs text-slate-500">Define a new training event</p>
             </div>
          </div>
        </Card>
        <Card className="hover:border-purple-300 transition-colors cursor-pointer group" onClick={() => setShowRegModal(true)}>
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all"><UserPlus size={24}/></div>
             <div>
               <p className="font-bold">Register Trainee</p>
               <p className="text-xs text-slate-500">Enroll staff in a session</p>
             </div>
          </div>
        </Card>
        <Card className="hover:border-green-300 transition-colors cursor-pointer group" onClick={() => setShowAttModal(true)}>
          <div className="flex items-center gap-4">
             <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-all"><ClipboardCheck size={24}/></div>
             <div>
               <p className="font-bold">Mark Attendance</p>
               <p className="text-xs text-slate-500">Record training hours</p>
             </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold mb-4">Recent Registrations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Course / Session</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.registrations.slice(-10).reverse().map(reg => {
                const emp = db.employees.find(e => e.id === reg.employeeId);
                const session = db.sessions.find(s => s.id === reg.sessionId);
                const course = db.courses.find(c => c.code === session?.courseCode);
                const totalAtt = db.attendance.filter(a => a.registrationId === reg.id).reduce((s, a) => s + a.hours, 0);
                return (
                  <tr key={reg.id} className="text-sm">
                    <td className="px-4 py-3 font-semibold">{emp?.name || reg.employeeId}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-blue-600">{course?.name}</p>
                      <p className="text-xs text-slate-400">{session?.startDate} @ {session?.location}</p>
                    </td>
                    <td className="px-4 py-3"><Badge type={reg.status === AttendanceStatus.ATTENDED ? 'success' : 'warning'}>{reg.status}</Badge></td>
                    <td className="px-4 py-3 font-mono font-bold">{totalAtt} / {course?.totalHours || '?'} hrs</td>
                  </tr>
                );
              })}
              {db.registrations.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-slate-400 italic">No registrations yet. Start by enrolling a staff member!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <Modal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} title="New Training Session">
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Course</label>
            <select className="w-full border rounded-lg p-2" value={sessionData.courseCode} onChange={e => setSessionData({...sessionData, courseCode: e.target.value})}>
              {db.courses.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
              <input type="date" className="w-full border rounded-lg p-2" value={sessionData.date} onChange={e => setSessionData({...sessionData, date: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Location</label>
              <input type="text" className="w-full border rounded-lg p-2" placeholder="Main Hall" value={sessionData.location} onChange={e => setSessionData({...sessionData, location: e.target.value})}/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Trainer Name</label>
            <input type="text" className="w-full border rounded-lg p-2" placeholder="John Doe" value={sessionData.trainer} onChange={e => setSessionData({...sessionData, trainer: e.target.value})}/>
          </div>
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 mt-2">Publish Session</button>
        </form>
      </Modal>

      <Modal isOpen={showRegModal} onClose={() => setShowRegModal(false)} title="Enroll Employee">
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Employee</label>
            <select className="w-full border rounded-lg p-2" value={regData.empId} onChange={e => setRegData({...regData, empId: e.target.value})}>
              <option value="">Select...</option>
              {db.employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Session</label>
            <select className="w-full border rounded-lg p-2" value={regData.sessionId} onChange={e => setRegData({...regData, sessionId: e.target.value})}>
              <option value="">Select...</option>
              {db.sessions.map(s => {
                const c = db.courses.find(cr => cr.code === s.courseCode);
                return <option key={s.id} value={s.id}>{c?.name} - {s.startDate}</option>
              })}
            </select>
          </div>
          <button className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 mt-2">Create Registration</button>
        </form>
      </Modal>

      <Modal isOpen={showAttModal} onClose={() => setShowAttModal(false)} title="Log Attendance">
        <form onSubmit={handleRecordAttendance} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Registration</label>
            <select className="w-full border rounded-lg p-2" value={attData.regId} onChange={e => setAttData({...attData, regId: e.target.value})}>
              <option value="">Select...</option>
              {db.registrations.filter(r => r.status !== AttendanceStatus.ATTENDED).map(r => {
                const e = db.employees.find(emp => emp.id === r.employeeId);
                const s = db.sessions.find(sess => sess.id === r.sessionId);
                const c = db.courses.find(cr => cr.code === s?.courseCode);
                return <option key={r.id} value={r.id}>{e?.name} - {c?.name}</option>
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
              <input type="date" className="w-full border rounded-lg p-2" value={attData.date} onChange={e => setAttData({...attData, date: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hours Logged</label>
              <input type="number" className="w-full border rounded-lg p-2" value={attData.hours} onChange={e => setAttData({...attData, hours: Number(e.target.value)})}/>
            </div>
          </div>
          <button className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 mt-2">Save Record</button>
        </form>
      </Modal>
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
          <h3 className="font-bold mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-green-600"/> Latest Attendance</h3>
          <div className="space-y-4">
            {db.attendance.slice(-5).reverse().map(att => {
              const reg = db.registrations.find(r => r.id === att.registrationId);
              const emp = db.employees.find(e => e.id === reg?.employeeId);
              return (
                <div key={att.id} className="flex items-start justify-between pb-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-bold">{emp?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{att.date}</p>
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

// --- App Shell ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'courses' | 'registrations' | 'import'>('dashboard');
  const [role, setRole] = useState<UserRole>(UserRole.HR);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Modal states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 print:hidden">
        <div className="flex items-center space-x-2 mb-10 px-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MLT Training</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard' && !selectedEmployee} onClick={() => { setActiveTab('dashboard'); setSelectedEmployee(null); }} />
          <SidebarItem icon={<Users size={20} />} label="Employees" active={activeTab === 'employees' || selectedEmployee !== null} onClick={() => { setActiveTab('employees'); setSelectedEmployee(null); }} />
          <SidebarItem icon={<ClipboardCheck size={20} />} label="Registrations" active={activeTab === 'registrations'} onClick={() => { setActiveTab('registrations'); setSelectedEmployee(null); }} />
          <SidebarItem icon={<BookOpen size={20} />} label="Course Master" active={activeTab === 'courses'} onClick={() => { setActiveTab('courses'); setSelectedEmployee(null); }} />
          <SidebarItem icon={<FileUp size={20} />} label="Import Center" active={activeTab === 'import'} onClick={() => { setActiveTab('import'); setSelectedEmployee(null); }} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-[10px]">Access Level</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">{role}</span>
              <button onClick={() => setRole(role === UserRole.HR ? UserRole.MANAGER : UserRole.HR)}>
                <Settings size={16} className="text-slate-400 hover:text-blue-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 print:bg-white relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span className="cursor-pointer hover:text-slate-900" onClick={() => setActiveTab('dashboard')}>Home</span>
            <ChevronRight size={14} />
            <span className="capitalize font-bold text-slate-900">
              {selectedEmployee ? 'Employee Record' : activeTab}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold leading-none">Admin User</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">{role} Mode</p>
              </div>
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Avatar" className="w-9 h-9 rounded-xl shadow-sm" />
            </div>
          </div>
        </header>

        <div className="p-8 print:p-0">
          {selectedEmployee ? (
            <EmployeeTrainingReport employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} role={role} />
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard />}
              
              {activeTab === 'employees' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">Employee Directory</h2>
                    <button onClick={() => setShowEmployeeModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200">
                      <Plus size={20} /> Add Employee
                    </button>
                  </div>
                  <EmployeesPage onViewRecord={setSelectedEmployee} />
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">Course Master</h2>
                    <button onClick={() => setShowCourseModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all font-bold shadow-lg">
                      <Plus size={20} /> Create Course
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Database.get().courses.map(course => (
                      <Card key={course.code} className="hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <Badge type="info">{course.category}</Badge>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{course.code}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-4">{course.name}</h4>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                            <Calendar size={16} className="text-blue-600"/> {course.totalHours} hrs
                          </div>
                          {course.validityMonths && <Badge type="warning">{course.validityMonths}mo valid</Badge>}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'registrations' && <RegistrationPanel />}
              {activeTab === 'import' && <ImportPage />}
            </>
          )}
        </div>
      </main>

      {/* Manual Input Modals */}
      <Modal isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} title="Add New Employee">
        <EmployeeForm onSuccess={() => { setShowEmployeeModal(false); setActiveTab('employees'); }} />
      </Modal>

      <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Define New Course">
        <CourseForm onSuccess={() => { setShowCourseModal(false); setActiveTab('courses'); }} />
      </Modal>

      {/* Printing Styles (Unchanged) */}
      <style>{`
        @media print {
          aside, header, .print:hidden, button, select, input { display: none !important; }
          main { overflow: visible !important; }
          .p-8 { padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

// Re-using component structures from previous logic with minor UI adjustments...
function EmployeesPage({ onViewRecord }: { onViewRecord: (e: Employee) => void }) {
  const db = Database.get();
  const [search, setSearch] = useState('');
  const filtered = db.employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card>
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          type="text" placeholder="Search by name or ID..." 
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Employee Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(emp => (
              <tr key={emp.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 font-mono text-blue-600 font-bold">{emp.id}</td>
                <td className="px-4 py-4 font-bold text-slate-900">{emp.name}</td>
                <td className="px-4 py-4 text-slate-500">{emp.department}</td>
                <td className="px-4 py-4 text-right">
                  <button onClick={() => onViewRecord(emp)} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-400 hover:text-blue-600">
                    <FileText size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

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

      if (errors.length > 0) setLogs(prev => [...errors.map(err => ({ msg: err, type: 'error' as const })), ...prev]);
      else setLogs(prev => [{ msg: `Successfully imported ${type} data`, type: 'success' as const }, ...prev]);
    } catch (e) {
      setLogs(prev => [{ msg: `Error importing ${type}: ${String(e)}`, type: 'error' as const }, ...prev]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <h3 className="text-xl font-bold mb-6">Bulk Import Center</h3>
        <div className="space-y-4">
          <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 transition-all group bg-slate-50/50">
            <h4 className="font-bold flex items-center justify-between mb-4">
              Training History
              <button onClick={() => ExcelService.downloadTemplate('history')} className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Download size={14}/> Template</button>
            </h4>
            <input type="file" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'history')} />
          </div>
          <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 transition-all group bg-slate-50/50">
            <h4 className="font-bold flex items-center justify-between mb-4">
              Employee Master
              <button onClick={() => ExcelService.downloadTemplate('employee')} className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Download size={14}/> Template</button>
            </h4>
            <input type="file" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'employee')} />
          </div>
        </div>
      </Card>
      <Card className="bg-slate-900 text-white font-mono p-4 rounded-2xl text-xs overflow-y-auto max-h-[400px]">
        <h4 className="text-slate-500 mb-4 font-bold uppercase tracking-widest">Processing Output</h4>
        {logs.map((log, i) => (
          <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
            <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span> {log.msg}
          </div>
        ))}
        {uploading && <div className="text-blue-400 animate-pulse mt-2">Writing to database...</div>}
        {logs.length === 0 && <p className="text-slate-700 italic">Waiting for file upload...</p>}
      </Card>
    </div>
  );
};

const EmployeeTrainingReport: React.FC<{ employee: Employee; onBack: () => void; role: UserRole; }> = ({ employee, onBack }) => {
  const db = Database.get();
  const history = useMemo(() => {
    const regs = db.registrations.filter(r => r.employeeId === employee.id);
    const result: any[] = [];
    regs.forEach(r => {
      const s = db.sessions.find(sess => sess.id === r.sessionId);
      const c = db.courses.find(course => course.code === s?.courseCode);
      const atts = db.attendance.filter(a => a.registrationId === r.id);
      atts.forEach(a => {
        result.push({ course: c?.name, date: a.date, hours: a.hours, trainer: s?.trainer });
      });
    });
    return result;
  }, [employee, db]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 print:hidden">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-bold">Audit History: {employee.name}</h2>
        <button onClick={() => window.print()} className="ml-auto bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm"><Printer size={16}/> Print Report</button>
      </div>
      <Card className="print:border-0 print:shadow-none">
        <div className="border-b pb-6 mb-6 flex justify-between items-start">
          <div>
             <h1 className="text-2xl font-black uppercase tracking-tighter">Individual Training Log</h1>
             <p className="text-sm text-slate-500 mt-1">{employee.department} • {employee.id}</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase text-slate-400">Total Validated Hours</p>
             <p className="text-3xl font-black text-blue-600 leading-none">{history.reduce((s, a) => s + a.hours, 0)}</p>
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase">
              <th className="py-2">Course Name</th>
              <th className="py-2">Training Date</th>
              <th className="py-2">Hours</th>
              <th className="py-2 text-right">Instructor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((h, i) => (
              <tr key={i} className="text-sm">
                <td className="py-4 font-bold">{h.course}</td>
                <td className="py-4 font-mono">{h.date}</td>
                <td className="py-4 font-bold">{h.hours}</td>
                <td className="py-4 text-right italic">{h.trainer}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-12 hidden print:grid grid-cols-2 gap-10">
           <div className="border-t border-slate-400 pt-2 text-[10px] uppercase font-bold text-center">Employee Signature</div>
           <div className="border-t border-slate-400 pt-2 text-[10px] uppercase font-bold text-center">HR Verified Date</div>
        </div>
      </Card>
    </div>
  );
};
