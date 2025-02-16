// pages/api/online-users.js
import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const usersSnapshot = await adminDb
      .collection('users')
      .where('lastActivity', '>=', fiveMinutesAgo)
      .get();

    const onlineUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ onlineUsers });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
