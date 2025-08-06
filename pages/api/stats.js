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
      adminDb.collection('users').get(),
      adminDb.collection('offline_sales').get(),
      adminDb.collection('spendings').get()
    ]);

    // Check for failed collections and handle gracefully
    const [ordersResult, productsResult, subscribersResult, usersResult, offlineSalesResult, spendingsResult] = collections;

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
    if (offlineSalesResult.status === 'rejected') {
      console.error('Failed to fetch offline sales:', offlineSalesResult.reason);
    }
    if (spendingsResult.status === 'rejected') {
      console.error('Failed to fetch spendings:', spendingsResult.reason);
    }

    const ordersSnapshot = ordersResult.status === 'fulfilled' ? ordersResult.value : { docs: [], size: 0 };
    const productsSnapshot = productsResult.status === 'fulfilled' ? productsResult.value : { docs: [], size: 0 };
    const subscribersSnapshot = subscribersResult.status === 'fulfilled' ? subscribersResult.value : { docs: [], size: 0 };
    const usersSnapshot = usersResult.status === 'fulfilled' ? usersResult.value : { docs: [], size: 0 };
    const offlineSalesSnapshot = offlineSalesResult.status === 'fulfilled' ? offlineSalesResult.value : { docs: [], size: 0 };
    const spendingsSnapshot = spendingsResult.status === 'fulfilled' ? spendingsResult.value : { docs: [], size: 0 };

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
      acc.totalOnlineProductRevenue += productRevenue;
      acc.totalOnlineShippingRevenue += shippingRevenue;
      acc.totalOnlineRevenue += totalAmount;

      // Monthly comparisons
      if (orderDate >= startOfCurrentMonth) {
        acc.currentMonthOnlineProductRevenue += productRevenue;
        acc.currentMonthOnlineShippingRevenue += shippingRevenue;
        acc.currentMonthOnlineRevenue += totalAmount;
        acc.currentMonthOrders++;
      }

      if (orderDate >= startOfLastMonth && orderDate <= endOfLastMonth) {
        acc.lastMonthOnlineProductRevenue += productRevenue;
        acc.lastMonthOnlineShippingRevenue += shippingRevenue;
        acc.lastMonthOnlineRevenue += totalAmount;
        acc.lastMonthOrders++;
      }

      // Weekly tracking
      if (orderDate >= oneWeekAgo) {
        acc.weeklyOnlineProductRevenue += productRevenue;
        acc.weeklyOnlineShippingRevenue += shippingRevenue;
        acc.weeklyOnlineRevenue += totalAmount;
        acc.weeklyOrders++;
      }

      // Average order value calculation (total amount)
      acc.totalOnlineOrderValue += totalAmount;

      // Popular payment methods
      if (order.paymentMethod) {
        acc.paymentMethods[order.paymentMethod] = (acc.paymentMethods[order.paymentMethod] || 0) + 1;
      }

      return acc;
    }, {
      totalOnlineRevenue: 0,
      totalOnlineProductRevenue: 0,
      totalOnlineShippingRevenue: 0,
      currentMonthOnlineRevenue: 0,
      currentMonthOnlineProductRevenue: 0,
      currentMonthOnlineShippingRevenue: 0,
      lastMonthOnlineRevenue: 0,
      lastMonthOnlineProductRevenue: 0,
      lastMonthOnlineShippingRevenue: 0,
      weeklyOnlineRevenue: 0,
      weeklyOnlineProductRevenue: 0,
      weeklyOnlineShippingRevenue: 0,
      statusCounts: {},
      currentMonthOrders: 0,
      lastMonthOrders: 0,
      weeklyOrders: 0,
      totalOnlineOrderValue: 0,
      paymentMethods: {}
    });

    // Offline Sales Statistics
    const offlineSalesStats = offlineSalesSnapshot.docs.reduce((acc, doc) => {
      const sale = doc.data();
      const totalAmount = parseFloat(sale.totalAmount) || 0;
      const saleDate = sale.saleDate?.toDate ? sale.saleDate.toDate() : new Date(sale.saleDate);

      // No shipping fee for offline sales
      acc.totalOfflineProductRevenue += totalAmount;
      acc.totalOfflineRevenue += totalAmount;

      // Monthly comparisons
      if (saleDate >= startOfCurrentMonth) {
        acc.currentMonthOfflineProductRevenue += totalAmount;
        acc.currentMonthOfflineRevenue += totalAmount;
        acc.currentMonthSales++;
      }

      if (saleDate >= startOfLastMonth && saleDate <= endOfLastMonth) {
        acc.lastMonthOfflineProductRevenue += totalAmount;
        acc.lastMonthOfflineRevenue += totalAmount;
        acc.lastMonthSales++;
      }

      // Weekly tracking
      if (saleDate >= oneWeekAgo) {
        acc.weeklyOfflineProductRevenue += totalAmount;
        acc.weeklyOfflineRevenue += totalAmount;
        acc.weeklySales++;
      }

      // Average sale value
      acc.totalOfflineSaleValue += totalAmount;

      return acc;
    }, {
      totalOfflineRevenue: 0,
      totalOfflineProductRevenue: 0,
      currentMonthOfflineRevenue: 0,
      currentMonthOfflineProductRevenue: 0,
      lastMonthOfflineRevenue: 0,
      lastMonthOfflineProductRevenue: 0,
      weeklyOfflineRevenue: 0,
      weeklyOfflineProductRevenue: 0,
      currentMonthSales: 0,
      lastMonthSales: 0,
      weeklySales: 0,
      totalOfflineSaleValue: 0
    });

    // Spending Statistics
    const spendingStats = spendingsSnapshot.docs.reduce((acc, doc) => {
      const spending = doc.data();
      const amount = parseFloat(spending.amount) || 0;
      const spendingDate = spending.date?.toDate ? spending.date.toDate() : new Date(spending.date);

      acc.totalExpenses += amount;

      // Monthly comparisons
      if (spendingDate >= startOfCurrentMonth) {
        acc.currentMonthExpenses += amount;
      }

      if (spendingDate >= startOfLastMonth && spendingDate <= endOfLastMonth) {
        acc.lastMonthExpenses += amount;
      }

      // Weekly tracking
      if (spendingDate >= oneWeekAgo) {
        acc.weeklyExpenses += amount;
      }

      // Category breakdown
      if (spending.category) {
        acc.expenseByCategory[spending.category] = (acc.expenseByCategory[spending.category] || 0) + amount;
      }

      return acc;
    }, {
      totalExpenses: 0,
      currentMonthExpenses: 0,
      lastMonthExpenses: 0,
      weeklyExpenses: 0,
      expenseByCategory: {}
    });

    // Calculate growth metrics
    const totalProductRevenue = orderStats.totalOnlineProductRevenue + offlineSalesStats.totalOfflineProductRevenue;
    const totalRevenue = orderStats.totalOnlineRevenue + offlineSalesStats.totalOfflineRevenue;
    const totalShippingRevenue = orderStats.totalOnlineShippingRevenue; // No shipping for offline
    const productRevenueGrowth = (orderStats.lastMonthOnlineProductRevenue + offlineSalesStats.lastMonthOfflineProductRevenue) > 0
      ? (((orderStats.currentMonthOnlineProductRevenue + offlineSalesStats.currentMonthOfflineProductRevenue) - 
          (orderStats.lastMonthOnlineProductRevenue + offlineSalesStats.lastMonthOfflineProductRevenue)) / 
         (orderStats.lastMonthOnlineProductRevenue + offlineSalesStats.lastMonthOfflineProductRevenue) * 100).toFixed(1)
      : (orderStats.currentMonthOnlineProductRevenue + offlineSalesStats.currentMonthOfflineProductRevenue) > 0 ? 100 : 0;

    const totalRevenueGrowth = (orderStats.lastMonthOnlineRevenue + offlineSalesStats.lastMonthOfflineRevenue) > 0
      ? (((orderStats.currentMonthOnlineRevenue + offlineSalesStats.currentMonthOfflineRevenue) - 
          (orderStats.lastMonthOnlineRevenue + offlineSalesStats.lastMonthOfflineRevenue)) / 
         (orderStats.lastMonthOnlineRevenue + offlineSalesStats.lastMonthOfflineRevenue) * 100).toFixed(1)
      : (orderStats.currentMonthOnlineRevenue + offlineSalesStats.currentMonthOfflineRevenue) > 0 ? 100 : 0;

    const ordersGrowth = (orderStats.lastMonthOrders + offlineSalesStats.lastMonthSales) > 0
      ? (((orderStats.currentMonthOrders + offlineSalesStats.currentMonthSales) - 
          (orderStats.lastMonthOrders + offlineSalesStats.lastMonthSales)) / 
         (orderStats.lastMonthOrders + offlineSalesStats.lastMonthSales) * 100).toFixed(1)
      : (orderStats.currentMonthOrders + offlineSalesStats.currentMonthSales) > 0 ? 100 : 0;

    const expensesGrowth = spendingStats.lastMonthExpenses > 0
      ? ((spendingStats.currentMonthExpenses - spendingStats.lastMonthExpenses) / spendingStats.lastMonthExpenses * 100).toFixed(1)
      : spendingStats.currentMonthExpenses > 0 ? 100 : 0;

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
          } else if (quantity <= 5 && quantity > 0) {
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
    const totalOrdersAndSales = ordersSnapshot.size + offlineSalesSnapshot.size;
    const averageOrderValue = totalOrdersAndSales > 0
      ? ((orderStats.totalOnlineOrderValue + offlineSalesStats.totalOfflineSaleValue) / totalOrdersAndSales).toFixed(2)
      : 0;

    const conversionRate = usersSnapshot.size > 0
      ? ((totalOrdersAndSales / usersSnapshot.size) * 100).toFixed(2)
      : 0;

    const netProfit = totalRevenue - spendingStats.totalExpenses;

    // Compile comprehensive stats
    const stats = {
      // Combined order and offline sales metrics
      totalOrders: totalOrdersAndSales,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalProductRevenue: parseFloat(totalProductRevenue.toFixed(2)),
      totalShippingRevenue: parseFloat(totalShippingRevenue.toFixed(2)),
      currentMonthRevenue: parseFloat((orderStats.currentMonthOnlineRevenue + offlineSalesStats.currentMonthOfflineRevenue).toFixed(2)),
      currentMonthProductRevenue: parseFloat((orderStats.currentMonthOnlineProductRevenue + offlineSalesStats.currentMonthOfflineProductRevenue).toFixed(2)),
      currentMonthShippingRevenue: parseFloat(orderStats.currentMonthOnlineShippingRevenue.toFixed(2)),
      lastMonthRevenue: parseFloat((orderStats.lastMonthOnlineRevenue + offlineSalesStats.lastMonthOfflineRevenue).toFixed(2)),
      lastMonthProductRevenue: parseFloat((orderStats.lastMonthOnlineProductRevenue + offlineSalesStats.lastMonthOfflineProductRevenue).toFixed(2)),
      lastMonthShippingRevenue: parseFloat(orderStats.lastMonthOnlineShippingRevenue.toFixed(2)),
      weeklyRevenue: parseFloat((orderStats.weeklyOnlineRevenue + offlineSalesStats.weeklyOfflineRevenue).toFixed(2)),
      weeklyProductRevenue: parseFloat((orderStats.weeklyOnlineProductRevenue + offlineSalesStats.weeklyOfflineProductRevenue).toFixed(2)),
      weeklyShippingRevenue: parseFloat(orderStats.weeklyOnlineShippingRevenue.toFixed(2)),
      productRevenueGrowth: parseFloat(productRevenueGrowth),
      totalRevenueGrowth: parseFloat(totalRevenueGrowth),
      ordersGrowth: parseFloat(ordersGrowth),
      averageOrderValue: parseFloat(averageOrderValue),
      orderStatusBreakdown: orderStats.statusCounts,
      paymentMethodBreakdown: orderStats.paymentMethods,
      shippingFee: SHIPPING_FEE,

      // Spending metrics
      totalExpenses: parseFloat(spendingStats.totalExpenses.toFixed(2)),
      currentMonthExpenses: parseFloat(spendingStats.currentMonthExpenses.toFixed(2)),
      lastMonthExpenses: parseFloat(spendingStats.lastMonthExpenses.toFixed(2)),
      weeklyExpenses: parseFloat(spendingStats.weeklyExpenses.toFixed(2)),
      expensesGrowth: parseFloat(expensesGrowth),
      expenseByCategory: spendingStats.expenseByCategory,
      netProfit: parseFloat(netProfit.toFixed(2)),

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

      // Performance indicators
      kpis: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalProductRevenue: parseFloat(totalProductRevenue.toFixed(2)),
        totalShippingRevenue: parseFloat(totalShippingRevenue.toFixed(2)),
        totalExpenses: parseFloat(spendingStats.totalExpenses.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        totalOrders: totalOrdersAndSales,
        totalCustomers: usersSnapshot.size,
        averageOrderValue: parseFloat(averageOrderValue),
        conversionRate: parseFloat(conversionRate),
        productRevenueGrowth: parseFloat(productRevenueGrowth),
        totalRevenueGrowth: parseFloat(totalRevenueGrowth),
        customerGrowth: parseFloat(customerGrowth),
        expensesGrowth: parseFloat(expensesGrowth)
      },

      // Data freshness indicator
      lastUpdated: new Date().toISOString(),
      dataQuality: {
        ordersAvailable: ordersResult.status === 'fulfilled',
        productsAvailable: productsResult.status === 'fulfilled',
        usersAvailable: usersResult.status === 'fulfilled',
        subscribersAvailable: subscribersResult.status === 'fulfilled',
        offlineSalesAvailable: offlineSalesResult.status === 'fulfilled',
        spendingsAvailable: spendingsResult.status === 'fulfilled'
      }
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);

    const isDev = process.env.NODE_ENV === 'development';

    res.status(500).json({
      message: 'Internal server error',
      error: isDev ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}