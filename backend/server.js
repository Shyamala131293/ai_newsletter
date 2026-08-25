const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');
const sgMail = require('@sendgrid/mail');
const { HfInference } = require('@huggingface/inference');
const { pipeline } = require('@xenova/transformers');

const app = express();
app.use(express.json());

const allowedOrigins = ['https://ai-newsletter-1-cwxb.onrender.com'];

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    console.log('Origin:', origin);
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
}));

// Handle all OPTIONS requests
app.options('*', cors({ origin: allowedOrigins }));

// OpenAI setup
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// SendGrid setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// NewsAPI key
const API_KEY = '2c487246-bfc3-4973-9803-ec814ce8a509';

// Hugging Face token
const hfToken = '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';
const inference = new HfInference('hfToken');

// Initialize summarization pipeline once at startup
let summarizationPipeline;

(async () => {
  try {
    summarizationPipeline = await pipeline('text-generation', { model: 'facebook/bart-large-cnn' });
    console.log('Summarization model loaded.');
  } catch (err) {
    console.error('Error loading summarization model:', err);
  }
})();

// Add health check endpoint
app.get('/api/health', (req, res) => {
  if (summarizationPipeline) {
    res.json({ status: 'ready' });
  } else {
    res.json({ status: 'loading' });
  }
});

// Fetch articles from NewsAPI
async function fetchArticles(start, end) {
  const url = `https://newsapi.ai/api/v1/article/getArticles?apiKey=${API_KEY}&keyword=ai+technology&isDuplicate=false&lang=eng&date=${start}`;
  const response = await axios.get(url);
  const fetchedArticles = response.data.articles.results;
  console.log(`Fetched ${fetchedArticles.length} articles`);
  return fetchedArticles;
}

// Summarize text using the loaded model
async function summarizeText(text) {
  if (!summarizationPipeline) {
    throw new Error('Summarization model not loaded yet.');
  }
  const response = await summarizationPipeline(text);
  return response[0].summary;
}

// Route: fetch and process articles
app.post('/api/fetch-and-process', async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  if (!summarizationPipeline) {
    return res.status(503).json({ error: 'Summarization model is not loaded yet. Please try again later.' });
  }

  try {
    const articles = await fetchArticles(startDate, endDate);
    const processedArticles = [];

    for (const article of articles) {
      try {
        const textToSummarize = article.body || article.content || '';
        if (!textToSummarize) {
          console.warn(`No content to summarize for article: ${article.title}`);
          continue;
        }
        const summary = await summarizeText(textToSummarize);
        processedArticles.push({
          title: article.title,
          url: article.url,
          summary: summary,
        });
      } catch (err) {
        console.error(`Error processing article "${article.title}":`, err.message);
      }
    }

    res.json({ articles: processedArticles });
  } catch (err) {
    console.error('Error fetching or processing articles:', err.message);
    res.status(500).json({ error: 'Failed to fetch or process articles' });
  }
});

// Route: send email with PDF attachment
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

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
