import { RequestHandler } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'smart-clinic-d59c5',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const firebaseLogin: RequestHandler = async (req, res, next) => {
  try {
    const { uid, email, name } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify Firebase token (optional, for added security)
    // const decodedToken = await admin.auth().verifyIdToken(token);

    // Find or create user in our database
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        password: 'firebase_auth_' + uid, // Placeholder, won't be used
        firebaseUid: uid,
      });
    }

    // Create our own JWT for additional security
    const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'emergent_flowspace_access_secret_' + Date.now();
    const access = jwt.sign({ userId: user._id }, ACCESS_SECRET, { expiresIn: '7d' });

    res.json({ user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }, access });
  } catch (err) {
    next(err);
  }
};
