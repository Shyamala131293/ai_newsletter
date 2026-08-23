// agents.js
import { generatePdfBlob } from './generatePdf';
import { sendEmail } from './sendEmail';
import axios from 'axios';

const API_KEY = '2c487246-bfc3-4973-9803-ec814ce8a509';

const BACKEND_API_URL = 'https://ai-newsletter-2.onrender.com/api/fetch-and-process';

export async function agentFetchArticles(domains) {
  const response = await axios.post(BACKEND_API_URL, {
    domains, // array of domains you want to fetch articles from
  });
  console.log(response.data)
  return response.data.articles; // assuming your backend responds with { articles: [...] }
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
