import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Enhanced data fetching with better error handling
    const collections = await Promise.allSettled([
      adminDb.collection('orders').get(),
      adminDb.collection('products').get(),
      adminDb.collection('newsletter_signups').get(),
      adminDb.collection('users').get()
    ]);

    // Check for failed collections and handle gracefully
    const [ordersResult, productsResult, subscribersResult, usersResult] = collections;
    
    if (ordersResult.status === 'rejected') {
      console.error('Failed to fetch orders:', ordersResult.reason);
    }
    if (productsResult.status === 'rejected') {
      console.error('Failed to fetch products:', productsResult.reason);
    }
    if (subscribersResult.status === 'rejected') {
      console.error('Failed to fetch subscribers:', subscribersResult.reason);
    }
    if (usersResult.status === 'rejected') {
      console.error('Failed to fetch users:', usersResult.reason);
    }

    const ordersSnapshot = ordersResult.status === 'fulfilled' ? ordersResult.value : { docs: [], size: 0 };
    const productsSnapshot = productsResult.status === 'fulfilled' ? productsResult.value : { docs: [], size: 0 };
    const subscribersSnapshot = subscribersResult.status === 'fulfilled' ? subscribersResult.value : { docs: [], size: 0 };
    const usersSnapshot = usersResult.status === 'fulfilled' ? usersResult.value : { docs: [], size: 0 };

    // Enhanced date calculations
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Enhanced Order Statistics with trends and insights
    const SHIPPING_FEE = 8; // 8 TND shipping fee
    
    const orderStats = ordersSnapshot.docs.reduce((acc, doc) => {
      const order = doc.data();
      const totalAmount = parseFloat(order.totalAmount) || 0;
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      
      // Separate product revenue from shipping fees
      const productRevenue = Math.max(0, totalAmount - SHIPPING_FEE);
      const shippingRevenue = totalAmount > 0 ? SHIPPING_FEE : 0;

      // Status breakdown
      acc.statusCounts[order.status] = (acc.statusCounts[order.status] || 0) + 1;

      // Revenue calculations (product revenue only)
      acc.totalProductRevenue += productRevenue;
      acc.totalShippingRevenue += shippingRevenue;
      acc.totalRevenue += totalAmount; // Keep total for reference

      // Monthly comparisons
      if (orderDate >= startOfCurrentMonth) {
        acc.currentMonthProductRevenue += productRevenue;
        acc.currentMonthShippingRevenue += shippingRevenue;
        acc.currentMonthRevenue += totalAmount;
        acc.currentMonthOrders++;
      }

      if (orderDate >= startOfLastMonth && orderDate <= endOfLastMonth) {
        acc.lastMonthProductRevenue += productRevenue;
        acc.lastMonthShippingRevenue += shippingRevenue;
        acc.lastMonthRevenue += totalAmount;
        acc.lastMonthOrders++;
      }

      // Weekly tracking
      if (orderDate >= oneWeekAgo) {
        acc.weeklyProductRevenue += productRevenue;
        acc.weeklyShippingRevenue += shippingRevenue;
        acc.weeklyRevenue += totalAmount;
        acc.weeklyOrders++;
      }

      // Average order value calculation (total amount)
      acc.totalOrderValue += totalAmount;

      // Popular payment methods
      if (order.paymentMethod) {
        acc.paymentMethods[order.paymentMethod] = (acc.paymentMethods[order.paymentMethod] || 0) + 1;
      }

      return acc;
    }, {
      totalRevenue: 0,
      totalProductRevenue: 0,
      totalShippingRevenue: 0,
      currentMonthRevenue: 0,
      currentMonthProductRevenue: 0,
      currentMonthShippingRevenue: 0,
      lastMonthRevenue: 0,
      lastMonthProductRevenue: 0,
      lastMonthShippingRevenue: 0,
      weeklyRevenue: 0,
      weeklyProductRevenue: 0,
      weeklyShippingRevenue: 0,
      statusCounts: {},
      currentMonthOrders: 0,
      lastMonthOrders: 0,
      weeklyOrders: 0,
      totalOrderValue: 0,
      paymentMethods: {}
    });

    // Calculate revenue growth (using product revenue for business metrics)
    const productRevenueGrowth = orderStats.lastMonthProductRevenue > 0 
      ? ((orderStats.currentMonthProductRevenue - orderStats.lastMonthProductRevenue) / orderStats.lastMonthProductRevenue * 100).toFixed(1)
      : orderStats.currentMonthProductRevenue > 0 ? 100 : 0;

    const totalRevenueGrowth = orderStats.lastMonthRevenue > 0
      ? ((orderStats.currentMonthRevenue - orderStats.lastMonthRevenue) / orderStats.lastMonthRevenue * 100).toFixed(1)
      : orderStats.currentMonthRevenue > 0 ? 100 : 0;

    const ordersGrowth = orderStats.lastMonthOrders > 0
      ? ((orderStats.currentMonthOrders - orderStats.lastMonthOrders) / orderStats.lastMonthOrders * 100).toFixed(1)
      : orderStats.currentMonthOrders > 0 ? 100 : 0;

    // Enhanced Product Analytics
    const productAnalytics = productsSnapshot.docs.reduce((acc, doc) => {
      const product = doc.data();
      
      if (!Array.isArray(product.colors)) return acc;

      let totalStock = 0;
      let lowStockItems = 0;
      const outOfStockColors = [];
      const lowStockColors = [];

      product.colors.forEach(color => {
        const stock = color.stock || {};
        let colorTotalStock = 0;
        const outOfStockSizes = {};
        const lowStockSizes = {};

        Object.entries(stock).forEach(([size, qty]) => {
          const quantity = parseInt(qty) || 0;
          colorTotalStock += quantity;
          totalStock += quantity;

          if (quantity === 0) {
            outOfStockSizes[size] = quantity;
          } else if (quantity <= 5 && quantity > 0) { // Low stock threshold
            lowStockSizes[size] = quantity;
            lowStockItems++;
          }
        });

        if (Object.keys(outOfStockSizes).length > 0) {
          outOfStockColors.push({
            color: color.name,
            outOfStockSizes
          });
        }

        if (Object.keys(lowStockSizes).length > 0) {
          lowStockColors.push({
            color: color.name,
            lowStockSizes
          });
        }
      });

      // Track products by stock status
      if (outOfStockColors.length > 0) {
        acc.outOfStockProducts.push({
          name: product.name,
          id: doc.id,
          outOfStockDetails: outOfStockColors,
          totalStock
        });
      }

      if (lowStockColors.length > 0) {
        acc.lowStockProducts.push({
          name: product.name,
          id: doc.id,
          lowStockDetails: lowStockColors,
          totalStock
        });
      }

      // Category analytics
      if (product.category) {
        acc.categoryCounts[product.category] = (acc.categoryCounts[product.category] || 0) + 1;
      }

      acc.totalInventoryValue += (product.price || 0) * totalStock;
      acc.totalStockUnits += totalStock;

      return acc;
    }, {
      outOfStockProducts: [],
      lowStockProducts: [],
      categoryCounts: {},
      totalInventoryValue: 0,
      totalStockUnits: 0
    });

    // Enhanced Customer Analytics
    const customerAnalytics = usersSnapshot.docs.reduce((acc, doc) => {
      const user = doc.data();
      const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);

      // Monthly growth tracking
      if (createdAt >= oneMonthAgo) {
        acc.newCustomersLastMonth++;
      }

      if (createdAt >= oneWeekAgo) {
        acc.newCustomersLastWeek++;
      }

      if (createdAt >= startOfCurrentMonth) {
        acc.newCustomersThisMonth++;
      }

      if (createdAt >= startOfLastMonth && createdAt <= endOfLastMonth) {
        acc.newCustomersLastMonthPrevious++;
      }

      // Location analytics (if available)
      if (user.city || user.governorate) {
        const location = user.governorate || user.city || 'Unknown';
        acc.customersByLocation[location] = (acc.customersByLocation[location] || 0) + 1;
      }

      return acc;
    }, {
      newCustomersLastMonth: 0,
      newCustomersLastWeek: 0,
      newCustomersThisMonth: 0,
      newCustomersLastMonthPrevious: 0,
      customersByLocation: {}
    });

    // Calculate customer growth rate
    const customerGrowth = customerAnalytics.newCustomersLastMonthPrevious > 0
      ? ((customerAnalytics.newCustomersThisMonth - customerAnalytics.newCustomersLastMonthPrevious) / customerAnalytics.newCustomersLastMonthPrevious * 100).toFixed(1)
      : customerAnalytics.newCustomersThisMonth > 0 ? 100 : 0;

    // Newsletter analytics
    const newsletterStats = subscribersSnapshot.docs.reduce((acc, doc) => {
      const subscriber = doc.data();
      const subscribedAt = subscriber.createdAt?.toDate ? subscriber.createdAt.toDate() : new Date(subscriber.subscribedAt || subscriber.createdAt);

      if (subscribedAt >= oneMonthAgo) {
        acc.newSubscribersLastMonth++;
      }

      if (subscribedAt >= oneWeekAgo) {
        acc.newSubscribersLastWeek++;
      }

      return acc;
    }, {
      newSubscribersLastMonth: 0,
      newSubscribersLastWeek: 0
    });

    // Calculate key performance indicators
    const averageOrderValue = ordersSnapshot.size > 0 
      ? (orderStats.totalOrderValue / ordersSnapshot.size).toFixed(2)
      : 0;

    const conversionRate = usersSnapshot.size > 0
      ? ((ordersSnapshot.size / usersSnapshot.size) * 100).toFixed(2)
      : 0;

    // Compile comprehensive stats
    const stats = {
      // Enhanced order metrics with separated revenues
      totalOrders: ordersSnapshot.size,
      totalRevenue: parseFloat(orderStats.totalRevenue.toFixed(2)), // Total including shipping
      totalProductRevenue: parseFloat(orderStats.totalProductRevenue.toFixed(2)), // Product revenue only
      totalShippingRevenue: parseFloat(orderStats.totalShippingRevenue.toFixed(2)), // Shipping revenue only
      currentMonthRevenue: parseFloat(orderStats.currentMonthRevenue.toFixed(2)),
      currentMonthProductRevenue: parseFloat(orderStats.currentMonthProductRevenue.toFixed(2)),
      currentMonthShippingRevenue: parseFloat(orderStats.currentMonthShippingRevenue.toFixed(2)),
      lastMonthRevenue: parseFloat(orderStats.lastMonthRevenue.toFixed(2)),
      lastMonthProductRevenue: parseFloat(orderStats.lastMonthProductRevenue.toFixed(2)),
      lastMonthShippingRevenue: parseFloat(orderStats.lastMonthShippingRevenue.toFixed(2)),
      weeklyRevenue: parseFloat(orderStats.weeklyRevenue.toFixed(2)),
      weeklyProductRevenue: parseFloat(orderStats.weeklyProductRevenue.toFixed(2)),
      weeklyShippingRevenue: parseFloat(orderStats.weeklyShippingRevenue.toFixed(2)),
      productRevenueGrowth: parseFloat(productRevenueGrowth),
      totalRevenueGrowth: parseFloat(totalRevenueGrowth),
      ordersGrowth: parseFloat(ordersGrowth),
      averageOrderValue: parseFloat(averageOrderValue),
      orderStatusBreakdown: orderStats.statusCounts,
      paymentMethodBreakdown: orderStats.paymentMethods,
      shippingFee: SHIPPING_FEE, // Include shipping fee for reference

      // Enhanced customer metrics
      totalCustomers: usersSnapshot.size,
      newCustomers: customerAnalytics.newCustomersLastMonth,
      newCustomersThisMonth: customerAnalytics.newCustomersThisMonth,
      newCustomersLastWeek: customerAnalytics.newCustomersLastWeek,
      customerGrowth: parseFloat(customerGrowth),
      customersByLocation: customerAnalytics.customersByLocation,
      conversionRate: parseFloat(conversionRate),

      // Enhanced product metrics
      totalProducts: productsSnapshot.size,
      outOfStockProducts: productAnalytics.outOfStockProducts,
      lowStockProducts: productAnalytics.lowStockProducts,
      totalStockUnits: productAnalytics.totalStockUnits,
      totalInventoryValue: parseFloat(productAnalytics.totalInventoryValue.toFixed(2)),
      productsByCategory: productAnalytics.categoryCounts,

      // Newsletter metrics
      totalSubscribers: subscribersSnapshot.size,
      newSubscribersLastMonth: newsletterStats.newSubscribersLastMonth,
      newSubscribersLastWeek: newsletterStats.newSubscribersLastWeek,

      // Performance indicators with separated revenue metrics
      kpis: {
        totalRevenue: parseFloat(orderStats.totalRevenue.toFixed(2)),
        totalProductRevenue: parseFloat(orderStats.totalProductRevenue.toFixed(2)),
        totalShippingRevenue: parseFloat(orderStats.totalShippingRevenue.toFixed(2)),
        totalOrders: ordersSnapshot.size,
        totalCustomers: usersSnapshot.size,
        averageOrderValue: parseFloat(averageOrderValue),
        conversionRate: parseFloat(conversionRate),
        productRevenueGrowth: parseFloat(productRevenueGrowth),
        totalRevenueGrowth: parseFloat(totalRevenueGrowth),
        customerGrowth: parseFloat(customerGrowth)
      },

      // Data freshness indicator
      lastUpdated: new Date().toISOString(),
      dataQuality: {
        ordersAvailable: ordersResult.status === 'fulfilled',
        productsAvailable: productsResult.status === 'fulfilled',
        usersAvailable: usersResult.status === 'fulfilled',
        subscribersAvailable: subscribersResult.status === 'fulfilled'
      }
    };

    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    
    // Return more detailed error information in development
    const isDev = process.env.NODE_ENV === 'development';
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: isDev ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}