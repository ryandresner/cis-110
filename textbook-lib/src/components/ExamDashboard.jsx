import React, { useState } from 'react';
import './ExamDashboard.css';

function ExamDashboard({ questions, onStartExam, courseTitle = "Course Exam" }) {
  const [percentage, setPercentage] = useState(100);
  const [sortQuestions, setSortQuestions] = useState(true);
  const [showAnswerToggle, setShowAnswerToggle] = useState(true);
  
  // Get unique chapters from questions
  const chapters = [...new Set(questions.map(q => q.chapter))].sort((a, b) => a - b);
  
  const generateExam = () => {
    const examQuestions = [];
    
    // Select specified percentage of questions from each chapter
    chapters.forEach(chapter => {
      const chapterQuestions = questions.filter(q => q.chapter === chapter);
      const selectedCount = Math.ceil(chapterQuestions.length * (percentage / 100));
      
      // If sorted mode, take first N questions in order; otherwise shuffle
      const selected = sortQuestions
        ? chapterQuestions.slice(0, selectedCount)
        : [...chapterQuestions].sort(() => Math.random() - 0.5).slice(0, selectedCount);
      
      examQuestions.push(...selected);
    });
    
    // Sort by chapter and concept map order, or shuffle randomly
    const finalExam = sortQuestions 
      ? examQuestions.sort((a, b) => a.chapter - b.chapter || a.order - b.order)
      : examQuestions.sort(() => Math.random() - 0.5);
    
    onStartExam({
      questions: finalExam,
      settings: {
        showAnswerToggle
      }
    });
  };

  const getQuestionCountByChapter = (chapter) => {
    return questions.filter(q => q.chapter === chapter).length;
  };

  const totalExamQuestions = chapters.reduce((total, chapter) => {
    const chapterCount = getQuestionCountByChapter(chapter);
    return total + Math.ceil(chapterCount * (percentage / 100));
  }, 0);

  return (
    <div className="exam-dashboard-simple">
      <div className="exam-overview">
        <h2>{courseTitle}</h2>
        
        <div className="exam-controls">
          <div className="control-group">
            <label htmlFor="percentage-slider">
              Questions per Chapter: <strong>{percentage}%</strong>
            </label>
            <input
              id="percentage-slider"
              type="range"
              min="10"
              max="100"
              step="10"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="percentage-slider"
            />
            <div className="slider-labels">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="control-group">
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={sortQuestions}
                onChange={(e) => setSortQuestions(e.target.checked)}
              />
              <span className="toggle-text">
                Sorted by Chapter
              </span>
              <div className="switch"></div>
            </label>
          </div>

          <div className="control-group">
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={showAnswerToggle}
                onChange={(e) => setShowAnswerToggle(e.target.checked)}
              />
              <span className="toggle-text">
                Show Answer Button
              </span>
              <div className="switch"></div>
            </label>
          </div>
        </div>
        
        <div className="exam-details">
          <div className="detail-item">
            <strong>{totalExamQuestions}</strong>
            <span>Questions</span>
          </div>
          <div className="detail-item">
            <strong>{chapters.length}</strong>
            <span>Chapters</span>
          </div>
          <div className="detail-item">
            <strong>{percentage}%</strong>
            <span>From Each</span>
          </div>
        </div>

        <div className="chapter-preview">
          <h3>Chapter Breakdown</h3>
          <div className="chapter-grid">
            {chapters.map(chapter => {
              const totalQuestions = getQuestionCountByChapter(chapter);
              const examQuestions = Math.ceil(totalQuestions * (percentage / 100));
              return (
                <div key={chapter} className="chapter-preview-item">
                  <span className="chapter-number">Ch. {chapter}</span>
                  <span className="question-count">{examQuestions} / {totalQuestions}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button 
          className="generate-exam-btn"
          onClick={generateExam}
          disabled={questions.length === 0}
        >
          Generate Exam
        </button>
      </div>
    </div>
  );
}

export default ExamDashboard;
