# 🏏 BPL Auction — Setup Guide
**Box Premier League · ECE Rogers · Season 4**

---

## ⚡ What You Get
- Instant real-time bidding (Firebase WebSockets, <100ms sync)
- 3 role-based logins: Super Admin, Auctioneer, 6 Teams
- Buttery smooth animations (Framer Motion)
- Works on mobile, tablet, and desktop
- All data persists in Firebase cloud

---

## 📋 Step-by-Step Setup

### STEP 1 — Install Node.js
Download from: https://nodejs.org (choose LTS version)
After installing, open a terminal and verify:
```
node --version   # should show v18 or higher
npm --version
```

### STEP 2 — Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add project"** → Name it `bpl-auction`
3. Disable Google Analytics (not needed) → **Create project**

### STEP 3 — Enable Firestore Database
1. In Firebase console → left sidebar → **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** → Next
4. Choose your nearest region → Done

### STEP 4 — Enable Authentication
1. Left sidebar → **Authentication** → **Get started**
2. Click **"Email/Password"** → Enable → Save
*(You don't need to create users — we handle auth in code)*

### STEP 5 — Get Firebase Config
1. Go to **Project Settings** (gear icon, top left)
2. Scroll down to **"Your apps"** → Click **Web** icon `</>`
3. Register app as `bpl-web` → **Register App**
4. Copy the `firebaseConfig` object shown

### STEP 6 — Add Config to Project
Open the file: `src/lib/firebase.js`
Replace the placeholder config with yours:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",        // ← your values
  authDomain: "bpl-auction.firebaseapp.com",
  projectId: "bpl-auction",
  storageBucket: "bpl-auction.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

### STEP 7 — Install & Run
Open terminal in the project folder:
```bash
npm install          # installs all packages (~2 mins)
npm run dev          # starts development server
```
Open http://localhost:5173 in your browser 🎉

### STEP 8 — Seed the Database (ONCE)
1. Log in as **Super Admin** (password: `admin123`)
2. Click **"Seed DB"** button on the dashboard
3. Wait for success message → Refresh

That's it! Your database is now populated with all 6 teams and 12 sample players.

---

## 🔐 Login Credentials

| Role | Identifier | Password |
|------|-----------|----------|
| Super Admin | `admin` | `admin123` |
| Auctioneer | `auctioneer` | `auction123` |
| Diode Dragons | `diode_dragons` | `dragons` |
| Electrode Eagles | `electrode_eagles` | `eagles` |
| Kirchoff Riders | `kirchoff_riders` | `riders` |
| Mux Mavericks | `mux_mavericks` | `mavs` |
| Quantum Blasters | `quantum_blasters` | `blasters` |
| Voltage Vikings | `voltage_vikings` | `vikings` |

**To change passwords:** Edit `src/context/AuthContext.jsx` → `CREDENTIALS` object

---

## 🎮 How to Run the Auction

### Auction Day Flow:
1. **Admin logs in** → Adds players to pool if needed
2. **Auctioneer logs in** → Sees all available players
3. **All 6 teams log in** on separate devices (phones work great!)
4. **Auctioneer taps a player** → Bidding begins instantly
5. **Teams see the BIG BID BUTTON** and tap to bid
6. **Auctioneer clicks SOLD!** → Player goes to winning team
7. Repeat until all players are sold!

---

## 🚀 Deploy to the Internet (Free)

### Option A — Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # select your bpl-auction project
npm run build           # creates dist/ folder
firebase deploy
```
You'll get a URL like: `https://bpl-auction.web.app`

### Option B — Vercel (Even simpler)
1. Push code to GitHub
2. Go to https://vercel.com → Import project
3. Deploy with one click

---

## 🗂️ Project Structure
```
bpl-auction/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx      ← Role selection + login
│   │   ├── AdminPage.jsx      ← Super admin dashboard
│   │   ├── AuctioneerPage.jsx ← Live auction control
│   │   └── TeamPage.jsx       ← Team bidding interface
│   ├── components/
│   │   └── Navbar.jsx         ← Top navigation
│   ├── hooks/
│   │   └── useFirestore.js    ← All Firebase real-time hooks
│   ├── context/
│   │   └── AuthContext.jsx    ← Authentication logic
│   ├── lib/
│   │   ├── firebase.js        ← Firebase config ← EDIT THIS
│   │   └── seedData.js        ← Initial team/player data
│   ├── App.jsx                ← Routing
│   ├── main.jsx               ← Entry point
│   └── index.css              ← Global styles + animations
├── package.json
├── vite.config.js
├── tailwind.config.js
└── SETUP.md (this file)
```

---

## 🔮 Phase 2 Features (Future)
- Live match scorecards (IPL-style)
- Video highlights upload
- Points table & standings
- Schedule & fixtures
- Push notifications when outbid
- Player photo uploads

---

## ❓ Troubleshooting

**"Module not found" errors** → Run `npm install` again

**Firebase permission errors** → Make sure Firestore is in test mode (Rules tab → allow read, write for now)

**Changes not showing in real-time** → Check browser console for Firebase errors, verify your config is correct

**Teams can see each other's passwords** → The passwords are client-side for simplicity. For production security, move to Firebase Authentication with proper user accounts.
