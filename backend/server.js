const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { Configuration, OpenAIApi } = require('openai');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// OpenAI setup
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// SendGrid setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* =======================
   AI Fetch and Process API
======================= */

async function fetchArticles(domain) {
  const url = ${domain};
   console.log(url)
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const articles = [];

  $('h2, a').each((i, elem) => {
    const text = $(elem).text();
    const link = $(elem).attr('href');
    if (text && link && link.startsWith('http')) {
      if (text.toLowerCase().includes('ai')) {
        articles.push({ title: text, url: link });
      }
    }
  });
  return articles.slice(0, 5);
}

async function summarizeText(text) {
  const prompt = `Summarize this article:\n\n${text}`;
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 150,
  });
  return response.data.choices[0].text.trim();
}

// Route for AI fetch and process
app.post('/api/fetch-and-process', async (req, res) => {
  const { domains } = req.body; // Get domains from request body
   console.log(domains)
  if (!Array.isArray(domains)) {
    return res.status(400).json({ error: 'domains should be an array' });
  }

  const allArticles = [];

  for (const domain of domains) {
    try {
      const articles = await fetchArticles(domain);
      for (const article of articles) {
        try {
          const { data } = await axios.get(article.url);
          const $ = cheerio.load(data);
          const paragraphs = $('p').map((i, el) => $(el).text()).get().join(' ');
          const summary = await summarizeText(paragraphs);
          allArticles.push({
            domain,
            title: article.title,
            url: article.url,
            summary,
          });
        } catch (err) {
          console.error(`Error processing article at ${article.url}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`Error processing domain ${domain}:`, err.message);
    }
  }

  res.json({ articles: allArticles });
});

/* =======================
   Email Sending API
======================= */

app.post('/send-email', async (req, res) => {
  const { recipientEmails, pdfBase64 } = req.body;

  if (
    !recipientEmails ||
    !Array.isArray(recipientEmails) ||
    recipientEmails.length === 0
  ) {
    return res.status(400).json({ error: 'recipientEmails array is required' });
  }

  if (!pdfBase64 || typeof pdfBase64 !== 'string') {
    return res.status(400).json({ error: 'pdfBase64 string is required' });
  }

  const msg = {
    from: 'AI newsletter <ainewsletter6@gmail.com>',
    to: recipientEmails,
    subject: 'AI newsletter',
    html: '<p>Please find the attached newsletter.</p>',
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
    console.error('Error sending email:', error.response ? error.response.body : error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/* =======================
   Server setup
======================= */

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
