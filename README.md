# CampusDesk — Student Management System

A responsive student directory built with React, Express, Node.js, and MongoDB. Supports full CRUD, search, status and department filters, pagination, student profiles, summary metrics, and CSV export.

## Requirements
- Node.js 18 or newer
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Run locally
1. Extract the project and open its folder in a terminal.
2. Install dependencies:
   ```bash
   npm install
     or
   npm.cmd install
   ```
3. Copy `.env.example` to `.env`.
4. Configure `.env` with the MongoDB connection and admin login. Use `.env.example` as a template. Set a long random `SESSION_SECRET` for deployments; production startup requires it.
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/campusdesk
   PORT=5000
   NODE_ENV=development
   ADMIN_USERNAME=change-this
   ADMIN_PASSWORD=use-a-strong-password
   SESSION_SECRET=generate-a-long-random-secret
   ```
   For Atlas, use your Atlas connection string instead.
5. Start frontend and backend:
   ```bash
   npm run dev
      or
   npm.cmd run dev
   ```
6. Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

## Student fields
- `studentId` (required, unique)
- `firstName`, `lastName` (required)
- `email` (required, unique; accepts any non-empty text format)
- `phone`
- `course`, `department` (required)
- `year` (`Year 1` through `Year 5`, or `Postgraduate`)
- `status` (`active`, `graduated`, `on leave`)
- `gpa` (0–5)
- `enrollmentDate`, `notes`
- `createdAt`, `updatedAt` (managed by Mongoose)

## API routes
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/students` | List/filter/search students with pagination |
| GET | `/api/students/:id` | Read one student |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |
| GET | `/api/summary` | Dashboard totals |
| GET | `/api/reports` | Registry totals, department counts, and recent records |
| GET | `/api/departments` | Department filter options |
| GET | `/api/health` | API and MongoDB status |

## Production
```bash
npm run build
NODE_ENV=production npm start
```
With `NODE_ENV=production`, Express serves the Vite build from `dist/`.

## Important
This starter does not seed fake student records. Add records through the interface. CSV export currently exports the currently visible page. Before public deployment, add authentication and authorization, rate limiting, HTTPS, backups, and production CORS/origin controls. Student records are sensitive; use appropriate access restrictions and data protection practices.
