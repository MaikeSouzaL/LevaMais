const mongoose = require('mongoose');

const purposeSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
    enum: ['motorcycle', 'car', 'van', 'truck'],
    index: true
  },
  id: {
    type: String,
    required: true,
    trim: true,
    // Note: We'll enforce uniqueness per vehicleType in the controller or via compound index
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    default: 'Package'
  },
  badges: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure ID is unique per vehicle type
purposeSchema.index({ vehicleType: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Purpose', purposeSchema);
