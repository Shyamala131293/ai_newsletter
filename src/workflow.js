// workflow.js
import { fetchArticles } from './agents';
import { generatePdfAndSend } from './agents';

export async function fetchArticlesAgent(start, end) {
  return await fetchArticles(start, end);
}

export async function generateAndSendWorkflow({ articles, emails, emailEndpoint }) {
  await generatePdfAndSend({ articles, recipientEmails: emails, emailEndpoint });
  return { message: 'Email sent with PDF attachment' };
}

// Main orchestrator
export async function runWorkflow({ start, end, selectedArticles, allArticles, emails, emailEndpoint }) {
  // Step 1: Fetch Articles
  const fetchedArticles = await fetchArticlesAgent(start, end);

  // Step 2: Determine which articles to send
  const articlesToSend = selectedArticles.length > 0 ? selectedArticles : fetchedArticles;

  // Step 3: Generate PDF & send email
  await generateAndSendWorkflow({ articles: articlesToSend, emails, emailEndpoint });

  return {
    fetchedArticles,
    sentArticles: articlesToSend,
  };
}
