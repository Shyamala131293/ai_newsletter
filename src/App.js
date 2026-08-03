import React, { useState, useEffect } from 'react';
import ArticlesList from './ArticlesList';
import { generatePdfBlob } from './generatePdf';
import { sendEmail } from './sendEmail';
import axios from 'axios';
import "./App.css";

const App = () => {
  const [articles, setArticles] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]); // array of article objects
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [dateOptions, setDateOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allSelected, setAllSelected] = useState(false); // for check/uncheck all

  // Generate date options for today and last 5 Fridays
  useEffect(() => {
    const options = [];
    const today = new Date();

    const getLastFriday = (date) => {
      const day = date.getDay();
      const diff = (day >= 5) ? day - 5 : 7 - (5 - day);
      const lastFriday = new Date(date);
      lastFriday.setDate(date.getDate() - diff);
      return lastFriday;
    };

    for (let i = 0; i < 5; i++) {
      const friday = new Date(getLastFriday(today));
      friday.setDate(friday.getDate() - i * 7);
      const startStr = friday.toISOString().split('T')[0];
      const label = `${friday.toLocaleString('default', { month: 'short' })} ${friday.getDate()}`;

      options.push({
        label,
        start: startStr,
        end: startStr,
      });
    }

    const todayStr = today.toISOString().split('T')[0];
    const todayLabel = `${today.toLocaleString('default', { month: 'short' })} ${today.getDate()}`;
    options.unshift({
      label: todayLabel,
      start: todayStr,
      end: todayStr,
    });

    setDateOptions(options);
  }, []);

  const fetchArticlesForRange = async (startDate, endDate) => {
    setLoading(true);
    setArticles([]);
    setSelectedArticles([]); // reset selection when new articles load
    setAllSelected(false);
    const apiKey = '2c487246-bfc3-4973-9803-ec814ce8a509';
    const url = `https://newsapi.ai/api/v1/article/getArticles?apiKey=${apiKey}&keyword=ai+technology&isDuplicate=false&lang=eng&dateEnd=${endDate}`;
    try {
      const response = await axios.get(url);
      const fetchedArticles = response.data.articles.results;

      const seenFirstFiveWords = new Set();
      const uniqueArticles = [];

      for (const article of fetchedArticles) {
        if (!/\bAI\b/i.test(article.title)) continue;

        const titleWords = article.title.split(/\s+/).slice(0, 5).join(' ').toLowerCase();
        if (!seenFirstFiveWords.has(titleWords)) {
          seenFirstFiveWords.add(titleWords);
          uniqueArticles.push(article);
        }
        if (uniqueArticles.length === 10) break;
      }
      setArticles(uniqueArticles);
    } catch (error) {
      console.error('Error fetching articles for range:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArticlesChange = (articlesSelected) => {
    setSelectedArticles(articlesSelected);
  };

  const handleArticleCheckboxChange = (article) => {
    setSelectedArticles((prev) => {
      if (prev.some((a) => a.url === article.url)) {
        return prev.filter((a) => a.url !== article.url);
      } else {
        return [...prev, article];
      }
    });
  };

  useEffect(() => {
    if (articles.length > 0) {
      setAllSelected(selectedArticles.length === articles.length);
    }
  }, [selectedArticles, articles]);

  const handleToggleCheckAll = () => {
    if (allSelected) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles([...articles]);
    }
  };

  const handleGenerateAndSend = async () => {
    const emailInput = window.prompt('Enter up to 5 email addresses separated by commas:');
    if (!emailInput) {
      alert('Email addresses are required to send the PDF.');
      return;
    }

    let emailList = emailInput
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email);

    if (emailList.length > 5) {
      alert(`You entered more than 5 emails. Only the first 5 will be used.`);
      emailList = emailList.slice(0, 5);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      alert(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    const articlesToSend = selectedArticles.length === 0 ? articles : selectedArticles;
    if (articlesToSend.length === 0) {
      alert('No articles available to send.');
      return;
    }

    try {
      // Generate PDF Blob
      const pdfBlob = await generatePdfBlob(articlesToSend);
      
      // Preview PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      // Convert Blob to Base64
      const pdfBase64 = await pdfBlobToBase64(pdfBlob);

      // Send email
      await sendEmail('https://ai-newsletter-vobs.onrender.com/send-email', {
        recipientEmails: emailList,
        pdfBase64: pdfBase64,
      });
    } catch (error) {
      console.error('Error generating or sending PDF:', error);
    }
  };

  const pdfBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ backgroundColor: '#008080', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>Top 10 AI Articles</h2>
      </div>

      {/* Date Range Selector */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <select
          onChange={(e) => {
            const selectedLabel = e.target.value;
            const option = dateOptions.find((opt) => opt.label === selectedLabel);
            if (option) {
              setDateRange({ start: option.start, end: option.end });
              fetchArticlesForRange(option.start, option.end);
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>Select Date Range</option>
          {dateOptions.map((opt) => (
            <option key={opt.start} value={opt.label}>{opt.label}</option>
          ))}
        </select>
        {loading && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div className="spinner" />
            <p>Loading articles...</p>
          </div>
        )}
      </div>

      {/* Articles List */}
      {articles.length > 0 && (
        <>
          <ArticlesList
            articles={articles}
            selectedArticles={selectedArticles}
            onCheckboxChange={handleArticleCheckboxChange}
          />

          {/* Check/Uncheck All Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              onClick={handleToggleCheckAll}
              style={{ color: 'white', backgroundColor: '#008080', borderRadius: 8, padding: '10px 20px' }}
            >
              {allSelected ? 'Uncheck All' : 'Check All'}
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <button
              onClick={handleGenerateAndSend}
              style={{ color: 'white', backgroundColor: '#008080', borderRadius: 8, padding: '10px 20px' }}
            >
              Generate PDF & Send Email
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
