
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
  name: string;
  department: string;
  position: string;
}

export interface Course {
  code: string;
  name: string;
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
  trainer?: string; // Added for audit compliance
  organizer?: string; // Added for audit compliance
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
