# Sprint Plan

## Sprint 1: Environment, Configuration & Core Backend
**Objective**: Ensure the application can start and connect to the database securely.
- [x] **Backend Config**: Create/Verify `backend/.env` (MONGO_URI, PORT, JWT_SECRET).
- [x] **Frontend Config**: Verify `root/.env` (VITE_API_BASE_URL).
- [x] **CORS**: Ensure backend accepts requests from frontend (default 5173).
- [x] **Dependencies**: Install backend dependencies if missing.

## Sprint 2: Backend Logic & Data Integrity
**Objective**: Ensure API endpoints work correctly and handle data properly.
- [x] **Auth**: Verify User model hashing and Login logic.
- [ ] **Deadlines**: Verify CRUD operations for deadlines.
- [x] **Data Validation**: Ensure inputs are validated (Dates, Categories).

## Sprint 3: Frontend Feature Polish & UI/UX
**Objective**: Fix any UI rendering issues and ensure smooth user experience.
- [x] **Routing**: Verify `PrivateRoute` and Redirects.
- [x] **Dashboard**: Stats cards, filters with clear button, personalized greeting.
- [x] **Responsiveness**: Navbar, login, register, dashboard all responsive.
- [x] **Error Handling**: Toast notifications + submitting states on forms.
- [x] **UI Overhaul**: Glassmorphism, gradient backgrounds, animations, premium cards, custom modal.
