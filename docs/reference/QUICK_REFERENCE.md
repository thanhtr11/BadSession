# ⚡ Code Optimization - Quick Reference Guide

## 🚀 Quick Start with New Code

### 1. Use Constants Instead of Magic Strings

**Before**:
```javascript
// Scattered throughout components
const role = 'Admin';
const route = '/dashboard';
const color = '#17a2b8';
```

**After**:
```javascript
import { USER_ROLES, ROUTES, COLORS } from '../config/constants';

const role = USER_ROLES.ADMIN;
navigate(ROUTES.DASHBOARD);
const style = { color: COLORS.PRIMARY_TEAL };
```

**Where to Import**:
```javascript
import {
  ROUTES,
  USER_ROLES,
  MESSAGES,
  HTTP_STATUS,
  COLORS,
  ENDPOINTS,
  ICONS,
  STORAGE_KEYS,
  VALIDATION_RULES
} from '../config/constants';
```

---

### 2. Use useAuth Hook for Authentication

**Before**:
```javascript
// In App.jsx
const [user, setUser] = useState(null);
const [isAuthenticated, setIsAuthenticated] = useState(false);

useEffect(() => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  // ... auth logic
}, []);

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // ... more logic
};
```

**After**:
```javascript
import { useAuth } from '../hooks';

function MyComponent() {
  const { user, logout, hasRole, getToken } = useAuth();
  
  // Ready to use!
  if (hasRole('Admin')) {
    return <AdminView />;
  }
  
  return <PlayerView />;
}
```

**Methods Available**:
```javascript
const {
  user,              // Current user object
  isAuthenticated,   // Boolean
  isLoading,         // Boolean
  error,             // Error message or null
  
  login,             // login(token, userData)
  logout,            // logout()
  getToken,          // getToken() - returns JWT
  hasRole,           // hasRole('Admin') - boolean
  hasAnyRole,        // hasAnyRole(['Admin', 'Player']) - boolean
  clearAuth          // clearAuth()
} = useAuth();
```

---

### 3. Use useFetch Hook for Data Loading

**Before**:
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  api.get('/api/sessions')
    .then(res => {
      setData(res.data);
      setError(null);
    })
    .catch(err => {
      setError(err);
      setData(null);
    })
    .finally(() => setLoading(false));
}, []);
```

**After**:
```javascript
import { useFetch } from '../hooks';

