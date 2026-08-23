import React, { useState } from 'react';
import { runWorkflow } from './workflow';

const App = () => {
  const [articles, setArticles] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const emails = ['test@example.com'];
  const emailEndpoint = 'https://ai-newsletter-vobs.onrender.com/send-email';

  const handleDateChange = async (start, end, label) => {
    setLoading(true);
    setDateRange({ start, end });
    try {
      const fetchedArticles = await fetchArticles(start, end);
      setArticles(fetchedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!dateRange) return;

    setLoading(true);
    try {
      const result = await runWorkflow({
        start: dateRange.start,
        end: dateRange.end,
        selectedArticles,
        allArticles: articles,
        emails,
        emailEndpoint,
      });
      console.log('Workflow completed:', result);
    } catch (error) {
      console.error('Workflow error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ backgroundColor: '#008080', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>Top 10 AI Articles</h2>
      </div>

      {/* Date Range Selector */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
      <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Select the date to view the articles</span>
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
