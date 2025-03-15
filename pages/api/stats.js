import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const [
      ordersSnapshot,
      productsSnapshot,
      subscribersSnapshot,
      usersSnapshot
    ] = await Promise.all([
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

    // Product Statistics - Build a table for products with ANY size out of stock.
    // Adapted for the new structure where stock is nested under each color.
    // Product Statistics - Build a table for products with ANY size out of stock.
const outOfStockProducts = productsSnapshot.docs.reduce((acc, doc) => {
  const product = doc.data();

  // Ensure product.colors is a valid array
  if (!Array.isArray(product.colors)) return acc;

  // Iterate through each color and check stock for each size.
  const colorsOutOfStock = product.colors.map(color => {
    // Ensure color.stock exists as an object
    const stock = color.stock || {};
    const outOfStockSizes = Object.entries(stock).filter(([size, qty]) => qty <= 0);
    if (outOfStockSizes.length > 0) {
      return {
        color: color.name,
        outOfStockSizes: outOfStockSizes.reduce((obj, [size, qty]) => {
          obj[size] = qty;
          return obj;
        }, {})
      };
    }
    return null;
  }).filter(colorInfo => colorInfo !== null);

  if (colorsOutOfStock.length > 0) {
    acc.push({
      name: product.name,
      outOfStockDetails: colorsOutOfStock
    });
  }
  return acc;
}, []);


    // Customer Statistics
    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));

    const uniqueCustomers = usersSnapshot.size;
    const newCustomers = usersSnapshot.docs.filter(doc => {
      const { createdAt } = doc.data();
      const createdAtDate = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
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
      outOfStockProducts, // Table of out-of-stock products with color and size details

      // Subscription stats
      totalSubscribers: subscribersSnapshot.size
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
