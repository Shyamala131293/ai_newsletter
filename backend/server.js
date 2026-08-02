const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/send-email', async (req, res) => {
  const { recipientEmails, pdfBase64 } = req.body;

  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ error: 'recipientEmails array is required' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'ainewsletter6@gmail.com',
      pass: 'hfaxncpwsiwzscko'
    }
  });

  try {
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'ainewsletter6@gmail.com',
    pass: 'hfaxncpwsiwzscko'
  },
  tls: {
    rejectUnauthorized: false // for testing, but not recommended for production
  },
  debug: true // enable debug output
});
    res.json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});
app.use(cors({
  origin: ['http://localhost.com', ]
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
