# BrinX — College Task Exchange Platform

> **Get your task done — smarter, faster, together.**
>
> Built for students, by students · **QuartZ Team · IIT Jodhpur**

BrinX is a peer-to-peer task exchange platform for IITJ students. Post tasks you need help with, accept tasks from peers, submit proof of completion, and earn reward points — all within your campus community.

---

## Features

- **Exclusive Landing Page** — beautiful, high-converting entry point introducing BrinX
- **Google OAuth Sign-In** — native, secure, glassmorphic Google Sign-in/up button linked to IITJ domain
- **IITJ-only registration** — verified via `rollnumber@iitj.ac.in` email format and 9-character roll number
- **Flexible login** — sign in using Google, your roll number (`b25cs1002`), or full IITJ email
- **Advanced Task Boards** — post tasks to specific *Courses* or *Fests & Clubs*, alongside the General board
- **High-Impact Mechanics** — support for Team/Group tasks, SOS Urgent blasts, Task Bundles, and Microtasks
- **Task Bidding & Reverse Auctions** — set a max reward and let users bid lower to complete your tasks
- **Trust & Security** — Poster verification releases rewards, Skill Gatekeeping tests acceptors with MCQs, and Anonymous mode protects identities
- **Dynamic Leaderboard** — Reputation decay ensures only actively helpful users stay at the top
- **Task Waitlists & Auto-Bump** — join waitlists for accepted tasks; inactive tasks auto-bump to the feed
- **Premium UI** — Aurora animated background, Glassmorphism cards, Neumorphic stat tiles, micro-interactions
- **Password reset** — secure 15-minute JWT reset link via email

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
│   ├── index.html               # High-converting Landing Page
│   ├── login.html               # Login page with Google OAuth & Custom Email
│   ├── signup.html              # Registration (IITJ roll number validation)
│   ├── profile.html             # User profile page (points, courses, skills)
│   ├── dashboard.html           # Dashboard (bento grid stats + quick actions)
│   ├── view-requests.html       # Browse, bid, and accept open tasks
│   ├── post-request.html        # Create a new task request (SOS, Bundle, Bidding)
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
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
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
| `POST` | `/auth/google` | Sign in/up securely using Google OAuth access token |
| `GET` | `/auth/me` | Get logged-in user profile |
| `POST` | `/auth/forgot-password` | Send password reset email |
| `POST` | `/auth/reset-password` | Reset password with JWT token |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/tasks/post-request` | Create a new task (supports SOS, teams, bundles) |
| `GET` | `/tasks/get-requests` | Get all open tasks (auto-bumps inactive tasks) |
| `GET` | `/tasks/my-posted-tasks` | Get tasks posted by me |
| `GET` | `/tasks/my-accepted-tasks` | Get tasks accepted by me |
| `POST` | `/tasks/accept-request/:id` | Accept an open task (evaluates skill quiz) |
| `POST` | `/tasks/bid/:id` | Place a bid on a task (Reverse Auction) |
| `POST` | `/tasks/select-bid/:id` | Poster selects a winning bid |
| `POST` | `/tasks/join-waitlist/:id` | Join waitlist for an accepted task |
| `POST` | `/tasks/complete-task/:id` | Submit completion proof (multipart) |
| `POST` | `/tasks/reward-status/:id` | Confirm or dispute reward receipt |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications` | Get all notifications |
| `PATCH` | `/notifications/:id/read` | Mark one as read |
| `PATCH` | `/notifications/mark-all-read` | Mark all as read |

---

## Points & Wallet Mechanics

BrinX implements a highly custom points transaction and wallet model designed to ensure trust and active college peer exchange:

1. **Wallet Budget Enforcement**:
   When posting a new task, the system validates that you have sufficient points in your wallet to cover the maximum possible payout. This includes:
   * The basic `reward_points` for a general task.
   * The `max_reward_points` for bidding/auction tasks.
   * **Double (2x)** the budget if the task is flagged as **SOS Urgent**.
   If your points balance is too low, task creation is blocked with a validation error: *"Reward points must be less than or equal to your points wallet."*

2. **Escrow-free Direct Transfer**:
   Points are no longer locked in escrow upon task acceptance. Instead, they remain in the poster's wallet and are transferred directly to the helper's wallet as soon as the poster verifies task completion.

3. **External Reward Points Refund**:
   When a task is completed, the helper can confirm the receipt of their external or physical reward (e.g., cash, coffee, physical favor) by hitting `/api/tasks/reward-status/:id` with status `received`. Once the helper confirms they have received the external reward, **all points previously paid to them for that task are fully refunded back to the poster's points wallet**. This allows points to act as a temporary collateral or trust-token that gets recycled once real-world trade is satisfied!

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

Users can sign in securely using **any** of the following methods:

| Input | Example |
|---|---|
| Google Sign-In | 1-Click native Google OAuth integration |
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
