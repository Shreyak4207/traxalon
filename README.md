# 🛡️ Traxelon — Law Enforcement Intelligence Tool

Traxelon is a covert link-based tracking system built for authorized law enforcement officers. Officers can generate disguised tracking links, send them to suspects, and capture device intelligence (IP, GPS, browser fingerprint) the moment the link is clicked.

---

## 🏗️ Project Structure

```
traxalon/
│
├── backend/                        # Node.js + Express API server
│   ├── firebase/
│   │   └── config.js               # Firebase Admin SDK initialization
│   ├── routes/
│   │   ├── auth.js                 # OTP send/verify endpoints
│   │   └── links.js                # Tracking link endpoints
│   ├── utils/
│   │   ├── brevoService.js         # Brevo email sending logic
│   │   ├── linkService.js          # Link generation helpers
│   │   └── otpStore.js             # In-memory OTP storage
│   ├── .env                        # Backend environment variables (never commit)
│   ├── .gitignore
│   ├── package.json
│   ├── server.js                   # Entry point
│   └── TrackingCapture.jsx         # Tracking capture page served by backend
│
├── public/                         # Static assets
│   ├── favicon.ico
│   ├── index.html
│   ├── manifest.json
│   ├── robots.txt
│   └── sir.jpg
│
├── src/                            # React frontend source
│   ├── components/
│   │   ├── Navbar.jsx              # Top navigation (auth-aware)
│   │   └── ProtectedRoute.jsx      # Route guard for logged-in users
│   ├── contexts/
│   │   └── AuthContext.jsx         # Firebase auth state management
│   ├── firebase/
│   │   └── config.js               # Firebase client SDK config
│   ├── hooks/
│   │   └── useGeoGrabber.js        # Hook for capturing GPS/device data
│   ├── pages/
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── Dashboard.jsx           # Officer command center
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx              # 3-step OTP registration
│   │   ├── TermsAndConditions.jsx
│   │   └── TrackingCapture.jsx     # Page opened by suspect (captures data)
│   ├── utils/
│   │   ├── linkService.js
│   │   └── otpService.js
│   ├── App.jsx                     # Routes definition
│   ├── index.css                   # Global styles + Tailwind
│   └── index.js                    # React entry point
│
├── .env                            # Frontend environment variables (never commit)
├── .env.local
├── .gitignore
├── package.json
├── postcss.config.js
├── tailwind.config.js              # Tailwind + custom fonts/colors
├── vercel.json                     # Vercel deployment config
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, React Router |
| Auth | Firebase Authentication + Firestore |
| Backend | Node.js, Express.js |
| Email OTP | Brevo (Sendinblue) API |
| Hosting (Frontend) | Vercel |
| Hosting (Backend) | Render / Railway |

---

## 🚀 Running the Project Locally

### Prerequisites
Make sure you have the following installed:
- **Node.js** v18 or above → [Download](https://nodejs.org)
- **npm** (comes with Node.js)
- A **Firebase** project with Firestore and Authentication enabled
- A **Brevo** account for sending OTP emails

---

### Step 1 — Unzip and Open the Project

Extract the zip file. You will see the `backend/`, `src/`, `public/` folders and config files at the root level.

---

### Step 2 — Set Up the Backend

#### Navigate to the backend folder:
```bash
cd backend
```

#### Install dependencies:
```bash
npm install
```

#### Create a `.env` file inside the `backend/` folder:
```env
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

FRONTEND_URL=http://localhost:3000
PORT=5001

BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_sender_email@example.com
BREVO_SENDER_NAME=Traxelon
```

> ⚠️ To get Firebase credentials: Firebase Console → Project Settings → Service Accounts → Generate new private key → copy values from the downloaded JSON into the `.env` fields above.

> ⚠️ To get Brevo API key: brevo.com → Account → SMTP & API → API Keys → Generate new key.

#### Start the backend server:
```bash
npm start
```

You should see:
```
🚀 Traxelon backend running on http://localhost:5001
```

---

### Step 3 — Set Up the Frontend

#### Open a new terminal and go back to the root project folder:
```bash
cd ..
```

#### Install dependencies:
```bash
npm install
```

#### Create a `.env` file in the root folder:
```env
REACT_APP_BACKEND_URL=http://localhost:5001

REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

> ⚠️ To get Firebase frontend config: Firebase Console → Project Settings → Your Apps → Web App → SDK setup and configuration.

#### Start the frontend:
```bash
npm start
```

The app will open at **http://localhost:3000**

---

## 🔐 How Authentication Works

1. Officer fills in the registration form and clicks **Send Verification OTP**
2. Backend sends a 6-digit OTP to the officer's email via Brevo
3. Officer enters the OTP to verify their email
4. Firebase account is created and officer is automatically logged in
5. For subsequent logins, officer uses email + password directly via Firebase Auth

---

## 🌐 Deployment

### Frontend → Vercel
1. Push code to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add all `REACT_APP_*` environment variables in Vercel Dashboard → Settings → Environment Variables
4. Deploy

### Backend → Render
1. Push backend folder to GitHub (or as a separate repo)
2. Create a new **Web Service** in [render.com](https://render.com)
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add all backend `.env` variables in the Render dashboard
6. Deploy and copy the live URL
7. Update `REACT_APP_BACKEND_URL` in Vercel to your Render backend URL and redeploy

---

## ⚠️ Important Security Notes

- **Never commit `.env` files to GitHub** — they are listed in `.gitignore`
- **Never share your Firebase private key or Brevo API key** publicly
- Both `.env` files must be manually created on any new machine
- Do not commit `serviceAccountKey.json` — use `.env` variables instead

---

## 📁 Key Files Reference

| File | Purpose |
|---|---|
| `src/contexts/AuthContext.jsx` | Manages login, signup, logout, user state |
| `src/components/Navbar.jsx` | Top navigation with auth-aware UI |
| `src/pages/Signup.jsx` | 3-step OTP registration flow |
| `src/pages/Login.jsx` | Officer login page |
| `src/pages/Dashboard.jsx` | Main officer command center |
| `src/pages/TrackingCapture.jsx` | Page that captures suspect device data |
| `backend/server.js` | Express server entry point |
| `backend/routes/auth.js` | OTP send/verify API endpoints |
| `backend/routes/links.js` | Tracking link generation endpoints |
| `backend/firebase/config.js` | Firebase Admin SDK initialization |
| `backend/utils/brevoService.js` | Brevo email sending logic |
| `tailwind.config.js` | Custom fonts, colors, and Tailwind theme |

---

*© 2026 Traxelon. Authorized law enforcement use only.*
