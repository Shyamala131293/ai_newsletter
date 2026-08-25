const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const { pipeline } = require('@xenova/transformers');

const app = express();
app.use(express.json());

const allowedOrigins = [
  'https://ai-newsletter-1-cwxb.onrender.com'
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log('Origin:', origin);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS']
  })
);

app.options('*', cors());

// SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// NewsAPI.ai
const API_KEY = "2c487246-bfc3-4973-9803-ec814ce8a509";

// Global model
let summarizer = null;

// Load model once
(async () => {
  try {
    console.log('Loading summarization model...');

    summarizer = await pipeline(
      'summarization',
      'Xenova/distilbart-cnn-6-6'
    );

    console.log('✅ Summarization model loaded.');
  } catch (err) {
    console.error('❌ Error loading model:', err);
  }
})();

app.get('/api/health', (req, res) => {
  res.json({
    status: summarizer ? 'ready' : 'loading'
  });
});

// Fetch articles
async function fetchArticles(startDate) {
  const url =
    `https://newsapi.ai/api/v1/article/getArticles` +
    `?apiKey=${API_KEY}` +
    `&keyword=ai+technology` +
    `&lang=eng` +
    `&isDuplicate=false` +
    `&date=${startDate}`;

  const response = await axios.get(url);

  const articles =
    response?.data?.articles?.results || [];

  console.log(`Fetched ${articles.length} articles`);

  return articles;
}

// Summarize text
async function summarizeText(text) {
  if (!summarizer) {
    throw new Error('Model not loaded');
  }

  const result = await summarizer(text, {
    max_new_tokens: 120,
    min_length: 30
  });

  return result[0]?.summary_text || '';
}

// Process articles
app.post('/api/fetch-and-process', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required'
      });
    }

    if (!summarizer) {
      return res.status(503).json({
        error: 'Model still loading'
      });
    }

    const articles = await fetchArticles(startDate);

    const processedArticles = [];

    for (const article of articles) {
      try {
        const text =
          article.body ||
          article.content ||
          article.title;

        if (!text) {
          continue;
        }

        const summary = await summarizeText(
          text.length > 4000
            ? text.substring(0, 4000)
            : text
        );

        processedArticles.push({
          title: article.title,
          url: article.url,
          summary
        });
      } catch (err) {
        console.error(
          `Error processing "${article.title}"`,
          err.message
        );
      }
    }

    res.json({
      articles: processedArticles
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to process articles'
    });
  }
});

// Email
app.post('/send-email', async (req, res) => {
  try {
    const { recipientEmails, pdfBase64 } = req.body;

    if (
      !recipientEmails ||
      !Array.isArray(recipientEmails) ||
      recipientEmails.length === 0
    ) {
      return res.status(400).json({
        error: 'recipientEmails required'
      });
    }

    if (!pdfBase64) {
      return res.status(400).json({
        error: 'pdfBase64 required'
      });
    }

    const msg = {
      from: process.env.SENDGRID_FROM_EMAIL,
      to: recipientEmails,
      subject: 'AI Newsletter',
      html: '<p>Please find the attached newsletter.</p>',
      attachments: [
        {
          content: pdfBase64,
          filename: 'newsletter.pdf',
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ]
    };

    await sgMail.send(msg);

    res.json({
      message: 'Emails sent successfully'
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to send email'
    });
  }
});

const PORT = || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
