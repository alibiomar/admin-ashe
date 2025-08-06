import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { productId, colorName, sizes, customerInfo, totalAmount, notes } = req.body;
      
      // Validation
      if (!productId || !colorName || !sizes || Object.keys(sizes).length === 0) {
        return res.status(400).json({ message: 'Product ID, color, and sizes are required' });
      }

      // Start a transaction to update inventory and record the sale
      const batch = adminDb.batch();
      
      // Get the product to update inventory
      const productRef = adminDb.collection('products').doc(productId);
      const productDoc = await productRef.get();
      
      if (!productDoc.exists) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const productData = productDoc.data();
      const colors = [...productData.colors];
      
      // Find the color and update sizes
      const colorIndex = colors.findIndex(c => c.name === colorName);
      if (colorIndex === -1) {
        return res.status(404).json({ message: 'Color not found' });
      }
      
      const updatedStock = { ...colors[colorIndex].stock };
      let totalQuantitySold = 0;
      
      // Check if we have enough stock and calculate totals
      for (const [size, quantity] of Object.entries(sizes)) {
        const currentStock = parseInt(updatedStock[size]) || 0;
        const quantityToSell = parseInt(quantity);
        
        if (currentStock < quantityToSell) {
          return res.status(400).json({ 
            message: `Insufficient stock for size ${size}. Available: ${currentStock}, Requested: ${quantityToSell}` 
          });
        }
        
        updatedStock[size] = currentStock - quantityToSell;
        totalQuantitySold += quantityToSell;
      }
      
      // Update the product inventory
      colors[colorIndex].stock = updatedStock;
      batch.update(productRef, { colors });
      
      // Record the offline sale
      const offlineSale = {
        productId,
        productName: productData.name,
        colorName,
        sizes,
        totalQuantity: totalQuantitySold,
        unitPrice: productData.price,
        totalAmount: totalAmount || (totalQuantitySold * productData.price),
        customerInfo: customerInfo || {},
        notes: notes || '',
        saleDate: new Date(),
        createdAt: new Date()
      };
      
      const offlineSaleRef = adminDb.collection('offline_sales').doc();
      batch.set(offlineSaleRef, offlineSale);
      
      // Commit the transaction
      await batch.commit();
      
      res.status(201).json({ 
        message: 'Offline sale recorded successfully',
        saleId: offlineSaleRef.id,
        sale: { id: offlineSaleRef.id, ...offlineSale }
      });
      
    } catch (error) {
      console.error('Error recording offline sale:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  else if (req.method === 'GET') {
    try {
      const { startDate, endDate, productId } = req.query;
      
      let query = adminDb.collection('offline_sales').orderBy('saleDate', 'desc');
      
      // Apply filters
      if (startDate) {
        query = query.where('saleDate', '>=', new Date(startDate));
      }
      if (endDate) {
        query = query.where('saleDate', '<=', new Date(endDate));
      }
      if (productId) {
        query = query.where('productId', '==', productId);
      }
      
      const snapshot = await query.get();
      const offlineSales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        saleDate: doc.data().saleDate?.toDate?.() || doc.data().saleDate,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }));
      
      res.status(200).json(offlineSales);
    } catch (error) {
      console.error('Error fetching offline sales:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}