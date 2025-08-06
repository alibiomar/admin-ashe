import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { description, amount, category, date, notes } = req.body;
      
      // Validation
      if (!description || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Description and valid amount are required' });
      }

      const spending = {
        description,
        amount: parseFloat(amount),
        category: category || 'general',
        date: date ? new Date(date) : new Date(),
        notes: notes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await adminDb.collection('spendings').add(spending);
      
      res.status(201).json({ 
        message: 'Spending added successfully', 
        id: docRef.id,
        spending: { id: docRef.id, ...spending }
      });
    } catch (error) {
      console.error('Error adding spending:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  else if (req.method === 'GET') {
    try {
      const { startDate, endDate, category } = req.query;
      
      let query = adminDb.collection('spendings').orderBy('date', 'desc');
      
      // Apply filters
      if (startDate) {
        query = query.where('date', '>=', new Date(startDate));
      }
      if (endDate) {
        query = query.where('date', '<=', new Date(endDate));
      }
      if (category && category !== 'all') {
        query = query.where('category', '==', category);
      }
      
      const snapshot = await query.get();
      const spendings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || doc.data().date,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));
      
      res.status(200).json(spendings);
    } catch (error) {
      console.error('Error fetching spendings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: 'Spending ID is required' });
      }

      await adminDb.collection('spendings').doc(id).delete();
      
      res.status(200).json({ message: 'Spending deleted successfully' });
    } catch (error) {
      console.error('Error deleting spending:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}