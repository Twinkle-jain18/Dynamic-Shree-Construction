const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ServiceContent = require('../models/ServiceContent');
const Inquiry = require('../models/Inquiry');
const Category = require('../models/Category');

// @route   GET api/admin/stats
// @desc    Get dashboard analytics
// @access  Private (Admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const totalUploads = await ServiceContent.countDocuments();
    const totalInquiries = await Inquiry.countDocuments();
    const acceptedCount = await Inquiry.countDocuments({ status: 'accepted' });
    const rejectedCount = await Inquiry.countDocuments({ status: 'rejected' });
    
    // Conversion Rate: (Accepted / Total) * 100
    const conversionRate = totalInquiries > 0 
      ? Math.round((acceptedCount / totalInquiries) * 100) 
      : 0;

    // Most popular service by inquiries (fallback to content if no inquiries)
    const inquiriesByService = await Inquiry.aggregate([
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const contentByService = await ServiceContent.aggregate([
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Group all category counts to present an array to the frontend
    const categories = await Category.find();
    let serviceStats = [];
    
    if (categories.length > 0) {
      serviceStats = categories.map(cat => {
        const iCount = inquiriesByService.find(x => x._id === cat.name)?.count || 0;
        const cCount = contentByService.find(x => x._id === cat.name)?.count || 0;
        return { name: cat.name, inquiryCount: iCount, contentCount: cCount };
      });
    } else {
      // Fallback for default categories if DB map is empty (old implementation style)
      // Group unique service names from content By Service
      const uniqueNames = new Set([...contentByService.map(c => c._id), ...inquiriesByService.map(i => i._id)]);
      serviceStats = Array.from(uniqueNames).map(name => {
        const iCount = inquiriesByService.find(x => x._id === name)?.count || 0;
        const cCount = contentByService.find(x => x._id === name)?.count || 0;
        return { name, inquiryCount: iCount, contentCount: cCount };
      });
    }

    let popularService = 'N/A';
    if (contentByService.length > 0) {
      popularService = contentByService[0]._id;
    } else if (inquiriesByService.length > 0) {
      popularService = inquiriesByService[0]._id; 
    }

    res.json({
      totalUploads,
      totalInquiries,
      acceptedCount,
      rejectedCount,
      conversionRate,
      popularService,
      serviceStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
