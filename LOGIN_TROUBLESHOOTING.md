# Login Issue Troubleshooting Guide

## 🐛 Problem: Login Redirects Back to Login Page

This happens when the authentication flow fails after successful Firebase login.

---

## ✅ Fixes Applied

### 1. **Fixed API URL Configuration**
**Issue**: Frontend was looking for `VITE_API_URL` but it wasn't configured properly.

**Solution**:
- Updated `/app/client/.env` to set `VITE_API_URL=` (empty for production)
- When empty, the app uses relative URLs (e.g., `/api/auth/firebase-login`)
- This works seamlessly on Render without hardcoding URLs

### 2. **Authentication Flow**
The login flow works as follows:
1. User enters email/password
2. Firebase authenticates the user
3. Frontend gets Firebase user object
4. Frontend calls `POST /api/auth/firebase-login` with Firebase UID
5. Backend creates/finds user in MongoDB
6. Backend returns JWT access token
7. Frontend stores token and user data
8. User is redirected to `/board`

---

## 🔧 Environment Variables for Render

Add these in your Render dashboard → Environment:

```bash
# MongoDB Connection (REQUIRED - replace XXXXXX with your cluster ID)
MONGO_URI=mongodb+srv://kakolibanerjee986_db_user:1gkKErae7bP8VPBd@cluster0.XXXXXX.mongodb.net/mernify?retryWrites=true&w=majority

# JWT Secrets (REQUIRED)
JWT_ACCESS_SECRET=flowspace_access_secret_2024_secure
JWT_REFRESH_SECRET=flowspace_refresh_secret_2024_secure

# Application URLs (REQUIRED)
APP_URL=https://flowspace-kmo4.onrender.com
FRONTEND_URL=https://flowspace-kmo4.onrender.com

# API Configuration (REQUIRED - leave empty!)
VITE_API_URL=

# SMTP Email (REQUIRED for invites)
SMTP_EMAIL=kakolibanerjee986@gmail.com
SMTP_PASSWORD=qxluigzkjfhtacjy

# Node Environment (OPTIONAL)
NODE_ENV=production
```

---

## 🧪 Testing Login After Deployment

### 1. Create a Test Account
```
Email: test@example.com
Password: test123456
```

### 2. Check Browser Console
Open DevTools (F12) → Console tab and look for:
- ✅ "Logged in: {user object}" - Firebase auth successful
- ✅ Network tab: `POST /api/auth/firebase-login` should return 200 OK
- ❌ If you see CORS errors → Backend CORS config issue
- ❌ If you see 404 on `/api/auth/firebase-login` → Backend routing issue
- ❌ If you see 500 error → MongoDB connection or backend error

### 3. Check Network Tab
1. Open DevTools → Network tab
2. Try to login
3. Look for `firebase-login` request
4. Check:
   - **Status**: Should be 200 OK
   - **Response**: Should contain `{"access": "...", "user": {...}}`
   - **Request Headers**: Should have `Content-Type: application/json`

---

## 🔍 Common Issues & Solutions

### Issue 1: "Cannot POST /api/auth/firebase-login"
**Cause**: Backend routes not properly registered or server not running.

**Solution**:
- Verify backend is running on Render
- Check Render logs for server startup messages
- Ensure `app.use("/api/auth", authRoutes)` is in server/index.ts

---

### Issue 2: CORS Errors
**Cause**: Backend not allowing requests from your frontend domain.

**Solution**:
- Backend has `cors({ origin: true, credentials: true })`
- This allows all origins, so CORS shouldn't be an issue
- If still seeing CORS errors, check Render logs

---

### Issue 3: MongoDB Connection Failed
**Cause**: Invalid MongoDB URI or connection string.

**Solution**:
- Get correct connection string from MongoDB Atlas
- Format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname`
- Replace `XXXXXX` with actual cluster ID
- Check MongoDB Atlas → Network Access → Allow 0.0.0.0/0

---

### Issue 4: JWT Token Not Stored
**Cause**: LocalStorage issue or token not returned from backend.

**Check**:
1. Open DevTools → Application → Local Storage
2. Look for `accessToken` key
3. If missing, check Network response from `/api/auth/firebase-login`

**Solution**:
- Clear browser cache and localStorage
- Try incognito/private mode
- Check backend returns `{"access": "...", "user": {...}}`

---

### Issue 5: Infinite Login Loop
**Cause**: AuthContext not detecting authentication properly.

**Check**:
1. Console logs show: "Logged in: {user}"
2. But still redirects to login page
3. `isAuthenticated` in AuthContext is false

**Solution**:
- The 1-second delay in login should help: `await new Promise(resolve => setTimeout(resolve, 1000))`
- Check that localStorage has `accessToken`
- Verify AuthContext reads token: `localStorage.getItem('accessToken')`

---

## 📝 Quick Checklist for Render Deployment

Before deploying, ensure:

- [ ] All environment variables are set in Render
- [ ] MongoDB URI has correct cluster ID (not `XXXXXX`)
- [ ] `VITE_API_URL` is set to empty string
- [ ] Backend and frontend are built: `yarn build:client && yarn build:server`
- [ ] Start command is: `yarn start`
- [ ] Port is set (Render usually uses 10000 or auto-assigns)

---

## 🔐 Firebase Configuration

Firebase credentials are **hardcoded** in `/app/client/lib/firebase.ts`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAgApQKVhP2AtMZijLypzfhZozRLWZulTQ",
  authDomain: "flowspace-60e2b.firebaseapp.com",
  projectId: "flowspace-60e2b",
  storageBucket: "flowspace-60e2b.firebasestorage.app",
  messagingSenderId: "1094258189185",
  appId: "1:1094258189185:web:436ba11bdd08af136a7e80",
  measurementId: "G-SEPVSSGBHB"
};
```

**No environment variables needed for Firebase!** It's already configured.

---

## 🚀 After Deployment

1. **Test Health Check**:
   ```bash
   curl https://flowspace-kmo4.onrender.com/api/ping
   ```
   Should return: `{"message": "ping"}`

2. **Test Auth Endpoint**:
   ```bash
   curl https://flowspace-kmo4.onrender.com/api/auth/firebase-login
   ```
   Should return: `{"message": "Missing uid or email"}`

3. **Try Login**:
   - Go to: https://flowspace-kmo4.onrender.com
   - Click "Login"
   - Create new account or use existing
   - Should redirect to `/board` after successful login

---

## 📞 Support

If login still doesn't work after following this guide:

1. Check Render logs for errors
2. Check browser console for JavaScript errors
3. Check Network tab for failed API calls
4. Verify all environment variables are set correctly
5. Try creating a new user account (instead of logging in with existing)

**Most common fix**: Make sure MongoDB URI has the correct cluster ID!
