import React, { useState, useEffect } from 'react';
import * as yaml from 'js-yaml';
import { getAssetUrl } from '../utils/paths';

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

function ExamQuestions({ yamlPath, currentPath, concept_filter }) {
  // ExamQuestions component now loads questions from concept-map.yml files
  // It extracts all unique question file paths from the concept map structure
  // and loads each individual question file, then displays them sorted by ID
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAnswers, setExpandedAnswers] = useState({});

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        console.log('ExamQuestions: yamlPath =', yamlPath);
        console.log('ExamQuestions: currentPath =', currentPath);
        console.log('ExamQuestions: concept_filter =', concept_filter);
        
        // Construct the full path to the concept-map.yml file
        // Handle both relative paths (from sub-pages) and absolute paths (from big-picture.md)
        let fullPath;
        if (yamlPath.startsWith('content/')) {
          // Absolute path from textbook root (e.g., from big-picture.md)
          fullPath = getAssetUrl(`textbook/${yamlPath}`);
          console.log('ExamQuestions: Using absolute path:', fullPath);
        } else {
          // Relative path (e.g., from sub-pages)
          // If currentPath doesn't end with a file extension, it's already a directory path
          const directoryPath = currentPath && currentPath.includes('.') ? 
            currentPath.split('/').slice(0, -1).join('/') : 
            currentPath;
          fullPath = directoryPath ? 
            getAssetUrl(`textbook/${directoryPath}/${yamlPath}`) : 
            getAssetUrl(`textbook/${yamlPath}`);
          console.log('ExamQuestions: Using relative path. directoryPath:', directoryPath, 'fullPath:', fullPath);
        }
        
        const response = await fetch(fullPath);
        console.log('ExamQuestions: Fetch response status:', response.status, 'for path:', fullPath);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch concept map: ${response.status}`);
        }
        
        const yamlText = await response.text();
        const conceptMapData = yaml.load(yamlText);
        
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
            questionPath = getAssetUrl(`textbook/${conceptMapDir}/${questionFile}`);
          } else {
            // Relative path - question files are relative to current page directory
            const currentDir = currentPath && currentPath.includes('.') ? 
              currentPath.split('/').slice(0, -1).join('/') : 
              currentPath;
            questionPath = currentDir ? 
              getAssetUrl(`textbook/${currentDir}/${questionFile}`) : 
              getAssetUrl(`textbook/${questionFile}`);
          }
          
          console.log('ExamQuestions: Loading question file from path:', questionPath);
            
          const questionResponse = await fetch(questionPath);
          console.log('ExamQuestions: Question file response status:', questionResponse.status, 'for:', questionFile);
          if (!questionResponse.ok) {
            throw new Error(`Failed to fetch question file: ${questionFile}`);
          }
          
          const questionYaml = await questionResponse.text();
          const questionData = yaml.load(questionYaml);
          return questionData;
        });
        
        const questions = await Promise.all(questionPromises);
        
        // Questions are already in concept map order, no need to sort
        setQuestions(questions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (yamlPath) {
      fetchQuestions();
    }
  }, [yamlPath, currentPath]);

  if (loading) {
    return <div>Loading questions...</div>;
  }

  if (error) {
    return <div>Error loading questions: {error}</div>;
  }

  // Toggle accordion expansion
  const toggleAnswer = (questionId, answerKey) => {
    const key = `${questionId}-${answerKey}`;
    setExpandedAnswers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="exam-questions">
      {questions.map((q, index) => (
        <div key={q.id || index} className="question-item">
          <h3>{q.question}</h3> 
          
          {/* Main answer - always shown (no accordion) */}
          {q.answer && (
            <div className="answer main-answer">
              <p>{processAnswerText(q.answer, q.vocab_answer)}</p>
            </div>
          )}
          
          {/* Additional answer levels as accordions */}
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
                        <p>{processAnswerText(q[key], vocabList)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {q.topics && q.topics.length > 0 && (
            <div className="topics">
              <strong>Topics:</strong> {q.topics.join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ExamQuestions;
