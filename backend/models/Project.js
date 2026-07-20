const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    tech: { type: [String], default: [] },
    link: { type: String, required: true },
    image_path: { type: String, default: '' },
    order: { type: Number, default: 0 } // controls display order on the site
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
