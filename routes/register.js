const express = require('express');
const router = express.Router();
const Registrant = require('../models/Registrant');

const TOTAL_SLOTS = parseInt(process.env.TOTAL_SLOTS || '200', 10);

// Public config the frontend needs (slot total + whatsapp link + contact number)
router.get('/config', (req, res) => {
  res.json({
    totalSlots: TOTAL_SLOTS,
    whatsappLink: process.env.WHATSAPP_LINK || '',
    contactNumber: process.env.CONTACT_NUMBER || '0743 756698'
  });
});

// Current slot count
router.get('/slots', async (req, res) => {
  try {
    const filled = await Registrant.countDocuments();
    res.json({
      total: TOTAL_SLOTS,
      filled,
      remaining: Math.max(TOTAL_SLOTS - filled, 0)
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch slot count' });
  }
});

// Register a new person
router.post('/register', async (req, res) => {
  try {
    const {
      email, fullName, phone,
      whatsappSameNumber, whatsappNumber,
      university, course, otherCourse,
      countyOfOrigin, yearOfStudy, highschool,
      anxiety, mentorTraits, mentorGender
    } = req.body;

    const required = { email, fullName, phone, university, course, countyOfOrigin, yearOfStudy, highschool, anxiety };
    const missing = Object.entries(required).filter(([, v]) => !v || !String(v).trim());
    if (missing.length) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    if (!Array.isArray(mentorTraits) || mentorTraits.length === 0) {
      return res.status(400).json({ error: 'Please pick at least one preferred mentor trait.' });
    }
    if (mentorTraits.length > 3) {
      return res.status(400).json({ error: 'Please pick up to 3 mentor traits only.' });
    }

    const filled = await Registrant.countDocuments();
    if (filled >= TOTAL_SLOTS) {
      return res.status(410).json({ error: 'All slots have been filled' });
    }

    // Prevent obvious duplicate sign-ups from the same phone number
    const existing = await Registrant.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyRegistered: true,
        whatsappLink: process.env.WHATSAPP_LINK || ''
      });
    }

    await Registrant.create({
      email: email.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsappSameNumber: whatsappSameNumber !== false,
      whatsappNumber: (whatsappNumber || '').trim(),
      university: university.trim(),
      course: course.trim(),
      otherCourse: (otherCourse || '').trim(),
      countyOfOrigin: countyOfOrigin.trim(),
      yearOfStudy: yearOfStudy.trim(),
      highschool: highschool.trim(),
      anxiety: anxiety.trim(),
      mentorTraits,
      mentorGender: (mentorGender || 'No preference').trim()
    });

    const newFilled = filled + 1;
    res.status(201).json({
      success: true,
      remaining: Math.max(TOTAL_SLOTS - newFilled, 0),
      whatsappLink: process.env.WHATSAPP_LINK || ''
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
