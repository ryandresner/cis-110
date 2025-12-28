import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DrawingCanvas from './DrawingCanvas';
import YouTube from './YouTube';
import './ExamInterface.css';

function ExamInterface({ questions, settings, onEndExam }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [inputMode, setInputMode] = useState('canvas'); // 'canvas' or 'text'
  const canvasRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't navigate if user is typing in textarea or any input
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextQuestion();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, questions.length]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswered = answers.hasOwnProperty(currentQuestion.id);

  const handleAnswerChange = (answer, canvasData = null) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        answer,
        canvasData,
        timeSpent: Date.now() - questionStartTime
      }
    }));
  };

  const handleCanvasChange = (dataURL) => {
    const currentAnswer = answers[currentQuestion.id]?.answer || '';
    handleAnswerChange(currentAnswer, dataURL);
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
  };

  const goToNextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Canvas data is loaded via initialData prop, no need for effect

  const submitExam = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    const answeredQuestions = Object.keys(answers).length;
    const totalQuestions = questions.length;
    
    // For now, we'll just count completion since these are short-answer questions
    // In a real system, you'd need human grading or more sophisticated checking
    return {
      answered: answeredQuestions,
      total: totalQuestions,
      percentage: Math.round((answeredQuestions / totalQuestions) * 100)
    };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="exam-results">
        <h2>Exam Complete!</h2>
        
        <div className="score-summary">
          <div className="score-circle">
            <span className="score-percentage">{score.percentage}%</span>
            <span className="score-label">Completed</span>
          </div>
          <div className="score-details">
            <p>Questions Answered: {score.answered} / {score.total}</p>
            <p>Time Spent: {formatTime(timeSpent)}</p>
            <p>Average per Question: {formatTime(Math.round(timeSpent / questions.length))}</p>
          </div>
        </div>

        <div className="question-review">
          <h3>Your Responses</h3>
          {questions.map((question, index) => {
            const userAnswer = answers[question.id];
            return (
              <div key={question.id} className="question-result">
                <div className="question-header">
                  <h4>Question {index + 1} (Chapter {question.chapter})</h4>
                </div>
                <div className="question-text">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {question.question}
                  </ReactMarkdown>
                </div>
                <div className="answer-comparison">
                  <div className="user-answer">
                    <strong>Your Answer:</strong>
                    {userAnswer?.canvasData && (
                      <div className="canvas-preview">
                        <img 
                          src={userAnswer.canvasData} 
                          alt="Canvas drawing"
                          style={{
                            maxWidth: '100%',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    )}
                    <p>{userAnswer ? userAnswer.answer || (userAnswer.canvasData ? '(Canvas drawing above)' : '') : 'Not answered'}</p>
                  </div>
                  <div className="correct-answer">
                    <strong>Model Answer:</strong>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {question.answer}
                    </ReactMarkdown>
                  </div>
                </div>
                {userAnswer && (
                  <p className="time-spent">
                    Time spent: {formatTime(Math.round(userAnswer.timeSpent / 1000))}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button className="return-dashboard-btn" onClick={onEndExam}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="exam-interface">
      <div className="exam-header">
        <div className="progress-info">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="time-info">
          <span>Time: {formatTime(timeSpent)}</span>
        </div>
      </div>

      <div className="question-section">
        <div className="question-meta">
          <span className="chapter-tag">Chapter {currentQuestion.chapter}</span>
          {settings?.showAnswerToggle && (
            <button 
              onClick={() => setShowAnswer(!showAnswer)}
              className={`show-answer-toggle ${showAnswer ? 'active' : ''}`}
            >
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
          )}
        </div>
        
        <div className="question-text">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {currentQuestion.question}
          </ReactMarkdown>
        </div>

        {settings?.showAnswerToggle && showAnswer && (
          <div className="answer-reveal">
            <strong>Answer:</strong>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentQuestion.answer}
            </ReactMarkdown>
            
            {currentQuestion.example_videos && currentQuestion.example_videos.length > 0 && (
              <div className="answer-videos">
                <strong>Example Videos:</strong>
                {currentQuestion.example_videos.map((videoUrl, idx) => (
                  <YouTube key={idx} url={videoUrl} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="answer-section">
          <div className="input-mode-toggle">
            <button 
              className={`mode-btn ${inputMode === 'canvas' ? 'active' : ''}`}
              onClick={() => setInputMode('canvas')}
            >
              Canvas
            </button>
            <button 
              className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
              onClick={() => setInputMode('text')}
            >
              Text
            </button>
          </div>

          {inputMode === 'canvas' ? (
            <div className="canvas-container">
              <div className="canvas-controls">
                <button onClick={clearCanvas} className="canvas-btn">
                  ✕ Clear
                </button>
              </div>
              <DrawingCanvas
                ref={canvasRef}
                onChange={handleCanvasChange}
                initialData={answers[currentQuestion.id]?.canvasData}
                width={800}
                height={400}
              />
            </div>
          ) : (
            <textarea
              placeholder="Your notes can go here..."
              value={answers[currentQuestion.id]?.answer || ''}
              onChange={(e) => handleAnswerChange(e.target.value, answers[currentQuestion.id]?.canvasData)}
              rows="6"
              className="answer-input"
            />
          )}
        </div>
      </div>

      <div className="navigation-section">
        <div className="nav-buttons">
          <button 
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="nav-btn prev-btn"
          >
            ← Previous
          </button>
          
          {isLastQuestion ? (
            <button 
              onClick={submitExam}
              className="submit-btn"
              disabled={Object.keys(answers).length === 0}
            >
              Submit Exam
            </button>
          ) : (
            <button 
              onClick={goToNextQuestion}
              className="nav-btn next-btn"
            >
              Next →
            </button>
          )}
        </div>

        <div className="question-status">
          <p>
            {hasAnswered ? '✓ Answered' : '○ Not answered'} 
            {hasAnswered && ` (${answers[currentQuestion.id].answer.length} characters)`}
          </p>
        </div>
      </div>

      <div className="exam-overview">
        <h3>Question Overview</h3>
        <div className="question-grid">
          {questions.map((_, index) => (
            <button
              key={index}
              className={`question-nav-item ${
                index === currentQuestionIndex ? 'current' : ''
              } ${answers[questions[index].id] ? 'answered' : 'unanswered'}`}
              onClick={() => setCurrentQuestionIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ExamInterface;
