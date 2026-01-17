# MLT Training Data - Enterprise LMS

A high-performance Employee Training Record Management System designed for audit compliance (ISO/SMETA).

## 🚀 Quick Start
1. **Serve Files**: Use a static server (e.g., `npx serve .`).
2. **Access**: Open `http://localhost:3000` in a modern browser.
3. **API Key**: Ensure a Google Gemini API Key is available in the environment as `process.env.API_KEY` for AI insights.

## 🗄️ Database Architecture
### Current (Client-Side)
- **Engine**: Browser `localStorage`
- **Key**: `mlt_training_db_v2`
- **Logic**: Managed via `services/db.ts`

### Enterprise (Recommended Production)
- **Primary DB**: PostgreSQL or MySQL
- **Schema (ERD)**:
  - `Employees`: (id, name, department, position)
  - `Courses`: (code, name, category, total_hours, validity_months)
  - `Sessions`: (id, course_code, start_date, location, trainer, organizer)
  - `Registrations`: (id, employee_id, session_id, status)
  - `Attendance`: (id, registration_id, date, hours_attended)

## 🖨️ Audit & Printing
The system features a specialized print engine:
- **Format**: A4 Standard
- **Compliance**: Includes signature blocks for Employee, HR, and Management.
- **Filtering**: Supports date-range and category filtering prior to generation.

## 🛠️ Tech Stack
- **Frontend**: React (ES Modules), Tailwind CSS, Lucide Icons.
- **Excel Handling**: `xlsx` library for bulk data import/export.
- **AI Engine**: Google Gemini API for HR strategic insights.
- **Persistence**: Database Service with LocalStorage fallback.

## 📈 Deployment Steps (Production)
1. **Frontend**: Deploy the static build to Vercel, Netlify, or an S3 Bucket.
2. **Backend**: Containerize a Node.js/FastAPI service using Docker.
3. **Database**: Provision a managed SQL instance (RDS/CloudSQL).
4. **Security**: Implement JWT-based authentication and HTTPS.
