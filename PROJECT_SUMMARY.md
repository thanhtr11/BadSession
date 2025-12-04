# BadSession - Project Summary

## Project Overview
**BadSession** is a comprehensive badminton team management application built with **React** (frontend) and **Node.js/Express** (backend), using **MySQL** as the database. The application enables team admins to manage sessions, track player attendance, record donations/income, manage expenses, and maintain team finances.

---

## Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v6
- **Styling**: CSS3 with responsive design
- **Utilities**: Intl.NumberFormat for VND currency formatting
- **State Management**: React Hooks (useState, useEffect)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (jsonwebtoken)
- **Database**: MySQL 8.0

### DevOps
- **Containerization**: Docker with multi-architecture builds
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions (automated builds on push to main)
- **Registry**: Docker Hub (thanhtr/badsession-*)

---

## Project Structure

```
BadSession/
├── server/                      # Backend (Node.js/Express)
│   ├── routes/
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── users.js            # User management
│   │   ├── attendance.js        # Check-in & attendance tracking
│   │   ├── sessions.js          # Session management
│   │   ├── finance.js           # Income/expense records
│   │   └── dashboard.js         # Dashboard data aggregation
│   ├── index.js                 # Express server setup
│   ├── auth.js                  # JWT authentication middleware
│   ├── db.js                    # MySQL connection pool
│   ├── init-db.js               # Database initialization
│   ├── schema.sql               # Database schema
│   ├── Dockerfile               # Dev Docker image
│   └── Dockerfile.prod          # Production Docker image
│
├── web/                         # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main dashboard with stats & modals
│   │   │   ├── Players.jsx      # Player list & details modal
│   │   │   ├── Guests.jsx       # Guest list & details modal
│   │   │   ├── Sessions.jsx     # Session management
│   │   │   ├── Finance.jsx      # Income/expense recording & viewing
│   │   │   ├── AdminPanel.jsx   # Admin controls (user roles/passwords)
│   │   │   └── Login.jsx        # Authentication UI
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Navigation bar with hamburger menu (mobile)
│   │   │   └── ErrorBoundary.jsx # Error handling wrapper
│   │   ├── utils/
│   │   │   └── format.js        # formatVND utility for VND currency
│   │   ├── api.js               # Axios API client with JWT interceptor
│   │   ├── App.jsx              # Main routing & auth wrapper
│   │   ├── main.jsx             # React entry point
│   │   └── styles.css           # Global styles & responsive design
│   ├── vite.config.js           # Vite configuration
│   ├── index.html               # HTML template
│   ├── Dockerfile               # Dev Docker image
│   └── Dockerfile.prod          # Production Docker image
│
├── scripts/
│   └── smoke-check.js           # E2E smoke test script
│
├── .github/workflows/
│   └── build-and-push.yml       # GitHub Actions CI/CD workflow
│
├── docker-compose.yml           # Development compose config
├── docker-compose.prod.yml      # Production compose config
├── build-and-push.sh            # Bash build & push script
├── build-and-push.ps1           # PowerShell build & push script
└── README.md                    # Documentation
```

---

## Key Features Implemented

### 1. Authentication & Authorization
- **JWT-based authentication** with signed tokens
- **Role-based access control**: Admin, Player
- **Default admin account**: Username: `Admin`, Password: `Admin`
- **User registration**: Players can register new accounts
- **Admin panel**: Change passwords, manage user roles

### 2. Dashboard
- **Real-time statistics**:
  - Total players count
  - Total guests count
  - Total income (all-time)
  - Remaining fund (income - expenses)
  - Income (last 30 days)
  - Expenses (last 30 days)
- **Interactive stat cards**:
  - Click "Players" → Opens modal showing player list
  - Click "Guests" → Opens modal showing guest list
  - Click "Total Income", "Remaining Fund", "Income (30d)", "Expenses (30d)" → Navigate to Finance page
- **Recent records**:
  - Last 5 sessions
  - Last 5 income records
  - Last 5 expenses

### 3. Session Management
- Create/edit/delete sessions (Admin only)
- Player self check-in with QR code or manual
- Guest check-in capability
- Session history tracking
- Location and time details

### 4. Player Management
- View all registered players
- Player detail modal showing:
  - Basic info (username, join date)
  - Total income received
  - Attendance history (with dates, times, locations)
  - Donation/income history (with amounts, dates, notes)

### 5. Guest Management
- Aggregate guest attendance from sessions
- Track guest donation history
- Guest detail modal in Guests page showing:
  - Total guest income
  - Donation history (amount, date, notes)
  - Session history (session ID, date, time, location)
- Dashboard guest modal (summary view)

### 6. Finance Management
- **Income Recording** (Admin only):
  - Record donations/income with contributor info
  - Support for players and guests
  - Search guests when recording income
  - Add notes and dates
- **Expense Recording** (Admin only):
  - Record expenses with category and description
  - Track spending over time
- **Financial Reports**:
  - Complete income history
  - Complete expense history
  - 30-day summaries
  - Fund balance calculations
- **Currency**: All values displayed in **VND** format using Vietnamese locale

### 7. Mobile Optimization
- **Responsive design** for all screen sizes
- **Hamburger menu** for mobile navigation
- **Modal overlay** for menu on mobile (backdrop)
- **Optimized touch targets** for mobile users
- **Table responsiveness** with horizontal scrolling on mobile

### 8. Admin Panel
- Change player passwords
- Update user roles
- User management interface

---

## Recent Enhancements (Latest Session)

### Bug Fixes
1. **Fixed toFixed crash**: Coerced numeric values to ensure proper currency formatting
2. **Added formatVND utility**: Centralized VND formatting using `Intl.NumberFormat('vi-VN')`

