const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');
const sgMail = require('@sendgrid/mail');
const { HfInference } = require('@huggingface/inference');
const { pipeline } = require('transformers');


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// OpenAI setup
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// SendGrid setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Your API key for newsapi
const API_KEY = '2c487246-bfc3-4973-9803-ec814ce8a509';
const hfToken = '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';
const inference = new HfInference('hfToken');

// Fetch articles from your newsapi
async function fetchArticles(start, end) {
  const url = `https://newsapi.ai/api/v1/article/getArticles?apiKey=${API_KEY}&keyword=ai+technology&isDuplicate=false&lang=eng&date=${start}`;
  const response = await axios.get(url);
  const fetchedArticles = response.data.articles.results;
  console.log(`Fetched ${fetchedArticles.length} articles`);
  return fetchedArticles;
}

// Function to summarize text using OpenAI
async function summarizeText(text) {
  try {
 const textGenerationPipeline = pipeline('text-generation', { model: 'openai/gpt-oss-120b' });

// Then, inside your function, use:
const response = await textGenerationPipeline(`Summarize the following: ${text}`, { max_length: 50 });

// The response will be an array of generated texts
const generatedText = response[0].generated_text;
  return response.generated_text;
} catch (error) {
  console.error('OpenAI API error:', error.response ? error.response.data : error.message);
  throw error; // or handle accordingly
}
  
}

// API route: fetch and process articles
app.post('/api/fetch-and-process', async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const articles = await fetchArticles(startDate, endDate);
    const processedArticles = [];

    for (const article of articles) {
      try {
        // If your article object contains a 'body' or 'content' field, use it
        // Otherwise, you might need to scrape the article URL or skip
        const textToSummarize = article.body || article.content || '';

        if (!textToSummarize) {
          console.warn(`No content to summarize for article: ${article.title}`);
          continue;
        }

        const summary = await summarizeText(textToSummarize);
        processedArticles.push({
          title: article.title,
          url: article.url,
          body: article.body,
        });
      } catch (err) {
       // console.error(`Error processing article "${article.title}":`, err.message);
      }
    }

    res.json({ articles: processedArticles });
  } catch (err) {
    console.error('Error fetching or processing articles:', err.message);
    res.status(500).json({ error: 'Failed to fetch or process articles' });
  }
});

// API route: send email with PDF attachment
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

// Server setup
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
