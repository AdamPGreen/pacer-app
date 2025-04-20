import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Results from './pages/Results';
import { RunContextProvider } from './context/RunContext';
import { SpotifyProvider } from './context/SpotifyContext';

function App() {
  return (
    <SpotifyProvider>
      <RunContextProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/results" element={<Results />} />
            </Routes>
          </Layout>
        </Router>
      </RunContextProvider>
    </SpotifyProvider>
  );
}

export default App;