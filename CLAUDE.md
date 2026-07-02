# Legacy Wealth MERN — Project Master Context

## Project Overview
Full-stack MERN application for **Legacy Wealth Institute** — a financial education platform offering trading and investing courses. Built with React (Vite) frontend and Node.js/Express backend, MongoDB Atlas database.

## Live URLs
- **Frontend:** https://legacywealth.info (Vercel)
- **Backend API:** https://legacy-wealth-mern.onrender.com (Render, free tier)
- **GitHub:** https://github.com/itsyoursanjeev/legacy-wealth-mern

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, React Router v6, Axios
- **Backend:** Node.js, Express, Mongoose, JWT auth, bcryptjs, Razorpay
- **Database:** MongoDB Atlas (cluster0.tktehuf.mongodb.net), DB name: `legacy-wealth`
- **Payments:** Razorpay (currently test keys)

## Project Structure
```
legacy-wealth/
├── client/                  # React/Vite frontend
│   ├── src/
│   │   ├── api/axios.js     # Axios instance (baseURL: VITE_API_URL || '/api')
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/       # AdminDashboard, ManageUsers, ManageCourses,
│   │   │   │                # ManageEnrollments, ManageLeads, ManageBlogs, ManageLessons
│   │   │   └── ...          # Public pages
│   │   └── components/
│   └── package.json
├── server/                  # Express backend
│   ├── server.js            # Entry point (port: process.env.PORT || 5000)
│   ├── config/db.js         # Mongoose connect (uses MONGO_URI)
│   ├── models/
│   │   ├── User.js          # roles: 'user' | 'admin', password bcrypt hashed
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   ├── Lesson.js
│   │   ├── Lead.js
│   │   └── Blog.js
│   ├── routes/
│   │   ├── auth.js          # POST /api/auth/login (email + password)
│   │   ├── admin.js         # All /api/admin/* routes (protect + admin middleware)
│   │   ├── courses.js
│   │   ├── enrollments.js
│   │   ├── payment.js       # Razorpay integration
│   │   ├── blogs.js
│   │   └── leads.js
│   ├── middleware/
│   │   ├── auth.js          # JWT protect middleware
│   │   └── admin.js         # role === 'admin' check
│   └── utils/seed.js        # Seeds admin + sample courses (DELETES all data — never run in production)
└── marketing/               # Marketing assets folder
```

## Authentication
- Login via **email + password** at POST /api/auth/login
- JWT token stored in localStorage as `lw_token`
- Admin login URL: https://legacywealth.info/login

## Current Admin Credentials
- **Email:** admin@legacywealth.in
- **Password:** Trading@2002
- **Name:** Sanjeev Sharma
- **Role:** admin

## Environment Variables

### Backend (Render)
| Key | Value |
|-----|-------|
| PORT | 5000 |
| NODE_ENV | production |
| MONGO_URI | (MongoDB Atlas URI — check Render dashboard) |
| JWT_SECRET | legacy_wealth_super_secret_jwt_key_2026_do_not_share |
| JWT_EXPIRES_IN | 30d |
| CLIENT_URL | https://legacywealth.info |
| RAZORPAY_KEY_ID | rzp_test_xxxxxxxxxxx (replace with live key) |
| RAZORPAY_KEY_SECRET | (check Render dashboard) |
| ADMIN_EMAIL | admin@legacywealth.in |
| ADMIN_PASSWORD | Trading@2002 |
| ADMIN_NAME | Sanjeev Sharma |

### Frontend (Vercel)
| Key | Value |
|-----|-------|
| VITE_API_URL | https://legacy-wealth-mern.onrender.com/api |

## Database Collections (legacy-wealth)
- `users` — User accounts, role: 'user' | 'admin'
- `courses` — Course catalog
- `enrollments` — User course enrollments
- `lessons` — Course lessons/content
- `leads` — Lead capture submissions
- `blogs` — Blog posts

## How to Promote a User to Admin
**Via MongoDB Compass:**
1. Connect using MONGO_URI from Render
2. Open legacy-wealth > users collection
3. Find user by email → edit document → change role from "user" to "admin"

**Via code:**
```javascript
await User.findOneAndUpdate({ email: 'user@email.com' }, { role: 'admin' });
```

## Important Notes
- Render free tier: backend sleeps after 15 min inactivity (first request ~50s delay)
- seed.js DELETES all users and courses — never run in production
- JWT_SECRET was previously exposed — rotate before going fully live
- Razorpay is on test keys — replace with live keys before accepting real payments
- CORS allows: localhost:5173, legacy-wealth-mern.vercel.app, CLIENT_URL env var
