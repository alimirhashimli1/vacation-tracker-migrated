import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('Loading...');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('http://localhost:3000/health');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setHealthStatus(data.status);
      } catch (error) {
        console.error("Failed to fetch health status:", error);
        setHealthStatus('Error: Could not connect to backend');
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="App">
      <h1>Frontend</h1>
      <p>Backend Health Status: {healthStatus}</p>
    </div>
  )
}

export default App
