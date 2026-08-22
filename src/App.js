import { runFullWorkflow } from './agents';

useEffect(() => {
  const start = '2023-04-01'; // or dynamically set
  const end = '2023-04-07';   // or dynamically set
  const emails = ['test@example.com']; // or get from user input
  const emailEndpoint = 'https://ai-newsletter-vobs.onrender.com/send-email';

  // Optionally, pass selected articles if you have any
  runFullWorkflow({ start, end, selectedArticles: [], allArticles: [], emails, emailEndpoint })
    .then(result => {
      console.log('Workflow completed:', result);
    })
    .catch(error => {
      console.error('Error in workflow:', error);
    });
}, []);
