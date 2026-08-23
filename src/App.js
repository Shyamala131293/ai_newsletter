import React, { useState, useEffect } from 'react';
import { fetchArticles } from './agents'; // Make sure you have this function imported
import { runWorkflow } from './workflow'; // Make sure you have this function imported

// Utility to get last 4 Fridays and today's date
const getLastFourFridays = () => {
  const fridays = [];
  const today = new Date();
  for (let i = 0; i < 4; i++) {
    const date = new Date();
    date.setDate(today.getDate() - ((today.getDay() + 2) % 7) - i * 7);
    fridays.push({
      label: `Friday ${i + 1}`,
      start: date.toISOString().slice(0, 10),
      end: date.toISOString().slice(0, 10),
    });
  }
  return fridays;
};

const dateOptions = getLastFourFridays();

const App = () => {
  const [articles, setArticles] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [currentOption, setCurrentOption] = useState(null);
  
  const emails = ['test@example.com'];
  const emailEndpoint = 'https://ai-newsletter-vobs.onrender.com/send-email';

  // Fetch articles when dateRange changes
  useEffect(() => {
    if (dateRange) {
      handleFetchArticles(dateRange.start, dateRange.end);
    }
  }, [dateRange]);

  const handleFetchArticles = async (start, end) => {
    setLoading(true);
    try {
      const fetchedArticles = await fetchArticles(start, end);
      setArticles(fetchedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (option) => {
    setCurrentOption(option);
    setDateRange({ start: option.start, end: option.end });
  };

  const handleArticleCheckboxChange = (article, isChecked) => {
    setSelectedArticles(prev => {
      if (isChecked) {
        return [...prev, article];
      } else {
        return prev.filter(a => a.title !== article.title);
      }
    });
  };

  const handleToggleCheckAll = () => {
    const allSelected = articles.length > 0 && selectedArticles.length === articles.length;
    if (allSelected) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles);
    }
  };

  const handleGenerateAndSend = async () => {
    if (!dateRange) return;
    setLoading(true);
    try {
      await runWorkflow({
        start: dateRange.start,
        end: dateRange.end,
        selectedArticles,
        allArticles: articles,
        emails,
        emailEndpoint,
      });
      alert('PDF generated and email sent!');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const allSelected = articles.length > 0 && selectedArticles.length === articles.length;

  return (
    <div style={{ padding: '20px' }}>
      <h1>AI Newsletters</h1>
      
      <div>
        <h2>Select Date Range</h2>
        {dateOptions.map((option) => (
          <button
            key={option.label}
            onClick={() => handleDateChange(option)}
            style={{
              margin: '5px',
              backgroundColor: currentOption === option ? '#4CAF50' : '#e7e7e7',
              color: currentOption === option ? 'white' : 'black',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Articles from {dateRange?.start} to {dateRange?.end}</h2>
        {loading ? (
          <p>Loading articles...</p>
        ) : (
          <>
            <button onClick={handleToggleCheckAll}>
              {articles.length > 0 && selectedArticles.length === articles.length ? 'Unselect All' : 'Select All'}
            </button>
            <ArticlesList
              articles={articles}
              selectedArticles={selectedArticles}
              onCheckboxChange={handleArticleCheckboxChange}
            />
          </>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleGenerateAndSend} disabled={loading || !articles.length}>
          {loading ? 'Processing...' : 'Generate PDF & Send Email'}
        </button>
      </div>
    </div>
  );
};

const ArticlesList = ({ articles, selectedArticles, onCheckboxChange }) => (
  <div style={{ marginTop: '10px' }}>
    {articles.length === 0 ? (
      <p>No articles to display.</p>
    ) : (
      articles.map((article) => (
        <div key={article.title} style={{ marginBottom: '5px' }}>
          <input
            type="checkbox"
            checked={selectedArticles.some((a) => a.title === article.title)}
            onChange={(e) => onCheckboxChange(article, e.target.checked)}
          />
          <strong>{article.title}</strong>
        </div>
      ))
    )}
  </div>
);

export default App;