### UI/UX Improvements
1. **Changed terminology**:
   - "Donation" → "Income"
   - "$"/"USD" → "VND"
   
2. **Added Guest Features**:
   - Guest search in "Record Income" modal (Finance page)
   - Guest details modal showing total income and history
   - Guest-name preference in attendance records and edits

3. **Mobile Enhancements**:
   - Added hamburger menu (☰) for mobile navigation
   - Menu overlay with backdrop for better UX
   - Fixed navbar visibility on mobile
   - Improved responsive CSS with proper z-index handling

4. **Dashboard Interaction Overhaul**:
   - Made stat cards clickable with visual feedback (cursor: pointer)
   - **Player & Guest stats** now open **modals** instead of navigating
   - **Finance stats** (Total Income, Remaining Fund, 30-day summaries) navigate to Finance page
   - Player modal: Shows list of all players
   - Guest modal: Shows list of all guests with session counts and total income

### Deployment & CI/CD
1. **Local Deployment**:
   - Production Docker stack runs on ports:
     - **9500**: Backend (Express server)
     - **3000**: Frontend (Vite web)
     - **3306**: MySQL database

2. **Docker Images**:
   - Built and pushed to Docker Hub
   - Images: `thanhtr/badsession-web:latest`, `thanhtr/badsession-server:latest`

3. **GitHub Actions**:
   - Automated CI/CD workflow for multi-architecture builds
   - Triggers on push to main branch
   - Uses `docker/buildx-action` for cross-platform builds

4. **Build Scripts**:
   - `build-and-push.sh`: Bash script for Linux/Mac
   - `build-and-push.ps1`: PowerShell script for Windows

---

## Current Running Stack

### Docker Services
```
Container: badsession-mysql (mysql:8.0)
  - Status: Healthy
  - Port: 3306 (MySQL)

Container: badsession-server (thanhtr/badsession-server:latest)
  - Status: Running
  - Port: 9500 (Express API)

Container: badsession-web (thanhtr/badsession-web:latest)
  - Status: Running
  - Port: 3000 (React frontend)
```

### Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:9500/api
- **Database**: localhost:3306 (MySQL)

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new player
- `POST /api/auth/login` - Login and get JWT token

### Users
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id/role` - Update user role (Admin only)
- `PUT /api/users/:id/password` - Change password

### Sessions
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create session (Admin only)
- `PUT /api/sessions/:id` - Update session (Admin only)
- `DELETE /api/sessions/:id` - Delete session (Admin only)

### Attendance
- `GET /api/attendance` - Get recent attendance records
- `POST /api/attendance/check-in` - Check-in player or guest
- `GET /api/attendance/player/:id/history` - Get player attendance history
- `GET /api/attendance/guest/:name/history` - Get guest session history

### Finance
- `GET /api/finance/donations` - Get all donations/income
- `POST /api/finance/donations` - Record donation (Admin only)
- `GET /api/finance/expenses` - Get all expenses
- `POST /api/finance/expenses` - Record expense (Admin only)
- `GET /api/finance/search?type=guest` - Search for guests

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

---

## Environment Variables

### Backend
```
PORT=9500
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=badsession_db
JWT_SECRET=<secret_key_for_signing_tokens>
```

### Frontend
```
VITE_API_BASE_URL=http://localhost:9500/api (for dev)
```

---

## Testing

### Manual Testing via Browser
1. Navigate to http://localhost:3000
2. Login with: `Admin` / `Admin`
3. Test Dashboard:
   - Click Player stat → Player modal opens
   - Click Guest stat → Guest modal opens
   - Click finance stats → Navigate to Finance page
4. Test Sessions, Finance, Admin Panel

### Automated Testing
Run smoke test script:
```bash
cd scripts
node smoke-check.js
```

Checks:
- Create session
- Player check-in
- Guest check-in
- Record donation
- Attendance listing

---

## Known Issues & Improvements

### Current Status
- ✅ All core features working
- ✅ Mobile responsive design
- ✅ Docker deployment
- ✅ GitHub Actions CI/CD
- ✅ Dashboard stat modals
- ✅ VND currency formatting
- ✅ Guest features complete

### Potential Improvements
- Add player/guest detail modals in Dashboard (currently shows summary lists)
- Add animations to hamburger menu
- Add search/filter to modal tables
- Enhance error handling and user feedback
- Add password reset functionality
- Add session cancellation with notifications

---

## Git Repository
- **Repo**: https://github.com/thanhtr11/BadSession
- **Branch**: main
- **Latest Commit**: feat(dashboard): add Player and Guest modals instead of navigation

---

## Running the Application

### Option 1: Docker (Recommended)
```bash
# Production stack
docker-compose -f docker-compose.prod.yml up -d

# Or use build scripts
./build-and-push.sh         # Linux/Mac
./build-and-push.ps1        # Windows PowerShell
```

### Option 2: Local Development
```bash
# Backend
cd server
npm install
npm start

# Frontend (new terminal)
cd web
npm install
npm run dev
```

### Access
- Frontend: http://localhost:3000
- Backend: http://localhost:9500/api
- Default Login: Admin / Admin

---

## Database Schema Highlights
- **users**: Player/Admin accounts with roles
- **sessions**: Badminton session records
- **attendance**: Check-in records (players & guests)
- **donations**: Income/donation records
- **expenses**: Expense tracking records

---

## Conclusion
The BadSession application is a fully functional badminton team management system with modern UI, responsive design, comprehensive features for session/attendance/finance management, and automated CI/CD deployment. The recent enhancements have improved the UX significantly with clickable stat cards, proper modal interactions, localized currency formatting, and mobile optimization.

