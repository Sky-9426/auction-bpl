# BPL Auction - Box Premier League Auction Platform

A real-time cricket player auction platform built with React, Vite, and Firebase. Designed for managing live auctions with real-time bidding, team management, and player tracking.

![BPL Auction](https://img.shields.io/badge/Status-Active-green) ![React](https://img.shields.io/badge/React-18+-blue) ![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-orange)

---

## 🎯 Features

- **Real-time Bidding**: Live auction with instant bid updates across all connected clients
- **Multi-role Access**: Support for Admin, Auctioneer, Teams, and Spectators
- **Team Management**: Create and manage 6 teams with budgets, rosters, and squad planning
- **Player Management**: Add, edit, and track cricket players with detailed stats
- **Live Auction Dashboard**: Real-time auction status with bid history and team standings
- **Player Retention**: Admin can retain players for teams at fixed prices
- **Responsive UI**: Beautiful dark-themed interface with Tailwind CSS
- **Database Seeding**: One-click database initialization with sample data

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + JSX
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS + PostCSS
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Authentication (Email/Password)
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **UI Components**: Lucide Icons, React Hot Toast
- **Node Version**: 16+ recommended

---

## 📋 Prerequisites

- Node.js 16+
- npm or yarn
- Firebase project with Realtime Database enabled
- Git

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Sky-9426/auction-bpl.git
cd auction-bpl
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration

#### Get Firebase Credentials:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing: `bvritbpl-8fd60`
3. Go to **Project Settings** → **General** tab
4. Copy the Web App configuration

#### Update Firebase Config:
Update `src/lib/firebase.js` with your Firebase credentials:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "YOUR_DATABASE_URL",
};
```

#### Setup Firebase Rules:
1. Go to Firebase Console → **Realtime Database** → **Rules** tab
2. Replace with these rules:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
3. Click **Publish**

⚠️ **Note**: These rules allow open access for development. For production, implement proper security rules.

---

## 🎮 Running the Application

### Development Server
```bash
npm run dev
```
The app will run at `http://localhost:5173/`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## 📱 Usage Guide

### 1. Access the Application
- Navigate to `http://localhost:5173/`
- You'll see the login page with role options

### 2. Login Credentials

| Role | Username | Password | Access |
|------|----------|----------|--------|
| **Admin** | admin | admin123 | Full control - manage everything |
| **Auctioneer** | auctioneer | auction123 | Run live auction |
| **Teams** | diode_dragons | dragons | Participate in bidding |
| **Spectator** | player | player123 | View-only access |
| **Overview** | overview | (no password) | Guest dashboard access |

### 3. Admin Panel Features
- **Seed Database**: Click "Seed Database" button to populate with sample data
- **Teams Overview**: Manage team budgets, logos, and owner photos
- **Players Management**: Add, edit, or delete players
- **Player Retention**: Retain players for specific teams
- **Credentials**: Change login passwords
- **Auction Control**: Reset entire auction or modify individual players

### 4. Team Panel
- View team squad and budget
- Manage team captain and vice-captain
- Place bids during live auction
- Track sold and available players

### 5. Auctioneer Panel
- Start bidding on players
- Manage bid increments
- Declare players as sold/unsold
- Control auction flow

### 6. Spectator View
- Watch live auction in real-time
- View bid history
- See team standings
- Track sold players

---

## 🗂️ Project Structure

```
bpl-auction/
├── src/
│   ├── assets/              # Team logos and assets
│   ├── components/          # React components
│   │   ├── Navbar.jsx       # Navigation bar
│   │   ├── SoldCelebration.jsx
│   │   └── StatsGraph.jsx
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication context
│   ├── hooks/
│   │   └── useFirestore.js  # Firebase hooks & actions
│   ├── lib/
│   │   ├── firebase.js      # Firebase configuration
│   │   ├── seedData.js      # Database seeding
│   │   └── migrate.js
│   ├── pages/               # Page components
│   │   ├── AdminPage.jsx
│   │   ├── AuctioneerPage.jsx
│   │   ├── TeamPage.jsx
│   │   ├── PlayerPage.jsx
│   │   ├── OverviewPage.jsx
│   │   └── LoginPage.jsx
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── firebase.json            # Firebase configuration
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
├── postcss.config.js        # PostCSS config
└── package.json             # Project dependencies
```

---

## 🔧 Key Functions

### Database Seeding
```javascript
// Seed all data at once
import { seedDatabase } from './lib/seedData'
await seedDatabase()
```

Populates with:
- 6 Teams (with budgets of ₹10,000 each)
- 12 Players (with cricket statistics)
- Auction state
- Login credentials
- Team settings

### Real-time Data Hooks
```javascript
import { useAuction, usePlayers, useTeams, useBranding } from './hooks/useFirestore'

// Get live auction state
const { auction, loading } = useAuction()

// Get all players
const { players, loading } = usePlayers()

// Get all teams
const { teams, loading } = useTeams()
```

### Auction Actions
```javascript
import { auctionActions } from './hooks/useFirestore'

// Start bidding on a player
await auctionActions.startBid(player)

// Place a bid
await auctionActions.placeBid(teamId, teamName, teamEmoji)

// Declare sold
await auctionActions.declareSold(auction, teams)

// Reset entire auction
await auctionActions.resetAuction(players)
```

---

## 🔐 Firebase Security Rules (Production)

For production use, implement restrictive rules:
```json
{
  "rules": {
    "settings": {
      "credentials": {
        ".read": false,
        ".write": false
      }
    },
    "auction": {
      ".read": true,
      ".write": ["admin", "auctioneer"]
    },
    "teams": {
      ".read": true,
      ".write": ["admin"]
    },
    "players": {
      ".read": true,
      ".write": ["admin"]
    }
  }
}
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

---

## 📝 Environment Variables

No environment variables required for basic setup. Firebase config is in `src/lib/firebase.js`.

---

## 🐛 Troubleshooting

### Firebase Permission Denied Error
- Update Firebase Realtime Database rules to allow read/write
- Ensure `databaseURL` is correctly configured

### No Data Showing
- Click "Seed Database" button in Admin Panel
- Wait for Firebase rules to publish
- Refresh the page

### Bid Increment Not Working
- Check `getBidIncrement()` function in `useFirestore.js`
- Confirm auction status is 'live'

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👥 Team

- **Developer**: Sky-9426
- **Email**: 23211a0488@bvrit.ac.in
- **Organization**: ECE Rogers, BVRIT

---

## 🎓 About BPL

**Box Premier League (BPL)** is a cricket auction simulation platform built for ECE students at BVRIT. It provides hands-on experience with:
- Real-time database synchronization
- Team management and budgeting
- Live auction dynamics
- Full-stack web development

---

## 📞 Support

For issues or questions:
1. Check the [GitHub Issues](https://github.com/Sky-9426/auction-bpl/issues)
2. Review Firebase console for database errors
3. Check browser console for JavaScript errors

---

**Last Updated**: May 2, 2026  
**Version**: 1.0.0
