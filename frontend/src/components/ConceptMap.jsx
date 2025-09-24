import React, { useState, useEffect } from 'react';
import * as yaml from 'js-yaml';
import { getAssetUrl } from '../utils/paths';

import './ConceptMap.css';

function ConceptMap({ yamlPath, currentPath }) {
  console.log('ConceptMap: Component mounted with:', { yamlPath, currentPath });
  const [conceptMap, setConceptMap] = useState([]);
  const [questionDetails, setQuestionDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    console.log('ConceptMap: useEffect triggered with yamlPath:', yamlPath);
    const fetchConceptMap = async () => {
      try {
        console.log('ConceptMap: Starting fetchConceptMap...');
        setLoading(true);
        
        // Construct the full path to the YAML file
        // Handle both relative paths (from sub-pages) and absolute paths (from big-picture.md)
        let fullPath;
        if (yamlPath.startsWith('content/')) {
          // Absolute path from textbook root (e.g., from big-picture.md)
          fullPath = getAssetUrl(`textbook/${yamlPath}`);
          console.log('ConceptMap: Using absolute path:', fullPath);
        } else {
          // Relative path (e.g., from sub-pages)
          // If currentPath doesn't end with a file extension, it's already a directory path
          const directoryPath = currentPath && currentPath.includes('.') ? 
            currentPath.split('/').slice(0, -1).join('/') : 
            currentPath;
          fullPath = directoryPath ? 
            getAssetUrl(`textbook/${directoryPath}/${yamlPath}`) : 
            getAssetUrl(`textbook/${yamlPath}`);
          console.log('ConceptMap: Using relative path. directoryPath:', directoryPath, 'fullPath:', fullPath);
        }
        
        const response = await fetch(fullPath);
        console.log('ConceptMap: Fetch response status:', response.status, 'for path:', fullPath);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch concept map: ${response.status}`);
        }
        
        const yamlText = await response.text();
        const conceptMapData = yaml.load(yamlText);
        
        console.log('ConceptMap: Loaded concept map data:', conceptMapData);
        console.log('ConceptMap: Type of conceptMapData:', typeof conceptMapData);
        console.log('ConceptMap: Keys in conceptMapData:', Object.keys(conceptMapData || {}));
        console.log('ConceptMap: Has concept_map property:', !!conceptMapData?.concept_map);
        
        if (!conceptMapData?.concept_map) {
          console.error('ConceptMap: Missing concept_map array. Full data:', conceptMapData);
          throw new Error('Invalid concept map format: missing concept_map array');
        }
        
        setConceptMap(conceptMapData.concept_map);
        
        // Initialize all categories as expanded by default
        const initialExpandedCategories = {};
        conceptMapData.concept_map.forEach((category, index) => {
          initialExpandedCategories[index] = true;
        });
        setExpandedCategories(initialExpandedCategories);
        
        // Collect all unique question file references
        const questionFiles = new Set();
        conceptMapData.concept_map.forEach(category => {
          category.concepts?.forEach(concept => {
            concept.exam_questions?.forEach(questionFile => {
              questionFiles.add(questionFile);
            });
          });
        });
        
        // Fetch all referenced question files
        const questionPromises = Array.from(questionFiles).map(async (questionFile) => {
          // Question files should be relative to the concept map file location
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
            
          try {
            console.log('ConceptMap: Loading question file from path:', questionPath);
            const questionResponse = await fetch(questionPath);
            if (!questionResponse.ok) {
              console.warn(`ConceptMap: Failed to fetch question file: ${questionFile} at ${questionPath}`);
              return [questionFile, null];
            }
            
            const questionYaml = await questionResponse.text();
            const questionData = yaml.load(questionYaml);
            console.log('ConceptMap: Loaded question data for:', questionFile, questionData);
            return [questionFile, questionData];
          } catch (err) {
            console.warn(`ConceptMap: Error loading question file ${questionFile}:`, err);
            return [questionFile, null];
          }
        });
        
        const questionResults = await Promise.all(questionPromises);
        const questionDetailsMap = Object.fromEntries(questionResults);
        
        console.log('Loaded question details:', questionDetailsMap);
        setQuestionDetails(questionDetailsMap);
        
      } catch (err) {
        console.error('Error fetching concept map:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConceptMap();
  }, [yamlPath, currentPath]);

  const toggleCategory = (categoryIndex) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryIndex]: !prev[categoryIndex]
    }));
  };

  const toggleQuestions = (categoryIndex, conceptIndex) => {
    const key = `${categoryIndex}-${conceptIndex}`;
    setExpandedQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getQuestionTitle = (questionFile) => {
    const questionData = questionDetails[questionFile];
    if (!questionData) return questionFile;
    
    return questionData.question || questionFile;
  };

  const getQuestionId = (questionFile) => {
    const questionData = questionDetails[questionFile];
    if (!questionData) return '';
    
    return questionData.id ? `Q${questionData.id}` : '';
  };

  if (loading) {
    return <div className="concept-map-loading">Loading concept map...</div>;
  }

  if (error) {
    return <div className="concept-map-error">Error loading concept map: {error}</div>;
  }

  if (!conceptMap.length) {
    return <div className="concept-map-empty">No concept map data available.</div>;
  }

  return (
    <div className="concept-map">
      <div className="concept-categories">
        {conceptMap.map((category, categoryIndex) => (
          <div key={categoryIndex} className="concept-category">
            <button
              className={`category-header ${expandedCategories[categoryIndex] ? 'expanded' : ''}`}
              onClick={() => toggleCategory(categoryIndex)}
            >
              <span className="category-title">{category.category}</span>
              <span className="expand-icon">
                {expandedCategories[categoryIndex] ? '−' : '+'}
              </span>
            </button>
            
            {expandedCategories[categoryIndex] && (
              <div className="category-content">
                {category.concepts?.map((concept, conceptIndex) => (
                  <div key={conceptIndex} className="concept-item">
                    <div className="concept-content">
                      <div className="concept-header">
                        <span className="concept-name">{concept.name}</span>
                        {concept.description && (
                          <span className="concept-description">({concept.description})</span>
                        )}
                      </div>
                      
                      {concept.exam_questions?.length > 0 && (
                        <div className="concept-questions">
                          <button
                            className={`questions-header ${expandedQuestions[`${categoryIndex}-${conceptIndex}`] ? 'expanded' : ''}`}
                            onClick={() => toggleQuestions(categoryIndex, conceptIndex)}
                          >
                            <span>{concept.exam_questions.length} question{concept.exam_questions.length !== 1 ? 's' : ''}</span>
                            <span className="expand-icon">
                              {expandedQuestions[`${categoryIndex}-${conceptIndex}`] ? '−' : '+'}
                            </span>
                          </button>
                          
                          {expandedQuestions[`${categoryIndex}-${conceptIndex}`] && (
                            <ul className="questions-list">
                              {concept.exam_questions.map((questionFile, questionIndex) => (
                                <li key={questionIndex} className="question-item">
                                  <div className="question-header">
                                    <span className="question-title">
                                      {getQuestionTitle(questionFile)}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConceptMap;
