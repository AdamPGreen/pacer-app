import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Results from './pages/Results';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { RunContextProvider } from './context/RunContext';
import { SpotifyProvider } from './context/SpotifyContext';

function App() {
  return (
    <SpotifyProvider>
      <RunContextProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/results" element={<Results />} />
              </Route>
            </Routes>
          </Layout>
        </Router>
      </RunContextProvider>
    </SpotifyProvider>
  );
}

export default App;