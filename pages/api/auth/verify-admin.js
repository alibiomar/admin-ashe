import { adminAuth } from "../../../lib/firebaseAdmin";

export default async function handler(req, res) {
  try {
    const { uid } = req.body;
    const userRecord = await adminAuth.getUser(uid);
    const isAdmin = userRecord.customClaims?.admin || false;
    
    res.status(200).json({ isAdmin });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ 
      error: error.message,
      help: process.env.NODE_ENV === 'development' 
        ? 'Check your .env.local file credentials' 
        : undefined
    });
  }
}