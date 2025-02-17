import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const [ordersSnapshot, productsSnapshot, subscribersSnapshot, usersSnapshot] = await Promise.all([
      adminDb.collection('orders').get(),
      adminDb.collection('products').get(),
      adminDb.collection('newsletter_signups').get(),
      adminDb.collection('users').get()
    ]);

    // Order Statistics
    const orderStats = ordersSnapshot.docs.reduce((acc, doc) => {
      const order = doc.data();
      const amount = order.totalAmount || 0;

      // Status breakdown
      acc.statusCounts[order.status] = (acc.statusCounts[order.status] || 0) + 1;

      // Revenue calculations for shipped orders
      if (order.status === 'Shipped') {
        acc.totalRevenue += amount;
        acc.shippedOrdersCount++;
      }

      return acc;
    }, {
      totalRevenue: 0,
      shippedOrdersCount: 0,
      statusCounts: {}
    });

    // Product Statistics - Build a table for out-of-stock products
    const outOfStockProducts = productsSnapshot.docs.reduce((acc, doc) => {
      const product = doc.data();
      // Assuming product.stock is an object like { small: 0, medium: 0, large: 0 }
      const totalStock = Object.values(product.stock).reduce((sum, quantity) => sum + quantity, 0);

      if (totalStock <= 0) {
        acc.push({
          name: product.name,
          stock: product.stock // e.g., { small: 0, medium: 0, large: 0 }
        });
      }
      return acc;
    }, []);

    // Customer Statistics
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const uniqueCustomers = usersSnapshot.size;
    const newCustomers = usersSnapshot.docs.filter(doc => {
      const { createdAt } = doc.data();
      // Convert createdAt to a Date instance whether it's a Timestamp or a string
      const createdAtDate = createdAt && typeof createdAt.toDate === 'function'
        ? createdAt.toDate()
        : new Date(createdAt);
      return createdAtDate >= oneMonthAgo;
    }).length;

    // Final metrics
    const stats = {
      // Order stats
      totalOrders: ordersSnapshot.size,
      totalRevenue: orderStats.totalRevenue,
      orderStatusBreakdown: orderStats.statusCounts,

      // Customer stats
      totalCustomers: uniqueCustomers,
      newCustomers,

      // Product stats
      totalProducts: productsSnapshot.size,
      outOfStockProducts, // Table of out-of-stock products

      // Subscription stats
      totalSubscribers: subscribersSnapshot.size
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