function SessionsList() {
  const { data, loading, error, refetch } = useFetch('/sessions');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data.map(session => (
        <SessionItem key={session.id} session={session} />
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

**Features**:
- ✅ Automatic caching (5 min default)
- ✅ Request deduplication
- ✅ Manual refetch
- ✅ Error handling

**Options**:
```javascript
useFetch('/api/endpoint', {
  method: 'GET',        // Default: 'GET'
  body: null,           // For POST/PUT
  cacheTime: 300000,    // Default: 5 min (in ms)
  skip: false,          // Set true to skip fetch
  refetch: 0            // Triggers refetch when changed
});
```

---

### 4. Use useForm Hook for Forms

**Before**:
```javascript
const [values, setValues] = useState({ username: '', password: '' });
const [errors, setErrors] = useState({});

const handleChange = (e) => {
  const { name, value } = e.target;
  setValues(prev => ({ ...prev, [name]: value }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  // validation logic
  // submit logic
};
```

**After**:
```javascript
import { useForm } from '../hooks';

function LoginForm() {
  const form = useForm(
    // Initial values
    { username: '', password: '' },
    
    // On submit
    async (values) => {
      const response = await api.post('/auth/login', values);
      navigate('/dashboard');
    },
    
    // Validation
    (values) => {
      const errors = {};
      if (!values.username) errors.username = 'Required';
      if (!values.password) errors.password = 'Required';
      return errors;
    }
  );
  
  return (
    <form onSubmit={form.handleSubmit}>
      <input
        type="text"
        {...form.getFieldProps('username')}
      />
      {form.getFieldError('username') && (
        <span>{form.getFieldError('username')}</span>
      )}
      
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

**Properties**:
```javascript
form.values           // Current form values
form.errors           // Field errors
form.touched          // Fields user has touched
form.isSubmitting     // Is form being submitted
form.submitError      // Error during submit
form.submitSuccess    // Success flag
form.isDirty          // Form has changes
```

**Methods**:
```javascript
form.handleChange()        // Handle input change
form.handleBlur()          // Handle input blur
form.handleSubmit()        // Handle form submission
form.handleReset()         // Reset to initial values
form.setFieldValue()       // Set specific field
form.setFieldError()       // Set field error
form.getFieldProps()       // Get field props (name, value, onChange, onBlur)
form.getFieldError()       // Get field error if touched
form.validate()            // Run validation
```

---

### 5. Backend: Use Error Classes

**Before**:
```javascript
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    // ... login logic
    
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

**After**:
```javascript
import { asyncHandler } from '../utils/middleware';
import { ValidationError, NotFoundError } from '../utils/errors';

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  // Validation errors
  if (!username || !password) {
    throw new ValidationError('Username and password required', {
      username: !username ? 'Required' : null,
      password: !password ? 'Required' : null
    });
  }
  
  // Logic errors
  const user = await User.findByUsername(username);
  if (!user) {
    throw new NotFoundError('User');
  }
  
  // Success
  res.json({ success: true, data: user });
}));
```

**Error Classes**:
```javascript
import {
  APIError,              // Generic error (500)
  ValidationError,       // Input validation (400)
  AuthenticationError,   // Unauthorized (401)
  AuthorizationError,    // Forbidden (403)
  NotFoundError,         // Resource not found (404)
  ConflictError,         // Already exists (409)
  DatabaseError          // DB error (500)
} from '../utils/errors';

// Usage
throw new ValidationError('Invalid input');
throw new AuthenticationError('Invalid credentials');
throw new NotFoundError('User');
throw new ConflictError('User already exists');
```

**Middleware**:
```javascript
const { asyncHandler, errorHandler } = require('../utils/middleware');

// Wrap async routes
router.get('/data', asyncHandler(async (req, res) => {
  // No try-catch needed!
  const data = await fetchData();
  res.json(data);
}));

// Add error handler (last middleware in Express)
app.use(errorHandler);
```

---

### 6. API Service - Automatic Token Injection

**Before**:
```javascript
// In every component
const response = await axios.get('/api/sessions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

**After**:
```javascript
// In components
import apiClient from '../services/api';

const response = await apiClient.get('/sessions');
// Token automatically added! ✨
```

**Features**:
```javascript
import apiClient from '../services/api';

// Automatic JWT injection
// Automatic error handling
// Automatic logout on 401/403
// Consistent error format
// Request/response logging

// Use anywhere
const response = await apiClient.get('/endpoint');
const response = await apiClient.post('/endpoint', data);
const response = await apiClient.put('/endpoint', data);
const response = await apiClient.delete('/endpoint');
```

---

## 📂 File Locations

### Frontend
```
web/src/
├── config/constants.js        ← Import constants
├── hooks/
│   ├── useAuth.js            ← Import useAuth
│   ├── useFetch.js           ← Import useFetch
│   ├── useForm.js            ← Import useForm
│   └── index.js              ← Barrel export
├── services/api.js           ← Import apiClient
└── App.jsx
```

### Backend
```
server/
├── config/constants.js        ← Import constants
├── utils/
│   ├── errors.js            ← Import error classes
│   └── middleware.js        ← Import asyncHandler, errorHandler
└── index.js
```

---

## 🎯 Quick Import Cheatsheet

### Frontend
```javascript
// Constants
import constants from '../config/constants';
import { ROUTES, MESSAGES, USER_ROLES } from '../config/constants';

// Hooks
import { useAuth, useFetch, useForm } from '../hooks';
import useAuth from '../hooks/useAuth';

// Services
import apiClient from '../services/api';
```

### Backend
```javascript
// Constants
const { USER_ROLES, HTTP_STATUS, MESSAGES } = require('../config/constants');

// Errors
const { 
  ValidationError, 
  NotFoundError, 
  AuthenticationError 
} = require('../utils/errors');

// Middleware
const { asyncHandler, errorHandler } = require('../utils/middleware');
```

---

## 🔍 Common Patterns

### Check if User is Admin
```javascript
import { useAuth } from '../hooks';

function AdminPanel() {
  const { hasRole } = useAuth();
  
  if (!hasRole('Admin')) {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Panel</div>;
}
```

### Load and Display Data
```javascript
import { useFetch } from '../hooks';
import { MESSAGES } from '../config/constants';

function DataList() {
  const { data, loading, error } = useFetch('/api/items');
  
  if (loading) return <div>{MESSAGES.LOADING}</div>;
  if (error) return <div>{MESSAGES.ERROR_GENERIC}</div>;
  if (!data || data.length === 0) return <div>{MESSAGES.NO_DATA}</div>;
  
  return <ul>{data.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}
```

### Form with Validation
```javascript
import { useForm } from '../hooks';
import { MESSAGES, VALIDATION_RULES } from '../config/constants';

function CreateForm() {
  const form = useForm(
    { name: '', email: '' },
    async (values) => {
      await apiClient.post('/items', values);
      alert(MESSAGES.SUCCESS_CREATED);
    },
    (values) => {
      const errors = {};
      
      if (!values.name || values.name.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
        errors.name = 'Name too short';
      }
      
      if (!values.email || !VALIDATION_RULES.EMAIL_PATTERN.test(values.email)) {
        errors.email = 'Invalid email';
      }
      
      return errors;
    }
  );
  
  return (
    <form onSubmit={form.handleSubmit}>
      <input {...form.getFieldProps('name')} />
      {form.getFieldError('name') && <span>{form.getFieldError('name')}</span>}
      
      <input {...form.getFieldProps('email')} />
      {form.getFieldError('email') && <span>{form.getFieldError('email')}</span>}
      
      <button type="submit">{form.isSubmitting ? 'Creating...' : 'Create'}</button>
    </form>
  );
}
```

### Backend Endpoint
```javascript
const { asyncHandler } = require('../utils/middleware');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { USER_ROLES } = require('../config/constants');

router.post('/sessions', asyncHandler(async (req, res) => {
  // Validation
  if (!req.body.name) {
    throw new ValidationError('Session name required');
  }
  
  // Business logic
  const session = await Session.create(req.body);
  
  // Success
  res.json({
    success: true,
    data: session
  });
}));
```

---

## 💡 Pro Tips

1. **Always use useAuth instead of reading localStorage**
   ```javascript
   // ✅ Good
   const { user } = useAuth();
   
   // ❌ Avoid
   const user = JSON.parse(localStorage.getItem('user'));
   ```

2. **Always use constants instead of magic strings**
   ```javascript
   // ✅ Good
   navigate(ROUTES.DASHBOARD);
   
   // ❌ Avoid
   navigate('/dashboard');
   ```

3. **Always use useFetch for API calls**
   ```javascript
   // ✅ Good
   const { data } = useFetch('/api/sessions');
   
   // ❌ Avoid
   const [data, setData] = useState(null);
   useEffect(() => { /* fetch logic */ }, []);
   ```

4. **Always use error classes for validation**
   ```javascript
   // ✅ Good
   throw new ValidationError('Invalid input');
   
   // ❌ Avoid
   return res.status(400).json({ error: 'Invalid' });
   ```

---

## 📊 Before & After Examples

### Example 1: User Dashboard

**Before** (No optimization):
```javascript
// web/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const user = JSON.parse(userData);
      setUser(user);
      
      // Fetch sessions
      axios.get(`http://localhost:9500/api/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => setSessions(res.data))
        .catch(err => console.log('Error:', err))
        .finally(() => setLoading(false));
    } else {
      navigate('/login');
    }
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>No user</div>;
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.full_name}</p>
      {user.role === 'Admin' && <button>Admin Panel</button>}
      <button onClick={handleLogout}>Logout</button>
      
      <div>
        <h2>Sessions</h2>
        {sessions && sessions.map(s => (
          <div key={s.id}>{s.name}</div>
        ))}
      </div>
    </div>
  );
}
```

**After** (With optimization):
```javascript
// web/src/pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useFetch } from '../hooks';
import { ROUTES, USER_ROLES, MESSAGES, ENDPOINTS } from '../config/constants';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, hasRole, logout } = useAuth();
  const { data: sessions, loading } = useFetch(ENDPOINTS.SESSIONS.LIST);
  
  if (!user) return <div>{MESSAGES.NO_DATA}</div>;
  if (loading) return <div>{MESSAGES.LOADING}</div>;
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.full_name}</p>
      {hasRole(USER_ROLES.ADMIN) && (
        <button onClick={() => navigate(ROUTES.ADMIN)}>Admin Panel</button>
      )}
      <button onClick={() => { logout(); navigate(ROUTES.LOGIN); }}>Logout</button>
      
      <div>
        <h2>Sessions</h2>
        {sessions?.map(s => (
          <div key={s.id}>{s.name}</div>
        ))}
      </div>
    </div>
  );
}
```

**Improvements**:
- ✅ Less boilerplate code
- ✅ Cleaner state management
- ✅ Easier to read and maintain
- ✅ Reusable patterns
- ✅ Better error handling

---

## 🚀 Next Steps

1. Start using new hooks in your components
2. Replace magic strings with constants
3. Use apiClient from services
4. Follow error handling patterns for backend routes
5. Read CODE_OPTIMIZATION.md for detailed guide

---

**Happy coding! 🎉**
