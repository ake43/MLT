
import { AppState, Employee, Course, TrainingSession, Registration, AttendanceRecord, AttendanceStatus } from '../types';

const STORAGE_KEY = 'mlt_training_db_v2';

const INITIAL_DATA: AppState = {
  employees: [
    { id: 'EMP001', name: 'John Doe', department: 'Engineering', position: 'Senior Dev' },
    { id: 'EMP002', name: 'Jane Smith', department: 'Operations', position: 'Manager' },
  ],
  courses: [
    { code: 'SEC101', name: 'Cybersecurity Awareness', category: 'Compliance', totalHours: 4, validityMonths: 12 },
    { code: 'REACT202', name: 'Advanced React Patterns', category: 'Technical', totalHours: 16 },
    { code: 'SAFE505', name: 'Fire & Emergency Safety', category: 'Safety', totalHours: 8, validityMonths: 24 },
  ],
  sessions: [
    { id: 'SESS001', courseCode: 'SEC101', startDate: '2024-05-01', endDate: '2024-05-01', location: 'Online', trainer: 'Alice Vance', organizer: 'IT Security Dept' },
  ],
  registrations: [],
  attendance: []
};

export class Database {
  private static state: AppState = Database.load();

  private static load(): AppState {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  }

  static save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    // Trigger a global update event for React components
    window.dispatchEvent(new Event('db-updated'));
  }

  static get(): AppState {
    return this.state;
  }

  static addEmployee(emp: Employee): boolean {
    const id = String(emp.id).trim();
    if (this.state.employees.find(e => String(e.id).trim().toLowerCase() === id.toLowerCase())) return false;
    this.state.employees.push({ ...emp, id });
    this.save();
    return true;
  }

  static addCourse(course: Course): boolean {
    const code = String(course.code).trim();
    const existingIndex = this.state.courses.findIndex(c => String(c.code).trim().toLowerCase() === code.toLowerCase());
    if (existingIndex !== -1) {
      this.state.courses[existingIndex] = { ...course, code };
    } else {
      this.state.courses.push({ ...course, code });
    }
    this.save();
    return true;
  }

  static addSession(session: TrainingSession) {
    this.state.sessions.push(session);
    this.save();
  }

  static registerEmployee(reg: Registration): boolean {
    const empId = String(reg.employeeId).trim();
    const exists = this.state.registrations.find(r => 
      String(r.employeeId).trim().toLowerCase() === empId.toLowerCase() && 
      r.sessionId === reg.sessionId
    );
    if (exists) return false;
    this.state.registrations.push({ ...reg, employeeId: empId });
    this.save();
    return true;
  }

  static recordAttendance(att: AttendanceRecord) {
    this.state.attendance.push(att);
    const reg = this.state.registrations.find(r => r.id === att.registrationId);
    if (reg) {
      this.updateRegistrationStatus(reg.id);
    }
    this.save();
  }

  private static updateRegistrationStatus(regId: string) {
    const reg = this.state.registrations.find(r => r.id === regId);
    if (!reg) return;

    const session = this.state.sessions.find(s => s.id === reg.sessionId);
    const course = this.state.courses.find(c => String(c.code).trim().toLowerCase() === String(session?.courseCode).trim().toLowerCase());
    
    const totalAttended = this.state.attendance
      .filter(a => a.registrationId === reg.id)
      .reduce((sum, a) => sum + a.hours, 0);
    
    if (course) {
      if (totalAttended >= course.totalHours) {
        reg.status = AttendanceStatus.ATTENDED;
      } else if (totalAttended > 0) {
        reg.status = AttendanceStatus.PARTIALLY_ATTENDED;
      }
    }
  }

  static addManualHistory(data: { employeeId: string, courseCode: string, date: string, hours: number, trainer?: string }) {
    const empId = String(data.employeeId).trim();
    const cCode = String(data.courseCode).trim();

    // 1. Find or create a historical session
    let session = this.state.sessions.find(s => 
      String(s.courseCode).trim().toLowerCase() === cCode.toLowerCase() && 
      s.startDate === data.date && 
      s.location === 'Manual Entry'
    );

    if (!session) {
      session = {
        id: `SESS_H_${Math.random().toString(36).substr(2, 6)}`,
        courseCode: cCode,
        startDate: data.date,
        endDate: data.date,
        location: 'Manual Entry',
        trainer: data.trainer || 'External',
        organizer: 'Self/Manual'
      };
      this.state.sessions.push(session);
    }

    // 2. Find or create registration
    let reg = this.state.registrations.find(r => 
      String(r.employeeId).trim().toLowerCase() === empId.toLowerCase() && 
      r.sessionId === session!.id
    );

    if (!reg) {
      reg = {
        id: `REG_H_${Math.random().toString(36).substr(2, 6)}`,
        employeeId: empId,
        sessionId: session!.id,
        status: AttendanceStatus.REGISTERED
      };
      this.state.registrations.push(reg);
    }

    // 3. Record Attendance
    const att: AttendanceRecord = {
      id: `ATT_H_${Math.random().toString(36).substr(2, 6)}`,
      registrationId: reg.id,
      date: data.date,
      hours: data.hours
    };
    this.state.attendance.push(att);

    // 4. Update Status & Save
    this.updateRegistrationStatus(reg.id);
    this.save();
  }
}
