const Book = require('../models/Book');
const Order = require('../models/Order');

async function updateBestsellers(topN = 8) {
  const sales = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    { $group: { _id: '$items.book', totalSold: { $sum: '$items.quantity' } } },
    { $sort: { totalSold: -1 } },
    { $limit: topN }
  ]);
  const topBookIds = sales.map(s => s._id);
  await Book.updateMany({}, { $set: { isBestseller: false } });
  if (topBookIds.length > 0) {
    await Book.updateMany({ _id: { $in: topBookIds } }, { $set: { isBestseller: true } });
  }
}

module.exports = { updateBestsellers }; 