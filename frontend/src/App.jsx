import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import ExamDashboard from './components/ExamDashboard';
import ExamInterface from './components/ExamInterface';
import TextbookPage from './components/TextbookPage';
import { loadAllQuestions } from './services/questionLoader';

function AppContent() {
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllQuestions()
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading questions:', error);
        setLoading(false);
      });
  }, []);

  const startExam = (examData) => {
    setCurrentExam(examData);
  };

  const endExam = () => {
    setCurrentExam(null);
  };

  const isExamPage = location.pathname.startsWith('/exams');
  const isTextbookPage = !isExamPage;

  if (loading) {
    return (
      <div className="app loading">
        <h2>Loading CIS-110 Exam System...</h2>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <div className="header-title">
            <h1>CIS110</h1>
            <p>Computer Information Systems Concepts</p>
          </div>
          <nav className="main-nav">
            <Link 
              to="/" 
              className={`nav-link ${isTextbookPage ? 'active' : ''}`}
            >
              Textbook
            </Link>
            <Link 
              to="/exams" 
              className={`nav-link ${isExamPage ? 'active' : ''}`}
            >
              Exams
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<TextbookPage />} />
          <Route path="/exams" element={
            currentExam ? (
              <ExamInterface 
                questions={currentExam.questions} 
                settings={currentExam.settings}
                onEndExam={endExam}
              />
            ) : (
              <ExamDashboard 
                questions={questions} 
                onStartExam={startExam}
              />
            )
          } />
          <Route path="/textbook/*" element={<TextbookPage />} />
          {/* Redirect old wiki routes to textbook routes */}
          <Route path="/wiki/*" element={<Navigate to={location.pathname.replace('/wiki', '/textbook')} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App
