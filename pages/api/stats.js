import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const ordersSnapshot = await adminDb.collection('orders').get();
    const productsSnapshot = await adminDb.collection('products').get();
    const subscribersSnapshot = await adminDb.collection('newsletter_signups').get();

    // Calculate total revenue from totalAmount in orders
    const totalRevenue = ordersSnapshot.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);

    res.status(200).json({
      totalOrders: ordersSnapshot.size,
      totalRevenue,
      totalProducts: productsSnapshot.size,
      totalSubscribers: subscribersSnapshot.size
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
