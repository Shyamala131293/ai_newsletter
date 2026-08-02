import axios from 'axios';

const apiUrl = "https://ai-newsletter-1-cwxb.onrender.com";

export const sendEmail = async (apiUrl, { recipientEmails, pdfBase64 }) => {
  try {
    await axios.post(apiUrl, {
      recipientEmails,
      pdfBase64,
    });
    alert('Emails sent successfully!');
  } catch (error) {
    console.error('Error sending emails:', error);
    alert('Failed to send emails.');
  }
};
