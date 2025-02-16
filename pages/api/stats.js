import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const [ordersSnapshot, productsSnapshot, subscribersSnapshot] = await Promise.all([
      adminDb.collection('orders').get(),
      adminDb.collection('products').get(),
      adminDb.collection('newsletter_signups').get()
    ]);

    // Order Statistics
    const orderStats = ordersSnapshot.docs.reduce((acc, doc) => {
      const order = doc.data();
      const amount = order.totalAmount || 0;
      
      // Status breakdown
      acc.statusCounts[order.status] = (acc.statusCounts[order.status] || 0) + 1;
      
      // Revenue calculations
      if (order.status === 'shipped') {
        acc.totalRevenue += amount;
        acc.shippedOrdersCount++;
      }
      
      // Customer tracking
      if (order.userId) {
        acc.userIds.add(order.userId);
        acc.orderCountPerUser.set(order.userId, (acc.orderCountPerUser.get(order.userId) || 0) + 1);
      }
      
      return acc;
    }, {
      totalRevenue: 0,
      shippedOrdersCount: 0,
      statusCounts: {},
      userIds: new Set(),
      orderCountPerUser: new Map()
    });

    // Product Statistics
    const inventoryStats = productsSnapshot.docs.reduce((acc, doc) => {
      const product = doc.data();
      if (product.stockQuantity <= 0) acc.outOfStock++;
      if (product.stockQuantity > 0 && product.stockQuantity < 10) acc.lowStock++;
      return acc;
    }, { outOfStock: 0, lowStock: 0 });

    // Customer Statistics
    const uniqueCustomers = orderStats.userIds.size;
    const repeatCustomers = [...orderStats.orderCountPerUser.values()].filter(count => count > 1).length;

    // Final metrics
    const stats = {
      // Order stats
      totalOrders: ordersSnapshot.size,
      totalRevenue: orderStats.totalRevenue,
      averageOrderValue: orderStats.shippedOrdersCount > 0 
        ? orderStats.totalRevenue / orderStats.shippedOrdersCount 
        : 0,
      orderStatusBreakdown: orderStats.statusCounts,
      
      // Customer stats
      totalCustomers: uniqueCustomers,
      repeatCustomers,
      newCustomers: uniqueCustomers - repeatCustomers,
      
      // Product stats
      totalProducts: productsSnapshot.size,
      ...inventoryStats,
      
      // Subscription stats
      totalSubscribers: subscribersSnapshot.size
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}