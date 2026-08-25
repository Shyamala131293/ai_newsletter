const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const { HfInference } = require('@huggingface/inference');

const app = express();

app.use(express.json({ limit: '20mb' }));

const allowedOrigins = [
  'https://ai-newsletter-1-cwxb.onrender.com'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  })
);

// SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Hugging Face
const hf = new HfInference(process.env.hf_key);

// NewsAPI.ai
const NEWS_API_KEY =
  '2c487246-bfc3-4973-9803-ec814ce8a509';

// Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ready'
  });
});

// Fetch articles
async function fetchArticles(startDate) {
  const url =
    `https://newsapi.ai/api/v1/article/getArticles` +
    `?apiKey=${NEWS_API_KEY}` +
    `&keyword=ai+technology` +
    `&lang=eng` +
    `&isDuplicate=false` +
    `&date=${startDate}`;

  const response = await axios.get(url);

  const articles =
    response?.data?.articles?.results || [];

  console.log(
    `Fetched ${articles.length} articles`
  );

  // LIMIT TO 10
  return articles.slice(0, 10);
}

// Summarize text
async function summarizeText(text) {
  try {
    const truncated =
      text.length > 1000
        ? text.substring(0, 1000)
        : text;
  console.log(truncated)
    const result = await hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: truncated
    });
    
    return result.summary_text || '';
  } catch (err) {
    console.error('Summary Error:', err.message);
    return '';
  }
}

// Fetch + Process
app.post('/api/fetch-and-process', async (req, res) => {
  try {
    const { startDate } = req.body;

    if (!startDate) {
      return res.status(400).json({
        error: 'startDate is required'
      });
    }

    const articles =
      await fetchArticles(startDate);

    const processedArticles = [];

    for (const article of articles) {
      try {
        const text =
          article.body ||
          article.content ||
          article.title ||
          '';

        if (!text) {
          continue;
        }

        const summary =
          await summarizeText(text);

        processedArticles.push({
          title: article.title,
          url: article.url,
          summary
        });
      } catch (err) {
        console.error(
          `Failed article: ${article.title}`,
          err.message
        );
      }
    }

    res.json({
      count: processedArticles.length,
      articles: processedArticles
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error:
        'Failed to fetch/process articles'
    });
  }
});

// Send Email
app.post('/send-email', async (req, res) => {
  try {
    const {
      recipientEmails,
      pdfBase64
    } = req.body;

    if (
      !recipientEmails ||
      !Array.isArray(recipientEmails) ||
      recipientEmails.length === 0
    ) {
      return res.status(400).json({
        error:
          'recipientEmails array required'
      });
    }

    if (!pdfBase64) {
      return res.status(400).json({
        error: 'pdfBase64 required'
      });
    }

    const msg = {
      from:
        process.env.SENDGRID_FROM_EMAIL,
      to: recipientEmails,
      subject: 'AI Newsletter',
      html:
        '<p>Please find the attached newsletter.</p>',
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
      success: true,
      message: 'Email sent'
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Send email failed'
    });
  }
});

const PORT =
  4000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
``
