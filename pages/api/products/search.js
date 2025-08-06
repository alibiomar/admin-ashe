import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { q } = req.query; // search query
    
    let query = adminDb.collection('products');
    
    if (q) {
      // Simple search by name (you might want to implement full-text search)
      query = query.where('name', '>=', q).where('name', '<=', q + '\uf8ff');
    }
    
    const snapshot = await query.limit(20).get();
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        price: data.price,
        colors: data.colors?.map(color => ({
          name: color.name,
          stock: color.stock
        })) || []
      };
    });
    
    res.status(200).json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}