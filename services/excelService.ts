
import * as XLSX from 'xlsx';
import { Database } from './db';
import { Employee, Course, AttendanceStatus } from '../types';

export class ExcelService {
  static async importEmployees(file: File): Promise<string[]> {
    const data = await this.readExcel(file);
    const errors: string[] = [];
    data.forEach((row: any, index: number) => {
      const { ID, Name_TH, Name_EN, Department, Position } = row;
      if (!ID || (!Name_TH && !Name_EN)) {
        errors.push(`Row ${index + 2}: Missing ID or Name (TH/EN)`);
        return;
      }
      Database.addEmployee({ 
        id: String(ID), 
        nameTh: Name_TH || Name_EN || 'N/A', 
        nameEn: Name_EN || Name_TH || 'N/A', 
        department: Department || 'N/A', 
        position: Position || 'N/A' 
      });
    });
    return errors;
  }

  static async importCourses(file: File): Promise<string[]> {
    const data = await this.readExcel(file);
    const errors: string[] = [];
    data.forEach((row: any, index: number) => {
      const { Code, Name_TH, Name_EN, Category, Hours, Validity } = row;
      if (!Code || (!Name_TH && !Name_EN) || !Hours) {
        errors.push(`Row ${index + 2}: Missing required fields (Code, Name, or Hours)`);
        return;
      }
      Database.addCourse({ 
        code: String(Code), 
        nameTh: Name_TH || Name_EN || 'N/A', 
        nameEn: Name_EN || Name_TH || 'N/A', 
        category: Category || 'Technical', 
        totalHours: Number(Hours),
        validityMonths: Validity ? Number(Validity) : undefined
      });
    });
    return errors;
  }

  static async importHistory(file: File): Promise<string[]> {
    const data = await this.readExcel(file);
    const errors: string[] = [];
    const db = Database.get();

    data.forEach((row: any, index: number) => {
      const { EmployeeID, CourseCode, Date, Hours } = row;
      if (!EmployeeID || !CourseCode || !Date || !Hours) {
        errors.push(`Row ${index + 2}: Missing required fields (EmployeeID, CourseCode, Date, Hours)`);
        return;
      }

      const emp = db.employees.find(e => e.id === String(EmployeeID));
      const course = db.courses.find(c => c.code === String(CourseCode));

      if (!emp) {
        errors.push(`Row ${index + 2}: Employee ID ${EmployeeID} not found`);
        return;
      }
      if (!course) {
        errors.push(`Row ${index + 2}: Course Code ${CourseCode} not found`);
        return;
      }

      let session = db.sessions.find(s => s.courseCode === course.code && s.startDate === String(Date));
      if (!session) {
        session = {
          id: `HIST_${Math.random().toString(36).substr(2, 9)}`,
          courseCode: course.code,
          startDate: String(Date),
          endDate: String(Date),
          location: 'Historical Import'
        };
        Database.addSession(session);
      }

      let reg = db.registrations.find(r => r.employeeId === emp.id && r.sessionId === session?.id);
      if (!reg) {
        reg = {
          id: `REG_H_${Math.random().toString(36).substr(2, 9)}`,
          employeeId: emp.id,
          sessionId: session.id,
          status: AttendanceStatus.REGISTERED
        };
        Database.registerEmployee(reg);
      }

      Database.recordAttendance({
        id: `ATT_H_${Math.random().toString(36).substr(2, 9)}`,
        registrationId: reg.id,
        date: String(Date),
        hours: Number(Hours)
      });
    });
    return errors;
  }

  private static readExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        resolve(data);
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  }

  static downloadTemplate(type: 'employee' | 'course' | 'history') {
    let data: any[] = [];
    let filename = '';
    
    if (type === 'employee') {
      data = [{ ID: 'EMP001', Name_TH: 'สมชาย รักดี', Name_EN: 'Somchai Rakdee', Department: 'Engineering', Position: 'Developer' }];
      filename = 'employee_bilingual_template.xlsx';
    } else if (type === 'course') {
      data = [{ Code: 'C001', Name_TH: 'อบรมความปลอดภัย', Name_EN: 'Safety Training', Category: 'Safety', Hours: 8, Validity: 12 }];
      filename = 'course_bilingual_template.xlsx';
    } else if (type === 'history') {
      data = [{ EmployeeID: 'EMP001', CourseCode: 'C001', Date: '2023-01-01', Hours: 4 }];
      filename = 'history_template.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
  }
}
