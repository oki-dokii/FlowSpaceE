import express from 'express';
import { sendInvite, acceptInvite, listInvites, getInviteDetails } from '../controllers/inviteController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Test endpoint
router.get('/', (req, res) => {
  res.json({ 
    message: 'Invite API is working',
    endpoints: {
      'POST /api/invite': 'Send invite (requires auth)',
      'GET /api/invite/:token': 'Get invite details (public)',
      'POST /api/invite/:token/accept': 'Accept invite (requires auth)',
      'GET /api/invite/board/:boardId': 'List invites for a board (requires auth)'
    }
  });
});

// Send invite
router.post('/', authMiddleware, sendInvite);

// Get invite details (public - for displaying invite info before accepting)
router.get('/:token', getInviteDetails);

// Accept invite
router.post('/:token/accept', authMiddleware, acceptInvite);

// List invites for a board
router.get('/board/:boardId', authMiddleware, listInvites);

export default router;
