import axios from 'axios';

export const sendEmail = async (url, { recipientEmails, pdfBase64 }) => {
  try {
    await axios.post(url, {
      recipientEmails,
      pdfBase64,
    });
    alert('Emails sent successfully!');
  } catch (error) {
    console.error('Error sending emails:', error);
    alert('Failed to send emails.');
  }
};