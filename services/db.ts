
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
    { id: 'SESS002', courseCode: 'REACT202', startDate: '2024-06-10', endDate: '2024-06-12', location: 'Room A', trainer: 'Bob Martin', organizer: 'L&D Team' },
    { id: 'SESS003', courseCode: 'SAFE505', startDate: '2024-07-20', endDate: '2024-07-20', location: 'Assembly Point', trainer: 'Safety Officer', organizer: 'HR' },
  ],
  registrations: [
    { id: 'REG001', employeeId: 'EMP001', sessionId: 'SESS001', status: AttendanceStatus.ATTENDED },
    { id: 'REG002', employeeId: 'EMP002', sessionId: 'SESS001', status: AttendanceStatus.REGISTERED },
    { id: 'REG003', employeeId: 'EMP001', sessionId: 'SESS003', status: AttendanceStatus.ATTENDED },
  ],
  attendance: [
    { id: 'ATT001', registrationId: 'REG001', date: '2024-05-01', hours: 4 },
    { id: 'ATT002', registrationId: 'REG003', date: '2024-07-20', hours: 8 },
  ]
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

  static addEmployee(emp: Employee) {
    if (this.state.employees.find(e => e.id === emp.id)) return;
    this.state.employees.push(emp);
    this.save();
  }

  static addCourse(course: Course) {
    const existing = this.state.courses.findIndex(c => c.code === course.code);
    if (existing !== -1) {
      this.state.courses[existing] = course;
    } else {
      this.state.courses.push(course);
    }
    this.save();
  }

  static addSession(session: TrainingSession) {
    this.state.sessions.push(session);
    this.save();
  }

  static registerEmployee(reg: Registration) {
    this.state.registrations.push(reg);
    this.save();
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
