// agents.js
import { generatePdfBlob } from './generatePdf';
import { sendEmail } from './sendEmail';
import axios from 'axios';

const API_KEY = '2c487246-bfc3-4973-9803-ec814ce8a509';

export async function fetchArticles(start, end) {
  const url = `https://newsapi.ai/api/v1/article/getArticles?apiKey=${API_KEY}&keyword=ai+technology&isDuplicate=false&lang=eng&dateEnd=${end}`;
  const response = await axios.get(url);
  const fetchedArticles = response.data.articles.results;

  const seenWords = new Set();
  const uniqueArticles = [];

  for (const article of fetchedArticles) {
    if (!/\bAI\b/i.test(article.title)) continue;

    const titleWords = article.title.split(/\s+/).slice(0, 5).join(' ').toLowerCase();
    if (!seenWords.has(titleWords)) {
      seenWords.add(titleWords);
      uniqueArticles.push(article);
    }
    if (uniqueArticles.length === 10) break;
  }
  return uniqueArticles;
}

export async function generatePdfAndSend({ articles, recipientEmails, emailEndpoint }) {
  const pdfBlob = await generatePdfBlob(articles);
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank'); // Preview

  const base64 = await blobToBase64(pdfBlob);
  await sendEmail(emailEndpoint, { recipientEmails, pdfBase64: base64 });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Full workflow
export async function runFullWorkflow({ start, end, selectedArticles, allArticles, emails, emailEndpoint }) {
  const articles = await fetchArticles(start, end);
  const articlesToSend = (selectedArticles && selectedArticles.length > 0) ? selectedArticles : articles;

  if (!articlesToSend || articlesToSend.length === 0) {
    throw new Error('No articles to send.');
  }

  await generatePdfAndSend({ articles: articlesToSend, recipientEmails: emails, emailEndpoint });
  return { fetchedArticles: articles, sentArticles: articlesToSend };
}
