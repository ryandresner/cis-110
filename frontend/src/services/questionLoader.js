import * as yaml from 'js-yaml';
import { getAssetUrl } from '../utils/paths';

// Define all concept map paths
const CONCEPT_MAP_PATHS = [
  'content/overviews/00-zero-computers/concept-map.yml',
  'content/overviews/01-one-computer/concept-map.yml',
  'content/overviews/02-a-few-computers/concept-map.yml',
  'content/overviews/03-a-lot-of-computers/concept-map.yml'
];

// Helper function to extract chapter number from path
const getChapterNumber = (path) => {
  const match = path.match(/(\d+)-/);
  return match ? parseInt(match[1]) : 0;
};

// Helper function to get chapter title from path
const getChapterTitle = (path) => {
  const match = path.match(/\d+-(.*?)\/concept-map\.yml$/);
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Unknown Chapter';
};

// Load all questions from concept map files
export const loadAllQuestions = async () => {
  const allQuestions = [];
  
  for (const conceptMapPath of CONCEPT_MAP_PATHS) {
    try {
      console.log('Loading concept map:', conceptMapPath);
      
      // Fetch the concept map file
      const conceptMapUrl = getAssetUrl(`textbook/${conceptMapPath}`);
      const response = await fetch(conceptMapUrl);
      
      if (!response.ok) {
        console.warn(`Failed to fetch concept map: ${conceptMapPath} (${response.status})`);
        continue;
      }
      
      const yamlText = await response.text();
      const conceptMapData = yaml.load(yamlText);
      
      if (!conceptMapData?.concept_map) {
        console.warn(`Invalid concept map format: ${conceptMapPath}`);
        continue;
      }
      
      // Extract all question file paths from the concept map
      const questionFiles = new Set();
      conceptMapData.concept_map.forEach(category => {
        if (category.concepts) {
          category.concepts.forEach(concept => {
            if (concept.exam_questions) {
              concept.exam_questions.forEach(questionFile => {
                questionFiles.add(questionFile);
              });
            }
          });
        }
      });
      
      // Load individual question files
      const conceptMapDir = conceptMapPath.substring(0, conceptMapPath.lastIndexOf('/'));
      const chapterNumber = getChapterNumber(conceptMapPath);
      const chapterTitle = getChapterTitle(conceptMapPath);
      
      for (const questionFile of questionFiles) {
        try {
          const questionPath = getAssetUrl(`textbook/${conceptMapDir}/${questionFile}`);
          const questionResponse = await fetch(questionPath);
          
          if (!questionResponse.ok) {
            console.warn(`Failed to fetch question file: ${questionFile} (${questionResponse.status})`);
            continue;
          }
          
          const questionYaml = await questionResponse.text();
          const questionData = yaml.load(questionYaml);
          
          // Add metadata to match the old questions.json format
          const enrichedQuestion = {
            ...questionData,
            chapter: chapterNumber,
            chapterTitle: chapterTitle,
            id: `ch${chapterNumber}-${questionFile.replace('.yml', '')}`,
            conceptMapPath: conceptMapPath,
            questionFile: questionFile
          };
          
          allQuestions.push(enrichedQuestion);
        } catch (error) {
          console.error(`Error loading question file ${questionFile}:`, error);
        }
      }
      
    } catch (error) {
      console.error(`Error loading concept map ${conceptMapPath}:`, error);
    }
  }
  
  // Sort questions by chapter and then by question file name
  allQuestions.sort((a, b) => {
    if (a.chapter !== b.chapter) {
      return a.chapter - b.chapter;
    }
    return a.questionFile.localeCompare(b.questionFile);
  });
  
  console.log(`Loaded ${allQuestions.length} questions from ${CONCEPT_MAP_PATHS.length} concept maps`);
  return allQuestions;
};
