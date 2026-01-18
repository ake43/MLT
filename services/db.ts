
import { AppState, Employee, Course, TrainingSession, Registration, AttendanceRecord, AttendanceStatus } from '../types';

const STORAGE_KEY = 'mlt_training_db_v2';

const INITIAL_DATA: AppState = {
  employees: [
    { id: 'EMP001', nameTh: 'สมชาย รักดี', nameEn: 'Somchai Rakdee', department: 'Engineering', position: 'Senior Dev', isActive: true },
    { id: 'EMP002', nameTh: 'สมหญิง จริงใจ', nameEn: 'Somying Jingjai', department: 'Operations', position: 'Manager', isActive: true },
  ],
  courses: [
    { code: 'SEC101', nameTh: 'การตระหนักรู้ด้านความปลอดภัยไซเบอร์', nameEn: 'Cybersecurity Awareness', category: 'Compliance', totalHours: 4, validityMonths: 12 },
    { code: 'REACT202', nameTh: 'รูปแบบการเขียน React ขั้นสูง', nameEn: 'Advanced React Patterns', category: 'Technical', totalHours: 16 },
    { code: 'SAFE505', nameTh: 'ความปลอดภัยจากอัคคีภัยและเหตุฉุกเฉัน', nameEn: 'Fire & Emergency Safety', category: 'Safety', totalHours: 8, validityMonths: 24 },
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
    if (!saved) return INITIAL_DATA;
    
    const parsed = JSON.parse(saved);
    // Migration: ensure isActive exists
    if (parsed.employees) {
      parsed.employees = parsed.employees.map((e: any) => ({
        ...e,
        isActive: e.isActive !== undefined ? e.isActive : true
      }));
    }
    return parsed;
  }

  static save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    window.dispatchEvent(new Event('db-updated'));
  }

  static get(): AppState {
    return this.state;
  }

  static addEmployee(emp: Partial<Employee> & { id: string }): boolean {
    const id = String(emp.id).trim();
    const existingIndex = this.state.employees.findIndex(e => String(e.id).trim().toLowerCase() === id.toLowerCase());
    
    const employeeData: Employee = {
      id,
      nameTh: emp.nameTh || 'N/A',
      nameEn: emp.nameEn || 'N/A',
      department: emp.department || 'N/A',
      position: emp.position || 'N/A',
      isActive: emp.isActive !== undefined ? emp.isActive : true
    };

    if (existingIndex !== -1) {
      this.state.employees[existingIndex] = employeeData;
    } else {
      this.state.employees.push(employeeData);
    }
    this.save();
    return true;
  }

  static toggleEmployeeStatus(id: string) {
    const emp = this.state.employees.find(e => e.id === id);
    if (emp) {
      emp.isActive = !emp.isActive;
      this.save();
    }
  }

  static deleteEmployee(id: string) {
    this.state.employees = this.state.employees.filter(e => e.id !== id);
    // Cleanup registrations and attendance associated with deleted employee
    const regsToRemove = this.state.registrations.filter(r => r.employeeId === id).map(r => r.id);
    this.state.registrations = this.state.registrations.filter(r => r.employeeId !== id);
    this.state.attendance = this.state.attendance.filter(a => !regsToRemove.includes(a.registrationId));
    this.save();
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

    const att: AttendanceRecord = {
      id: `ATT_H_${Math.random().toString(36).substr(2, 6)}`,
      registrationId: reg.id,
      date: data.date,
      hours: data.hours
    };
    this.state.attendance.push(att);

    this.updateRegistrationStatus(reg.id);
    this.save();
  }
}
