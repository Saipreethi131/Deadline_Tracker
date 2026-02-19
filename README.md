# 🕐 DeadlinePro — Application & Deadline Tracker

> A full-stack deadline management application built with React, Node.js, Express, and MongoDB. Track job applications, internships, assignments, and hackathon deadlines — all in one place.

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MongoDB-4f46e5?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active%20Development-orange?style=for-the-badge)

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register/login with token-based auth
- 📋 **Kanban Board** — Organize deadlines by category (Assignments, Jobs, Internships, Hackathons)
- 🎯 **Priority System** — High / Medium / Low with visual color coding
- 🔍 **Search & Filter** — Real-time search + filter by category, priority, and status
- 🔔 **Reminder Toggle** — Flag deadlines for upcoming notification support
- 🌙 **Dark Mode** — Full dark/light theme toggle with persistence
- 📱 **Responsive Design** — Works seamlessly on mobile and desktop
- ✏️ **Full CRUD** — Create, read, update, delete deadlines
- 📊 **Stats Overview** — Live counts for Total / Pending / Done / Overdue
- 🎨 **Modern UI** — Glassmorphism, gradient effects, and smooth animations

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|:---|:---|
| React 18 | UI Framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| React Toastify | Toast notifications |
| React Icons | Icon library |
| date-fns | Date formatting |

### Backend
| Technology | Purpose |
|:---|:---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| dotenv | Environment config |
| CORS | Cross-origin support |

---

## 🗂️ Project Structure

```
DeadlinePro/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route handlers (auth, deadlines)
│   ├── middleware/       # JWT auth, error handling
│   ├── models/          # Mongoose schemas (User, Deadline)
│   ├── routes/          # Express routers
│   ├── services/        # Business logic layer
│   ├── .env.example     # Environment variable template
│   └── server.js        # Express app entry point
└── src/
    ├── components/      # Reusable UI components
    ├── context/         # React Context (Auth)
    ├── pages/           # Page-level components
    └── services/        # API service layer
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)

### 1. Clone the repository
```bash
git clone https://github.com/Saipreethi131/Application_Deadline_Tracker.git
cd Application_Deadline_Tracker
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### 3. Setup Frontend
```bash
# From root directory
npm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:5000/api
npm run dev
```

### 4. Environment Variables

**`backend/.env`**
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/deadlinetracker
PORT=5000
JWT_SECRET=your_super_secret_key
NODE_ENV=development
```

**`.env` (root)**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login & receive JWT |

### Deadlines (Protected — requires Bearer token)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/deadlines` | Get all user deadlines |
| `POST` | `/api/deadlines` | Create new deadline |
| `PUT` | `/api/deadlines/:id` | Update deadline |
| `DELETE` | `/api/deadlines/:id` | Delete deadline |
| `GET` | `/api/deadlines/upcoming` | Get upcoming deadlines |

---

## 🗺️ Roadmap

- [x] JWT Authentication
- [x] Full CRUD for deadlines
- [x] Kanban board UI
- [x] Search, filter & sort
- [x] Dark mode
- [x] Priority & status system
- [x] Stats overview cards
- [ ] Email reminders (Node-Cron + Nodemailer)
- [ ] Analytics dashboard (Recharts)
- [ ] Drag & drop Kanban
- [ ] PDF/CSV export
- [ ] Google OAuth
- [ ] PWA support
- [ ] Docker + CI/CD

---

## 🖼️ Screenshots

> _Add screenshots here after deployment_

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT © 2026 — Built with ❤️ using React + Node.js
