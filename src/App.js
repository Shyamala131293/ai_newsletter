import React, { useState, useEffect } from 'react';
import { fetchArticles } from './agents'; // Your fetchArticles function
import { runWorkflow } from './workflow'; // Your runWorkflow function

// Utility to get last 4 Fridays and today
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

  // Fetch articles for initial load or when dateRange changes
  const fetchArticlesForRange = async (start, end) => {
    setLoading(true);
    try {
      const data = await fetchArticles(start, end);
      setArticles(data);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  // When dateRange is set, fetch articles
  useEffect(() => {
    if (dateRange) {
      fetchArticlesForRange(dateRange.start, dateRange.end);
    }
  }, [dateRange]);

  // Handle selecting a date range from dropdown
  const handleDateSelect = (e) => {
    const selectedLabel = e.target.value;
    const option = dateOptions.find((opt) => opt.label === selectedLabel);
    if (option) {
      setDateRange({ start: option.start, end: option.end });
      fetchArticlesForRange(option.start, option.end);
    }
  };

  const handleArticleCheckboxChange = (article, isChecked) => {
    setSelectedArticles((prev) => {
      if (isChecked) {
        return [...prev, article];
      } else {
        return prev.filter((a) => a.title !== article.title);
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
    } catch (err) {
      console.error('Error running workflow:', err);
    }
  };

  const allSelected = articles.length > 0 && selectedArticles.length === articles.length;

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#008080', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>Top 10 AI Articles</h2>
      </div>

      {/* Date Range Selector */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Select the date to view the articles</span>
        <select onChange={handleDateSelect} defaultValue="">
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

      {/* Articles List and Buttons */}
      {articles.length > 0 && (
        <>
          <ArticlesList
            articles={articles}
            selectedArticles={selectedArticles}
            onCheckboxChange={handleArticleCheckboxChange}
          />

          {/* Buttons for Check All / Generate PDF */}
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

// ArticlesList component
const ArticlesList = ({ articles, selectedArticles, onCheckboxChange }) => (
  <div style={{ marginTop: '10px' }}>
    {articles.map((article) => (
      <div key={article.title} style={{ marginBottom: '5px' }}>
        <input
          type="checkbox"
          checked={selectedArticles.some((a) => a.title === article.title)}
          onChange={(e) => onCheckboxChange(article, e.target.checked)}
        />
        <strong>{article.title}</strong>
      </div>
    ))}
  </div>
);

export default App;
