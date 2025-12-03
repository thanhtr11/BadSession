# BadSession - Badminton Team Management Application

A comprehensive web application for managing badminton team sessions, tracking player attendance, recording donations and expenses, and managing team funds.

## Features

### Authentication & User Management
- User registration and login with JWT authentication
- Role-based access control (Admin and Player roles)
- Admin panel for managing user roles and passwords
- Default admin account (Username: Admin, Password: Admin)

### Dashboard
- Real-time statistics (number of players, guests, fund summaries)
- Recent sessions, donations, and expenses overview
- 30-day financial summaries

### Session Management
- Create badminton sessions (Admin only)
- Player self check-in and guest check-in
- Session history and attendance tracking

### Player Management
- View all registered players
- Access individual player profiles with:
  - Session attendance history
  - Donation history
  - Total donations

### Guest Management
- Track guest attendance
- Guest donation records
- View unique guests and their session attendance

### Finance Management
- Record donations (Admin only)
- Record expenses with categories (Admin only)
- View complete financial history
- Fund summaries and calculations
- 30-day financial reports

### Admin Panel
- Change player passwords
- Update user roles
- User management interface

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MySQL** for data persistence
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled for frontend communication

### Frontend
- **React 18** with React Router for navigation
- **Axios** for API communication
- **Vite** as build tool
- **CSS3** with custom styling (Teal and Charcoal theme)

### Deployment
- **Docker** for containerization
- **Docker Compose** for orchestration
- Full stack runs in containers (MySQL, Server, Web)

## Color Scheme

- **Primary Teal**: #17a2b8
- **Dark Teal**: #138496
- **Light Teal**: #d4f5f8
- **Charcoal**: #2c3e50
- **Light Gray**: #ecf0f1

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development without Docker)

### Running with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd BadSession
```

2. Start all services:
```bash
docker-compose up --build
```

3. Access the application:
   - Web Application: http://localhost:3000
   - API Server: http://localhost:8000
   - Database: localhost:3306

4. Login with default credentials:
   - Username: `Admin`
   - Password: `Admin`

### Running Locally (Without Docker)

#### Backend Setup:
```bash
cd server
npm install
npm run dev
```

#### Frontend Setup:
```bash
cd web
npm install
npm run dev
```

Database: Set up MySQL with schema from `server/schema.sql`

## Project Structure

```
BadSession/
├── server/
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User management
│   │   ├── sessions.js          # Session management
│   │   ├── attendance.js        # Check-in and attendance
│   │   ├── finance.js           # Donations and expenses
│   │   └── dashboard.js         # Dashboard data
│   ├── db.js                    # Database connection
│   ├── auth.js                  # JWT and authorization middleware
│   ├── schema.sql               # Database schema
│   ├── package.json
│   ├── Dockerfile
│   └── index.js                 # Express server entry point
├── web/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Authentication
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── Sessions.jsx     # Session management
│   │   │   ├── Players.jsx      # Player management
│   │   │   ├── Guests.jsx       # Guest management
│   │   │   ├── Finance.jsx      # Finance management
│   │   │   └── AdminPanel.jsx   # Admin controls
│   │   ├── components/
│   │   │   └── Navbar.jsx       # Navigation bar
│   │   ├── App.jsx              # Main app component
│   │   ├── styles.css           # Global styles
│   │   └── main.jsx             # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── docker-compose.yml           # Docker Compose configuration
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/profile/me` - Get current user profile
- `PUT /api/users/:id/role` - Change user role (Admin only)
- `PUT /api/users/:id/password` - Change password

### Sessions
- `POST /api/sessions` - Create session (Admin only)
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get session details

### Attendance
- `POST /api/attendance/check-in` - Check in to session
- `GET /api/attendance/player/:id/history` - Get player attendance
- `GET /api/attendance/guest/:name/history` - Get guest attendance

### Finance
- `POST /api/finance/donations` - Record donation (Admin only)
- `POST /api/finance/expenses` - Record expense (Admin only)
- `GET /api/finance/donations` - Get all donations
- `GET /api/finance/expenses` - Get all expenses
- `GET /api/finance/summary` - Get financial summary

### Dashboard
- `GET /api/dashboard` - Get dashboard data

## Database Schema

### Users Table
- User authentication and role management
- Default admin account pre-configured

### Sessions Table
- Badminton session records with date, time, location

### Attendance Table
- Player and guest check-in records linked to sessions

### Donations Table
- Financial contributions from players and guests

### Expenses Table
- Team expenses with categories and descriptions

## Environment Variables

### Server (.env)
```
DB_HOST=mysql
DB_USER=badsession
DB_PASSWORD=badsession_password
DB_NAME=badsession
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
```

### Frontend (web/.env)
```
VITE_API_URL=http://localhost:5000
```

## Development Notes

- The application uses JWT tokens stored in localStorage for authentication
- All sensitive data is passed through secure HTTP headers
- Password hashing uses bcryptjs with 10 salt rounds
- API routes are protected with authentication middleware
- Admin-only routes use role-based authorization

## Contributing

Feel free to fork this project and submit pull requests for improvements.

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.
