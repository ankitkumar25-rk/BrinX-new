# BrinX — College Task Exchange Platform

> **Get your task done — smarter, faster, together.**
>
> Built for students, by students · **QuartZ Team · IIT Jodhpur**

BrinX is a peer-to-peer task exchange platform for IITJ students. Post tasks you need help with, accept tasks from peers, submit proof of completion, and earn reward points — all within your campus community.

---

## Features

- **IITJ-only registration** — verified via `rollnumber@iitj.ac.in` email format and 9-character roll number
- **Flexible login** — sign in using your roll number (`b25cs1002`) or full IITJ email
- **Task board** — post, browse, accept, and manage tasks
- **File upload** — submit PDF/image proof of task completion via Multer
- **Points system** — earn XP for completed tasks; track stats on a bento-grid dashboard
- **Notifications** — real-time activity feed for task updates
- **Password reset** — secure 15-minute JWT reset link via email
- **Premium UI** — Aurora animated background, Glassmorphism cards, Neumorphic stat tiles, micro-interactions

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS (custom design system), Vanilla JS |
| **Animations** | Anime.js, CSS keyframes |
| **Fonts** | Syne, Space Grotesk, Inter (Google Fonts) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (local or Atlas), Mongoose ODM |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **File Upload** | Multer |
| **Email** | Nodemailer (Ethereal for dev, Gmail for prod) |
| **Validation** | express-validator |
| **Dev server** | Nodemon |

---

## Project Structure

```
BrinX-new/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   └── User.js              # Mongoose User model
│   ├── routes/
│   │   ├── auth.js              # Signup, login, forgot/reset password
│   │   ├── tasks.js             # Post, accept, complete, verify tasks
│   │   └── notifications.js    # Notification feed & mark-as-read
│   ├── services/
│   │   └── emailService.js      # Nodemailer (Ethereal / Gmail)
│   └── server.js                # Express app entry point
├── frontend/
│   ├── css/
│   │   └── styles.css           # Full design system (tokens, glass, neu, bento)
│   ├── js/
│   │   ├── api.js               # API_BASE_URL + apiCall() helper
│   │   ├── aurora.js            # Aurora parallax + ripple micro-interactions
│   │   ├── animations.js        # Anime.js entrance & hover animations
│   │   └── dashboard.js         # Dashboard stats + notification badge logic
│   ├── index.html               # Login page
│   ├── signup.html              # Registration (IITJ roll number validation)
│   ├── dashboard.html           # Dashboard (bento grid stats + quick actions)
│   ├── view-requests.html       # Browse & accept open tasks
│   ├── post-request.html        # Create a new task request
│   ├── assigned-tasks.html      # Manage active & completed tasks
│   ├── notifications.html       # Activity feed
│   ├── forgot-password.html     # Request password reset
│   └── reset-password.html      # Set new password via token
├── .env                         # Your local environment variables (git-ignored)
├── .env.example                 # Template — copy to .env and fill in values
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally **or** a [MongoDB Atlas](https://www.mongodb.com/atlas) account

### 1 · Clone the repository

```bash
git clone https://github.com/your-username/BrinX-new.git
cd BrinX-new
```

### 2 · Install dependencies

```bash
npm install
```

### 3 · Set up environment variables

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
PORT=5003
MONGODB_URI=mongodb://localhost:27017/brinx   # or your Atlas URI
JWT_SECRET=<generate a strong random secret>
NODE_ENV=development
EMAIL_SERVICE=ethereal   # use 'gmail' in production
```

> **Tip — generate a JWT secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4 · Run the development server

```bash
npm run dev
```

The server starts at **http://localhost:5003**. Open that URL in your browser to use the app.

---

## Roll Number Format

BrinX enforces IITJ roll number validation on signup:

```
b  25  cs  1002
│   │   │    └── 4-digit student number
│   │   └─────── department code (2 letters)
│   └─────────── 2-digit admission year
└─────────────── programme prefix (b = B.Tech)
```

**Supported department codes:**

| Code | Department |
|---|---|
| `bb` | Bioscience & Bioengineering |
| `cs` | Computer Science & Engineering |
| `me` | Mechanical Engineering |
| `ee` | Electrical Engineering |
| `ce` | Civil Engineering |
| `ch` | Chemical Engineering |
| `ph` | Physics |
| `ma` | Mathematics |
| `hs` | Humanities & Social Sciences |
| `mt` | Materials & Metallurgical Engineering |
| `cm` | Computing & Mathematics |
| `ec` | Electronics & Communication |

---

## API Reference

All API routes are prefixed with `/api`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register (email + roll number validated) |
| `POST` | `/auth/login` | Login with email **or** roll number |
| `GET` | `/auth/me` | Get logged-in user profile |
| `POST` | `/auth/forgot-password` | Send password reset email |
| `POST` | `/auth/reset-password` | Reset password with JWT token |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/tasks/post-request` | Create a new task |
| `GET` | `/tasks/get-requests` | Get all open tasks |
| `GET` | `/tasks/my-posted-tasks` | Get tasks posted by me |
| `GET` | `/tasks/my-accepted-tasks` | Get tasks accepted by me |
| `POST` | `/tasks/accept-request/:id` | Accept an open task |
| `POST` | `/tasks/complete-task/:id` | Submit completion proof (multipart) |
| `POST` | `/tasks/reward-status/:id` | Confirm or dispute reward receipt |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications` | Get all notifications |
| `PATCH` | `/notifications/:id/read` | Mark one as read |
| `PATCH` | `/notifications/mark-all-read` | Mark all as read |

---

## Email Setup

### Development (default)

`EMAIL_SERVICE=ethereal` — Nodemailer creates a throwaway inbox automatically. No configuration needed. The **preview URL** is printed in the console after each email.

### Production (Gmail)

1. Enable [2-Step Verification](https://myaccount.google.com/security) on your Gmail account
2. Generate a **Gmail App Password** (not your regular password)
3. Update `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your.gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM="BrinX <your.gmail@gmail.com>"
```

---

## Login Options

Users can sign in using **either**:

| Input | Example |
|---|---|
| Roll number | `b25cs1002` |
| IITJ email | `b25cs1002@iitj.ac.in` |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

---

## License

MIT © 2025 QuartZ Team — IIT Jodhpur
