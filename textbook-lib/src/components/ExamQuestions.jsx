import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as yaml from 'js-yaml';
import { getAssetUrl } from '../utils/paths';
import compiledContentService from '../services/compiledContentService';

import './ExamQuestions.css';

// Additional answer levels with their display names (reversed order - kindergarten first)
const ADDITIONAL_ANSWER_LEVELS = [
  { key: 'answer_kindergarten', label: '🧸 Tell Me Like I\'m 5' },
  { key: 'answer_3rd_grade', label: '📚 A little bit harder please...' },
  { key: 'answer_7th_grade', label: '🤔 Even harder!' },
  { key: 'answer_high_school', label: '🎓 I want to impress people' },
  { key: 'answer_undergraduate', label: '🧠 I want to go to grad school' }
];

// Function to process text and highlight vocabulary words with tooltips
const processAnswerText = (text, vocabList) => {
  if (!text || !vocabList || vocabList.length === 0) {
    return text;
  }

  // Create a map of vocabulary words to their definitions
  const vocabItems = vocabList.map(item => ({
    word: item.word,
    definition: item.definition,
    regex: new RegExp(`\\b${item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
  }));

  // Sort by word length (longest first) to handle multi-word terms properly
  vocabItems.sort((a, b) => b.word.length - a.word.length);

  let processedText = text;
  const replacements = [];
  let replacementIndex = 0;

  // Find all vocabulary word matches
  vocabItems.forEach(({ word, definition, regex }) => {
    let match;
    while ((match = regex.exec(processedText)) !== null) {
      const placeholder = `__VOCAB_${replacementIndex}__`;
      replacements.push({
        placeholder,
        word: match[0], // Use the actual matched text (preserves original case)
        definition,
        index: replacementIndex
      });
      
      // Replace the matched text with placeholder
      processedText = processedText.substring(0, match.index) + 
        placeholder + 
        processedText.substring(match.index + match[0].length);
      
      // Reset regex lastIndex to continue searching from the beginning
      regex.lastIndex = 0;
      replacementIndex++;
      
      // Re-search from beginning since we modified the string
      break;
    }
    // Reset regex for next iteration
    regex.lastIndex = 0;
  });

  // Split text by placeholders and replace with React elements
  if (replacements.length === 0) {
    return text;
  }

  const parts = processedText.split(/(__VOCAB_\d+__)/);
  
  return parts.map((part, index) => {
    const replacement = replacements.find(r => r.placeholder === part);
    if (replacement) {
      return (
        <span
          key={`vocab-${replacement.index}-${index}`}
          className="vocab-word"
          title={replacement.definition}
        >
          {replacement.word}
        </span>
      );
    }
    return part;
  });
};

// Function to render markdown content with vocabulary highlighting
const renderMarkdownWithVocab = (text, vocabList) => {
  if (!text) return null;
  
  // Process vocabulary words in the text
  const processedContent = processAnswerText(text, vocabList);
  
  // If no vocab processing happened, render markdown normally
  if (typeof processedContent === 'string') {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {processedContent}
      </ReactMarkdown>
    );
  }
  
  // If vocab words were processed, wrap in a div
  return <div>{processedContent}</div>;
};

function ExamQuestions({ 
  yamlPath, 
  currentPath, 
  concept_filter, 
  question_filter,
  title,                        // Optional title to display above questions
  showAnswers = true,           // Show/hide main answers
  showVideos = true,            // Show/hide example videos section
  showAnswerLevels = true,      // Show/hide additional answer level accordions
  answersOpenByDefault = true,  // Whether main answers are visible by default
  videosOpenByDefault = false,  // Whether video accordions are open by default
  answerLevelsOpenByDefault = false, // Whether answer level accordions are open by default
  maxVideos = null              // Maximum number of videos to show (null = show all)
}) {
  // ExamQuestions component now loads questions from concept-map.yml files
  // It extracts all unique question file paths from the concept map structure
  // and loads each individual question file, then displays them sorted by ID
  // question_filter can be used to show only a specific question by its ID
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [expandedMainAnswers, setExpandedMainAnswers] = useState({});

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        console.log('ExamQuestions: yamlPath =', yamlPath);
        console.log('ExamQuestions: currentPath =', currentPath);
        console.log('ExamQuestions: concept_filter =', concept_filter);
        console.log('ExamQuestions: question_filter =', question_filter);
        
        // Construct the full path to the concept-map.yml file
        // Handle both relative paths (from sub-pages) and absolute paths (from big-picture.md)
        let fullPath;
        if (yamlPath.startsWith('content/')) {
          // Absolute path from textbook root (e.g., from big-picture.md)
          fullPath = yamlPath;
          console.log('ExamQuestions: Using absolute path:', fullPath);
        } else {
          // Relative path (e.g., from sub-pages)
          // If currentPath doesn't end with a file extension, it's already a directory path
          const directoryPath = currentPath && currentPath.includes('.') ? 
            currentPath.split('/').slice(0, -1).join('/') : 
            currentPath;
          fullPath = directoryPath ? 
            `${directoryPath}/${yamlPath}` : 
            yamlPath;
          console.log('ExamQuestions: Using relative path. directoryPath:', directoryPath, 'fullPath:', fullPath);
        }
        
        console.log('ExamQuestions: Loading concept map from path:', fullPath);
        const conceptMapData = await compiledContentService.getYaml(fullPath);
        
        // Extract all question file paths from the concept map, preserving order
        const questionFiles = [];
        
        if (conceptMapData?.concept_map) {
          // New concept map format
          conceptMapData.concept_map.forEach(category => {
            if (category.concepts) {
              category.concepts.forEach(concept => {
                console.log('ExamQuestions: Checking concept:', concept.name, 'against filter:', concept_filter);
                // Apply concept filter if provided
                if (concept_filter && concept.name !== concept_filter) {
                  console.log('ExamQuestions: Skipping concept due to filter mismatch');
                  return; // Skip this concept if it doesn't match the filter
                }
                console.log('ExamQuestions: Including concept:', concept.name);
                
                if (concept.exam_questions) {
                  concept.exam_questions.forEach(questionFile => {
                    // Only add if not already present (avoid duplicates while preserving order)
                    if (!questionFiles.includes(questionFile)) {
                      questionFiles.push(questionFile);
                    }
                  });
                }
              });
            }
          });
        } else if (conceptMapData?.questions && conceptMapData.questions[0]?.file) {
          // Legacy exam-questions.yml format with file references
          conceptMapData.questions.forEach(questionRef => {
            if (!questionFiles.includes(questionRef.file)) {
              questionFiles.push(questionRef.file);
            }
          });
        } else if (conceptMapData?.questions) {
          // Legacy format: questions are directly in the main file
          setQuestions(conceptMapData.questions);
          return;
        }
        
        console.log('ExamQuestions: Total question files found:', questionFiles.length, questionFiles);
        if (questionFiles.length === 0) {
          setQuestions([]);
          return;
        }
        
        // Load individual question files in the order specified in concept map
        const questionPromises = questionFiles.map(async (questionFile) => {
          let questionPath;
          if (yamlPath.startsWith('content/')) {
            // Absolute path from textbook root - question files are relative to concept map directory
            const conceptMapDir = yamlPath.substring(0, yamlPath.lastIndexOf('/'));
            questionPath = `${conceptMapDir}/${questionFile}`;
          } else {
            // Relative path - question files are relative to current page directory
            const currentDir = currentPath && currentPath.includes('.') ? 
              currentPath.split('/').slice(0, -1).join('/') : 
              currentPath;
            questionPath = currentDir ? 
              `${currentDir}/${questionFile}` : 
              questionFile;
          }
          
          console.log('ExamQuestions: Loading question file from path:', questionPath);
          const questionData = await compiledContentService.getYaml(questionPath);
          return questionData;
        });
        
        const questions = await Promise.all(questionPromises);
        
        // Apply question_filter if provided to show only specific question(s) by ID
        let filteredQuestions = questions;
        if (question_filter) {
          console.log('ExamQuestions: Applying question_filter:', question_filter);
          filteredQuestions = questions.filter(q => q.id === question_filter);
          console.log('ExamQuestions: Filtered questions:', filteredQuestions);
        }
        
        // Questions are already in concept map order, no need to sort
        setQuestions(filteredQuestions);
        
        // Initialize expanded states based on default props
        if (videosOpenByDefault || answerLevelsOpenByDefault || !answersOpenByDefault) {
          const initialExpanded = {};
          const initialMainAnswers = {};
          filteredQuestions.forEach((q, idx) => {
            const questionId = q.id || idx;
            
            // Set videos expanded state
            if (videosOpenByDefault && q.example_videos?.length > 0) {
              initialExpanded[`${questionId}-videos`] = true;
            }
            
            // Set answer levels expanded state
            if (answerLevelsOpenByDefault) {
              ADDITIONAL_ANSWER_LEVELS.forEach(({ key }) => {
                if (q[key]) {
                  initialExpanded[`${questionId}-${key}`] = true;
                }
              });
            }
            
            // Set main answer expanded state
            if (!answersOpenByDefault) {
              initialMainAnswers[questionId] = false;
            } else {
              initialMainAnswers[questionId] = true;
            }
          });
          setExpandedAnswers(initialExpanded);
          setExpandedMainAnswers(initialMainAnswers);
        } else {
          // Default: all main answers visible, accordions closed
          const initialMainAnswers = {};
          filteredQuestions.forEach((q, idx) => {
            initialMainAnswers[q.id || idx] = true;
          });
          setExpandedMainAnswers(initialMainAnswers);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (yamlPath) {
      fetchQuestions();
    }
  }, [yamlPath, currentPath, question_filter, videosOpenByDefault, answerLevelsOpenByDefault, answersOpenByDefault]);

  if (loading) {
    return <div>Loading questions...</div>;
  }

  if (error) {
    return <div>Error loading questions: {error}</div>;
  }

  // Toggle main answer visibility
  const toggleMainAnswer = (questionId) => {
    setExpandedMainAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Toggle accordion expansion
  const toggleAnswer = (questionId, answerKey) => {
    const key = `${questionId}-${answerKey}`;
    setExpandedAnswers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle example videos expansion
  const toggleVideos = (questionId) => {
    const key = `${questionId}-videos`;
    setExpandedAnswers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="exam-questions">
      {title && (
        <h3 className="exam-questions-title">{title}</h3>
      )}
      {questions.map((q, index) => {
        const questionId = q.id || index;
        const isMainAnswerExpanded = expandedMainAnswers[questionId] ?? answersOpenByDefault;
        
        return (
          <div key={questionId} className="question-item">
            <div className="question-text">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {q.question}
              </ReactMarkdown>
            </div>
            
            {/* Main answer - can be shown/hidden and toggled as accordion if needed */}
            {showAnswers && q.answer && (
              <div className="main-answer-section">
                {!answersOpenByDefault && (
                  <button 
                    className="accordion-header answer-toggle"
                    onClick={() => toggleMainAnswer(questionId)}
                    aria-expanded={isMainAnswerExpanded}
                  >
                    <span className="accordion-title">💡 Answer</span>
                    <span className={`accordion-icon ${isMainAnswerExpanded ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </button>
                )}
                {(answersOpenByDefault || isMainAnswerExpanded) && (
                  <div className={answersOpenByDefault ? "answer main-answer" : "accordion-content"}>
                    <div className="answer">
                      {renderMarkdownWithVocab(q.answer, q.vocab_answer)}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Example videos button - shown above answer levels */}
            {showVideos && q.example_videos && q.example_videos.length > 0 && (
            <div className="example-videos-section">
              <button 
                className="accordion-header videos-toggle"
                onClick={() => toggleVideos(questionId)}
                aria-expanded={expandedAnswers[`${questionId}-videos`] || false}
              >
                <span className="accordion-title">
                  📺 Example Videos 
                  <span className="video-count-badge">
                    {maxVideos && q.example_videos.length > maxVideos 
                      ? maxVideos
                      : q.example_videos.length}
                  </span>
                </span>
                <span className={`accordion-icon ${expandedAnswers[`${questionId}-videos`] ? 'expanded' : ''}`}>
                  ▼
                </span>
              </button>
              
              {expandedAnswers[`${questionId}-videos`] && (
                <div className="accordion-content videos-content">
                  {(maxVideos ? q.example_videos.slice(0, maxVideos) : q.example_videos).map((videoUrl, idx) => {
                    // Extract video ID from YouTube URL
                    const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
                    if (videoId) {
                      return (
                        <div key={idx} className="video-container">
                          <iframe
                            width="560"
                            height="315"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={`Example video ${idx + 1}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Additional answer levels as accordions */}
          {showAnswerLevels && (
          <div className="answer-levels">
            {ADDITIONAL_ANSWER_LEVELS.map(({ key, label }) => {
              if (!q[key]) return null; // Skip if this answer level doesn't exist
              
              const questionId = q.id || index;
              const expandKey = `${questionId}-${key}`;
              const isExpanded = expandedAnswers[expandKey] || false;
              
              // Get the corresponding vocabulary list for this answer level
              const vocabKey = key.replace('answer_', 'vocab_');
              const vocabList = q[vocabKey] || [];
              
              return (
                <div key={key} className="answer-accordion">
                  <button 
                    className="accordion-header"
                    onClick={() => toggleAnswer(questionId, key)}
                    aria-expanded={isExpanded}
                  >
                    <span className="accordion-title">{label}</span>
                    <span className={`accordion-icon ${isExpanded ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="accordion-content">
                      <div className="answer">
                        {renderMarkdownWithVocab(q[key], vocabList)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
          
          {q.topics && q.topics.length > 0 && (
            <div className="topics">
              <strong>Topics:</strong> {q.topics.join(', ')}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}

export default ExamQuestions;
