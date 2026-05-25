const mongoose = require('mongoose');

const serviceContentSchema = new mongoose.Schema({
  service: { type: String, required: true }, // e.g., 'building-construction', 'interior', 'exterior'
  type: { type: String, enum: ['image', 'video'], required: true },
  fileUrl: { type: String, required: true },
  cloudinaryId: { type: String, required: true },
  description: { type: String, default: '' },
  title: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceContent', serviceContentSchema);
