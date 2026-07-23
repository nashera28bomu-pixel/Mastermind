const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Registrant = require('../models/Registrant');
const requireAdmin = require('../middleware/auth');

// Admin login - checks against env credentials, issues a 24h token
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ success: true, token });
  }

  return res.status(401).json({ error: 'Invalid username or password' });
});

// All registrants, most recent first
router.get('/entries', requireAdmin, async (req, res) => {
  try {
    const entries = await Registrant.find().sort({ createdAt: -1 });
    res.json({ entries, count: entries.length });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch entries' });
  }
});

// CSV export of all registrants
router.get('/entries/csv', requireAdmin, async (req, res) => {
  try {
    const entries = await Registrant.find().sort({ createdAt: -1 });
    const header = 'Full Name,Email,Phone,WhatsApp Same Number,WhatsApp Number,University,Course,Other Course,County of Origin,Year of Study,Highschool,Anxiety,Mentor Traits,Mentor Gender,Registered At\n';
    const rows = entries.map(e => {
      const cell = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
      return [
        cell(e.fullName),
        cell(e.email),
        cell(e.phone),
        cell(e.whatsappSameNumber ? 'Yes' : 'No'),
        cell(e.whatsappNumber),
        cell(e.university),
        cell(e.course),
        cell(e.otherCourse),
        cell(e.countyOfOrigin),
        cell(e.yearOfStudy),
        cell(e.highschool),
        cell(e.anxiety),
        cell((e.mentorTraits || []).join('; ')),
        cell(e.mentorGender),
        cell(e.createdAt.toISOString())
      ].join(',');
    });
    const csv = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="registrants.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Could not export CSV' });
  }
});

// Delete a single entry (in case of test/duplicate submissions)
router.delete('/entries/:id', requireAdmin, async (req, res) => {
  try {
    await Registrant.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete entry' });
  }
});

module.exports = router;
