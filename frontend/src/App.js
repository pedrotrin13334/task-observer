import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from Flask backend
    axios.get('http://localhost:5000/api/hello')
      .then(response => {
        setMessage(response.data.message);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setMessage('Error connecting to backend');
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React + Flask Hello World</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <p>{message}</p>
        )}
        <a
          className="App-link"
          href="http://localhost:5000/api/health"
          target="_blank"
          rel="noopener noreferrer"
        >
          Check Backend Health
        </a>
      </header>
    </div>
  );
}

export default App;