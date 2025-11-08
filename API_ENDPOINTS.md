# FlowSpace API Endpoints Documentation

## 🔗 Invite System Endpoints

### Base URL
- **Local**: `http://localhost:8002/api`
- **Production**: `https://flowspace-kmo4.onrender.com/api`

---

## Invite Endpoints

### 1. Test Endpoint (Health Check)
```
GET /api/invite
```
**Description**: Check if invite API is working  
**Authentication**: None required  
**Response**:
```json
{
  "message": "Invite API is working",
  "endpoints": {
    "POST /api/invite": "Send invite (requires auth)",
    "GET /api/invite/:token": "Get invite details (public)",
    "POST /api/invite/:token/accept": "Accept invite (requires auth)",
    "GET /api/invite/board/:boardId": "List invites for a board (requires auth)"
  }
}
```

---

### 2. Send Invite
```
POST /api/invite
```
**Description**: Create and send an invite email  
**Authentication**: Required (JWT token)  
**Headers**:
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```
**Body**:
```json
{
  "email": "recipient@example.com",
  "boardId": "board_id_here",
  "role": "editor"
}
```
**Response** (Success):
```json
{
  "success": true,
  "message": "Invite sent successfully",
  "inviteLink": "https://flowspace-kmo4.onrender.com/invite/abc123...",
  "token": "abc123..."
}
```

---

### 3. Get Invite Details
```
GET /api/invite/:token
```
**Description**: Get details about an invite (public endpoint)  
**Authentication**: None required  
**Example**: `GET /api/invite/abc123...`  
**Response**:
```json
{
  "success": true,
  "invite": {
    "email": "recipient@example.com",
    "role": "editor",
    "invitedBy": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "board": {
      "_id": "board_id",
      "title": "My Board",
      "description": "Board description"
    }
  }
}
```

---

### 4. Accept Invite
```
POST /api/invite/:token/accept
```
**Description**: Accept an invite and join the board  
**Authentication**: Required (JWT token)  
**Headers**:
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```
**Example**: `POST /api/invite/abc123.../accept`  
**Response**:
```json
{
  "success": true,
  "message": "Invite accepted",
  "board": {
    "_id": "board_id",
    "title": "My Board",
    "description": "Board description"
  }
}
```

---

### 5. List Board Invites
```
GET /api/invite/board/:boardId
```
**Description**: Get all invites for a specific board  
**Authentication**: Required (JWT token - must be board owner)  
**Headers**:
```
Authorization: Bearer <your_jwt_token>
```
**Example**: `GET /api/invite/board/board_id_here`  
**Response**:
```json
{
  "invites": [
    {
      "_id": "invite_id",
      "email": "user@example.com",
      "role": "editor",
      "status": "pending",
      "token": "abc123...",
      "invitedBy": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-11-08T00:00:00.000Z",
      "expiresAt": "2024-11-15T00:00:00.000Z"
    }
  ]
}
```

---

## 🔐 Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

To get a JWT token, you need to login via:
```
POST /api/auth/login
```

---

## ⚠️ Error Responses

### 401 Unauthorized
```json
{
  "message": "Not authenticated"
}
```

### 404 Not Found
```json
{
  "message": "Invite not found"
}
```

### 400 Bad Request
```json
{
  "message": "Invite has expired"
}
```
OR
```json
{
  "message": "Invite already used"
}
```

---

## 📧 SMTP Email Configuration

Emails are sent when invites are created. The email contains:
- Invite link: `https://flowspace-kmo4.onrender.com/invite/{token}`
- Board name and description
- Role information (editor/viewer)
- Expiration notice (7 days)

**SMTP Configuration** (Environment Variables):
```bash
SMTP_EMAIL=kakolibanerjee986@gmail.com
SMTP_PASSWORD=qxluigzkjfhtacjy
```

---

## 🧪 Testing Examples

### Using cURL:

**1. Test API Health:**
```bash
curl https://flowspace-kmo4.onrender.com/api/invite
```

**2. Get Invite Details:**
```bash
curl https://flowspace-kmo4.onrender.com/api/invite/YOUR_TOKEN_HERE
```

**3. Send Invite (with auth):**
```bash
curl -X POST https://flowspace-kmo4.onrender.com/api/invite \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "boardId": "board_id_here",
    "role": "editor"
  }'
```

**4. Accept Invite (with auth):**
```bash
curl -X POST https://flowspace-kmo4.onrender.com/api/invite/YOUR_TOKEN_HERE/accept \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🎯 Frontend Integration

The frontend uses these endpoints from:
- `/app/client/pages/Invite.tsx` - Send invites page
- `/app/client/pages/AcceptInvite.tsx` - Accept invite page

Invite links follow this pattern:
```
https://flowspace-kmo4.onrender.com/invite/{token}
```

When user clicks this link:
1. Frontend loads AcceptInvite page
2. Calls `GET /api/invite/:token` to show invite details
3. User clicks "Accept"
4. Calls `POST /api/invite/:token/accept` to join board
5. Redirects to board page
