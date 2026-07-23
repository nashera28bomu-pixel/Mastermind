const mongoose = require('mongoose');

const registrantSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },

  whatsappSameNumber: { type: Boolean, required: true, default: true },
  whatsappNumber: { type: String, trim: true, default: '' },

  university: { type: String, required: true, trim: true },
  course: { type: String, required: true, trim: true },
  otherCourse: { type: String, trim: true, default: '' },
  countyOfOrigin: { type: String, required: true, trim: true },
  yearOfStudy: { type: String, required: true, trim: true },
  highschool: { type: String, required: true, trim: true },

  anxiety: { type: String, required: true, trim: true },
  mentorTraits: { type: [String], default: [] },
  mentorGender: { type: String, trim: true, default: 'No preference' },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Registrant', registrantSchema);
