
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

  private static save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  static get(): AppState {
    return this.state;
  }

  static addEmployee(emp: Employee): boolean {
    if (this.state.employees.find(e => e.id === emp.id)) return false;
    this.state.employees.push(emp);
    this.save();
    return true;
  }

  static addCourse(course: Course): boolean {
    const existingIndex = this.state.courses.findIndex(c => c.code === course.code);
    if (existingIndex !== -1) {
      this.state.courses[existingIndex] = course;
    } else {
      this.state.courses.push(course);
    }
    this.save();
    return true;
  }

  static addSession(session: TrainingSession) {
    this.state.sessions.push(session);
    this.save();
  }

  static registerEmployee(reg: Registration): boolean {
    const exists = this.state.registrations.find(r => r.employeeId === reg.employeeId && r.sessionId === reg.sessionId);
    if (exists) return false;
    this.state.registrations.push(reg);
    this.save();
    return true;
  }

  static recordAttendance(att: AttendanceRecord) {
    this.state.attendance.push(att);
    const reg = this.state.registrations.find(r => r.id === att.registrationId);
    if (reg) {
      const session = this.state.sessions.find(s => s.id === reg.sessionId);
      const course = this.state.courses.find(c => c.code === session?.courseCode);
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
    this.save();
  }
}
