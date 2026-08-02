import React from 'react';

function ArticlesList({ articles, selectedArticles, onCheckboxChange }) {
    const handleCheckboxChange = (article) => {
        onCheckboxChange(article);
    };

    return (
        <div style={{ width: '100%', margin: 0, padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: "25px" }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {articles.map(article => (
                        <li
                            key={article.url}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '8px'
                            }}
                        >
                            <input
                                type="checkbox"
                                onChange={() => handleCheckboxChange(article)}
                                checked={selectedArticles.some(a => a.url === article.url)}
                                style={{ marginRight: '8px' }}
                            />
                            {article.title}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default ArticlesList;