# University Gate Control System

A comprehensive, production-ready enterprise system for managing university gate access control, visitor management, materials tracking, and incident reporting.

## 🎯 Features

### Authentication & Authorization
- Secure JWT-based authentication
- Role-based access control (RBAC)
- Password reset functionality
- Email verification
- Session management

### User Roles
- **Main Admin**: Full system control, configuration, audit logs, analytics
- **Admin**: User management, log review, incident handling, role assignment
- **Gate Officer**: Scan ID/QR, allow/deny entry, record materials, report incidents
- **Student**: View own logs and permissions
- **Staff**: Same as student + equipment permissions
- **Visitor Officer**: Register visitors, generate QR passes, manage visitor access

### Core Modules
1. **Gate Control**: Entry/exit logging, inspections, QR code scanning
2. **User Management**: CRUD operations, role assignment
3. **Visitor Management**: Registration, pass generation, blacklist management
4. **Materials Tracking**: Record and approve materials movement
5. **Incident System**: Report, track, and resolve security incidents
6. **Reports & Analytics**: Dashboard, statistics, export functionality

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router v6
- Axios for API calls
- React Icons
- CSS Variables for theming (Light/Dark mode)

### Backend
- Node.js
- Express.js
- MySQL (with connection pooling)
- JWT for authentication
- bcrypt for password hashing
- Express Validator for input validation
- Helmet for security headers
- Rate limiting

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
cd university-gate-control-system
```

### 2. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE university_gate_control;

# Exit MySQL
exit;

# Import schema
mysql -u root -p university_gate_control < database/schema.sql
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your database credentials
# DB_PASSWORD=your_password
# JWT_SECRET=your-secret-key-min-32-characters
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

## ▶️ Running the Application

### Start Backend Server

```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### Start Frontend Development Server

```bash
cd frontend
npm start
# App runs on http://localhost:3000
```

## 🔐 Default Credentials

**Main Admin Account:**
- Email: `admin@university.edu`
- Password: `Admin@123`

**Note:** Change the default password immediately after first login!

## 📁 Project Structure

```
university-gate-control-system/
├── database/
│   └── schema.sql              # Database schema and seed data
├── backend/
│   ├── config/
│   │   └── database.js         # Database connection
│   ├── controllers/            # Request handlers
│   ├── middleware/
│   │   ├── auth.js             # JWT & RBAC middleware
│   │   └── validators.js       # Validation & error handling
│   ├── routes/
│   │   ├── index.js            # Main router
│   │   ├── auth.js             # Auth routes
│   │   └── gateControl.js      # Gate control routes
│   ├── services/
│   │   ├── authService.js      # Auth business logic
│   │   └── gateControlService.js
│   ├── utils/                  # Helper functions
│   ├── .env.example            # Environment template
│   ├── package.json
│   └── server.js               # Entry point
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── DashboardLayout.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── GateControl.jsx
    │   │   ├── GateLogs.jsx
    │   │   └── Profile.jsx
    │   ├── services/
    │   │   └── api.js          # API service layer
    │   ├── App.jsx             # Main app component
    │   ├── index.js            # Entry point
    │   └── index.css           # Global styles
    └── package.json
```

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token authentication with expiration
- Role-based permission checks
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection (Helmet.js)
- Rate limiting on API endpoints
- CORS configuration
- Secure HTTP headers

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `PUT /api/auth/change-password` - Change password (authenticated)
- `GET /api/auth/me` - Get current user profile

### Gate Control
- `POST /api/gate/log` - Record entry/exit
- `GET /api/gate/logs` - Get gate logs (paginated)
- `GET /api/gate/logs/:id` - Get single log
- `PUT /api/gate/logs/:id/inspection` - Update inspection status
- `GET /api/gate/stats/today` - Get today's statistics
- `GET /api/gate/activity/recent` - Get recent activity

## 🎨 Features in Detail

### Responsive Design
- Mobile-first approach
- Adapts to all screen sizes
- Touch-friendly interface

### Theme Support
- Light and Dark modes
- Persistent theme preference
- Smooth transitions

### Real-time Updates
- Dashboard statistics
- Recent activity feed
- Quick actions

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=university_gate_control
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h
FRONTEND_URL=http://localhost:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is proprietary software developed for university use.

## 👥 Support

For issues and questions:
- Check the documentation
- Contact the development team
- Review error logs in the console

## 🔄 Future Enhancements

- QR code generation and scanning
- Email notifications
- SMS alerts
- Biometric integration
- Mobile app
- Advanced analytics
- Multi-language support
- Audit trail export

---

**Built with ❤️ for secure campus access management**
