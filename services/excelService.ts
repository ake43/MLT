
import * as XLSX from 'xlsx';
import { Database } from './db';
import { Employee, Course, AttendanceStatus } from '../types';

export class ExcelService {
  private static normalizeRow(row: any): any {
    const normalized: any = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      normalized[normalizedKey] = row[key];
    });
    return normalized;
  }

  static async importEmployees(file: File): Promise<string[]> {
    const data = await this.readExcel(file);
    const errors: string[] = [];
    
    data.forEach((rawRow: any, index: number) => {
      const row = this.normalizeRow(rawRow);
      // Support various header styles: ID, id, EmployeeID, employee_id
      const id = row.id || row.employeeid || row.employee_id || row.personnel_id;
      const nameTh = row.name_th || row.nameth || row.full_name_th;
      const nameEn = row.name_en || row.nameen || row.full_name_en;
      const department = row.department || row.dept || row.sector;
      const position = row.position || row.job_title || row.pos;

      if (!id || (!nameTh && !nameEn)) {
        errors.push(`Row ${index + 2}: Missing ID or Name (TH/EN)`);
        return;
      }

      Database.addEmployee({ 
        id: String(id), 
        nameTh: nameTh || nameEn || 'N/A', 
        nameEn: nameEn || nameTh || 'N/A', 
        department: department || 'N/A', 
        position: position || 'N/A' 
      });
    });
    return errors;
  }

  static async importCourses(file: File): Promise<string[]> {
    const data = await this.readExcel(file);
    const errors: string[] = [];
    
    data.forEach((rawRow: any, index: number) => {
      const row = this.normalizeRow(rawRow);
      const code = row.code || row.coursecode || row.course_code;
      const nameTh = row.name_th || row.nameth;
      const nameEn = row.name_en || row.nameen;
      const hours = row.hours || row.total_hours || row.credit;
      const category = row.category || row.type;
      const validity = row.validity || row.validity_months || row.expire;

      if (!code || (!nameTh && !nameEn) || !hours) {
        errors.push(`Row ${index + 2}: Missing required fields (Code, Name, or Hours)`);
        return;
      }

      Database.addCourse({ 
        code: String(code), 
        nameTh: nameTh || nameEn || 'N/A', 
        nameEn: nameEn || nameTh || 'N/A', 
        category: category || 'Technical', 
        totalHours: Number(hours),
        validityMonths: validity ? Number(validity) : undefined
      });
    });
    return errors;
  }

  static async importHistory(file: File): Promise<string[]> {
    const data = await this.readExcel(file);
    const errors: string[] = [];
    const db = Database.get();

    data.forEach((rawRow: any, index: number) => {
      const row = this.normalizeRow(rawRow);
      const employeeId = row.employeeid || row.employee_id || row.id;
      const courseCode = row.coursecode || row.course_code || row.code;
      const date = row.date || row.training_date;
      const hours = row.hours || row.attended_hours || row.credit;

      if (!employeeId || !courseCode || !date || !hours) {
        errors.push(`Row ${index + 2}: Missing required fields (EmployeeID, CourseCode, Date, Hours)`);
        return;
      }

      const emp = db.employees.find(e => String(e.id).trim().toLowerCase() === String(employeeId).trim().toLowerCase());
      const course = db.courses.find(c => String(c.code).trim().toLowerCase() === String(courseCode).trim().toLowerCase());

      if (!emp) {
        errors.push(`Row ${index + 2}: Employee ID ${employeeId} not found in database`);
        return;
      }
      if (!course) {
        errors.push(`Row ${index + 2}: Course Code ${courseCode} not found in database`);
        return;
      }

      Database.addManualHistory({
        employeeId: String(employeeId),
        courseCode: String(courseCode),
        date: String(date),
        hours: Number(hours)
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
      filename = 'employee_template.xlsx';
    } else if (type === 'course') {
      data = [{ Code: 'C001', Name_TH: 'ความปลอดภัย', Name_EN: 'Safety Training', Category: 'Safety', Hours: 8, Validity: 12 }];
      filename = 'course_template.xlsx';
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
