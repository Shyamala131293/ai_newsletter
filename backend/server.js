const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Set your SendGrid API Key
sgMail.setApiKey('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');

app.post('/send-email', async (req, res) => {
  const { recipientEmails, pdfBase64 } = req.body;

  if (
    !recipientEmails ||
    !Array.isArray(recipientEmails) ||
    recipientEmails.length === 0
  ) {
    return res.status(400).json({ error: 'recipientEmails array is required' });
  }

  // Prepare the email message
  const msg = {
    from: '"AI newsletter" <ainewsletter6@gmail.com>', // Your verified sender
    to: recipientEmails, // Array of recipients
    subject: 'AI newsletter',
    html: '<p>Please find the attached newsletter.</p>', // You can customize the email content here
    attachments: [
      {
        content: pdfBase64,
        filename: 'newsletter.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  };

  try {
    await sgMail.send(msg);
    res.json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
