# FlowSpace - Complete Setup Guide

## Quick Start on Codespaces

### 1. Install Dependencies (if needed)
```bash
cd /app
npm install
```

### 2. Configure Email (Optional but Recommended)
Edit `/app/.env` and add your Gmail credentials:
```
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

To get Gmail App Password:
1. Go to https://myaccount.google.com/apppasswords
2. Generate a new app password
3. Copy the 16-character code

### 3. Start MongoDB
```bash
sudo supervisorctl start mongodb
```

### 4. Seed Database with Demo Data
```bash
npx tsx scripts/seed.ts
```

This creates:
- Demo user (email: demo@flowspace.app, password: demo123)
- Demo board with 5 sample cards
- Welcome notes with markdown

### 5. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:8080`

## Features Implemented

### ✅ 1. Create New Board
- Click "New Board" button on Boards page
- Fill in title and description
- Board is created and saved to MongoDB
- Real-time confetti animation on creation

### ✅ 2. Create New Team
- Click "New Team" button on Teams page
- Enter team name and description
- Team is created with you as admin
- View all your teams

### ✅ 3. Real-time Activity Feed
- Activity page shows all workspace actions
- Updates in real-time via Socket.io
- "Live" badge indicates active connection
- Shows: card created, card updated, notes changed, etc.

### ✅ 4. Email Invites
- Enter email address on Invite page
- Click "Send Invite" to email invitation
- Uses Gmail SMTP (configure credentials in .env)
- Copy invite link button for manual sharing

### ✅ 5. Add Cards to Board
- Click "Add Card" in any column
- Card is created via Socket.io
- Real-time broadcast to all connected clients
- Activity logged automatically

### ✅ 6. Profile Management
- View user profile information
- See recent activity
- Navigate to settings
- Shows email, member since date

### ✅ 7. Settings Page
- Update profile information (name, email)
- Toggle notifications on/off
- Enable/disable compact mode
- Export data functionality
- Delete account (demo mode)
- Save changes button

### ✅ 8. All Buttons Working
- **New Board**: Creates board in database
- **New Team**: Creates team in database
- **Send Invite**: Sends email via SMTP
- **Copy Link**: Copies invite link
- **Add Card**: Creates card via Socket.io
- **Save Changes**: Saves settings
- **Export Data**: Triggers export
- **Delete Account**: Confirmation dialog

## Real-Time Features

All real-time features use Socket.io:

1. **Card Operations**
   - Create card → broadcasts to all users
   - Update card → live sync
   - Delete card → instant removal

2. **Notes Sync**
   - Type in notes → auto-saves after 1 second
   - Changes broadcast to all users
   - Markdown preview updates live

3. **Activity Feed**
   - New activities appear instantly
   - No page refresh needed
   - "Live" indicator shows connection status

## API Endpoints

### Boards
- `GET /api/boards` - List all boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details

### Cards
- `GET /api/cards/:boardId/cards` - List cards
- `POST /api/cards/:boardId/cards` - Create card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `POST /api/teams/:id/members` - Add member

### Activity
- `GET /api/activity` - List activities
- `POST /api/activity` - Create activity

### Invite
- `POST /api/invite` - Send email invite

### Notes
- `GET /api/:boardId/notes` - Get note
- `PUT /api/:boardId/notes` - Update note

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

## Socket.io Events

### Client → Server
- `joinBoard(boardId)` - Join board room
- `leaveBoard(boardId)` - Leave board room
- `card:create(data)` - Create card
- `card:update({id, updates})` - Update card
- `card:delete({id})` - Delete card
- `note:update({boardId, content})` - Update note

### Server → Client
- `presence:update({id, event})` - User joined/left
- `card:create(card)` - New card created
- `card:update(card)` - Card updated
- `card:delete({id})` - Card deleted
- `note:update(note)` - Note updated
- `activity:new(activity)` - New activity

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Auth**: JWT with bcrypt
- **Email**: Nodemailer with Gmail SMTP
- **UI Components**: Radix UI, shadcn/ui

## Troubleshooting

### Port already in use
```bash
pkill -f vite
npm run dev
```

### MongoDB not running
```bash
sudo supervisorctl start mongodb
```

### Email not sending
- Check SMTP credentials in `/app/.env`
- Ensure Gmail app password is correct
- Check firewall/network settings

### Cards not showing
- Verify MongoDB is running
- Check auth token in localStorage
- Open browser DevTools → Network tab

### Real-time not working
- Check Socket.io connection in browser console
- Verify server is running
- Check for CORS errors

## Demo Credentials

- **Email**: demo@flowspace.app
- **Password**: demo123

Auto-login is enabled, so you'll be logged in automatically when you visit the app.

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Seed database
npx tsx scripts/seed.ts

# Type check
npm run typecheck

# Format code
npm run format.fix
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables:
   ```
   MONGO_URI=your-mongodb-connection-string
   JWT_ACCESS_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

3. Start the server:
   ```bash
   npm start
   ```

The app will serve on port 8080 by default.
