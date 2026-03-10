# DeadlinePro — Application & Deadline Tracker

A full-stack deadline management platform built with **React**, **Node.js**, **Express**, and **MongoDB**. Designed to help users track job applications, internships, assignments, and hackathon deadlines with real-time analytics, gamification, and collaborative features.

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MongoDB-4f46e5?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

### [Live Demo →](https://deadline-tracker-lac.vercel.app)

---

## Features

- **Authentication & Security** — JWT-based email/password auth, Google OAuth, OTP-verified password reset, and secure session management
- **Deadline Management** — Full CRUD operations with categories (Assignments, Jobs, Internships, Hackathons), priority levels, and status tracking
- **Kanban Board** — Visual board organized by deadline category with real-time status updates
- **Calendar View** — Monthly calendar with color-coded deadline visualization and quick-add functionality
- **Analytics Dashboard** — Interactive charts (pie, bar, area, radial) for completion rates, category/priority breakdowns, and timeline analysis using Recharts
- **Gamification System** — XP-based leveling, 13 unlockable achievements, and streak tracking to encourage consistent usage
- **Collaboration** — Share deadlines with other users via invite, with accept/reject workflow and collaborator management
- **Sub-task Support** — Dynamic checklists within deadlines for granular progress tracking
- **Email Reminders** — Automated reminder scheduling via Node-Cron and Nodemailer
- **User Settings** — Profile management, email change with OTP verification, password updates, and account deletion
- **Dark Mode** — System-aware theme toggle with localStorage persistence
- **Responsive Design** — Fully responsive layout with mobile navigation and desktop sidebar

---

## Tech Stack

### Frontend
| Technology | Purpose |
|:---|:---|
| React 19 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| React Router v7 | Client-side routing |
| Recharts | Data visualization |
| Framer Motion | Animations |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|:---|:---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database and ODM |
| JSON Web Tokens | Stateless authentication |
| bcryptjs | Password hashing |
| Node-Cron | Scheduled reminder jobs |
| Nodemailer | Transactional email delivery |
| Google Auth Library | OAuth token verification |

### Deployment
| Technology | Purpose |
|:---|:---|
| Vercel | Hosting (frontend + serverless API) |

---

## Project Structure

```
Deadline_Tracker/
├── api/                 # Vercel serverless function entry point
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route handlers (auth, deadlines, analytics, gamification)
│   ├── middleware/       # JWT authentication, error handling
│   ├── models/          # Mongoose schemas (User, Deadline, OTP)
│   ├── routes/          # Express route definitions
│   ├── services/        # Email service, reminder scheduler
│   └── server.js        # Express application entry point
└── src/
    ├── components/      # Reusable UI components
    ├── context/         # React Context (AuthContext)
    ├── pages/           # Page-level route components
    └── services/        # API service layer (axios wrappers)
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB instance)

### 1. Clone the repository
```bash
git clone https://github.com/Saipreethi131/Deadline_Tracker.git
cd Deadline_Tracker
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env` with the following variables:
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/deadlinetracker
PORT=5000
JWT_SECRET=<your_jwt_secret>
NODE_ENV=development
EMAIL_USER=<your_email>
EMAIL_PASS=<your_app_password>
GOOGLE_CLIENT_ID=<your_google_client_id>
```

```bash
npm run dev
```

### 3. Frontend setup
```bash
# From root directory
npm install
```

Create `.env` in the project root:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=<your_google_client_id>
```

```bash
npm run dev
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and receive JWT |
| `POST` | `/api/auth/google` | Google OAuth sign-in |
| `POST` | `/api/auth/forgot-password` | Request OTP for password reset |
| `POST` | `/api/auth/reset-password` | Reset password with OTP |

### Deadlines (Protected)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/deadlines` | Retrieve all user deadlines |
| `POST` | `/api/deadlines` | Create a new deadline |
| `PUT` | `/api/deadlines/:id` | Update a deadline |
| `DELETE` | `/api/deadlines/:id` | Delete a deadline |
| `GET` | `/api/deadlines/upcoming` | Retrieve upcoming deadlines |
| `POST` | `/api/deadlines/:id/subtasks` | Add a sub-task |
| `POST` | `/api/deadlines/:id/share` | Share deadline with another user |

### Analytics (Protected)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/analytics/summary` | Completion stats overview |
| `GET` | `/api/analytics/by-category` | Deadlines grouped by category |
| `GET` | `/api/analytics/by-priority` | Deadlines grouped by priority |
| `GET` | `/api/analytics/timeline` | Timeline trend data |

### Gamification (Protected)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/gamification/stats` | XP, level, achievements, and streaks |

---

## License

MIT © 2026
