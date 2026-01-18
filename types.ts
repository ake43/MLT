
export enum UserRole {
  HR = 'HR',
  COORDINATOR = 'COORDINATOR',
  MANAGER = 'MANAGER'
}

export enum AttendanceStatus {
  REGISTERED = 'Registered',
  ATTENDED = 'Attended',
  PARTIALLY_ATTENDED = 'Partially Attended',
  ABSENT = 'Absent'
}

export interface Employee {
  id: string; // Employee ID
  nameTh: string;
  nameEn: string;
  department: string;
  position: string;
  isActive: boolean;
}

export interface Course {
  code: string;
  nameTh: string;
  nameEn: string;
  category: string;
  totalHours: number;
  validityMonths?: number;
}

export interface TrainingSession {
  id: string;
  courseCode: string;
  startDate: string;
  endDate: string;
  location: string;
  trainer?: string; 
  organizer?: string; 
}

export interface Registration {
  id: string;
  employeeId: string;
  sessionId: string;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  date: string;
  hours: number;
}

export interface AppState {
  employees: Employee[];
  courses: Course[];
  sessions: TrainingSession[];
  registrations: Registration[];
  attendance: AttendanceRecord[];
}
