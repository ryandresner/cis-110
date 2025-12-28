import * as yaml from 'js-yaml';
import compiledContentService from './compiledContentService';

// Default concept map paths (for backward compatibility with CIS-110)
const DEFAULT_CONCEPT_MAP_PATHS = [
  'content/overviews/00-zero-computers/concept-map.yml',
  'content/overviews/01-one-computer/concept-map.yml',
  'content/overviews/02-a-few-computers/concept-map.yml',
  'content/overviews/03-a-lot-of-computers/concept-map.yml'
];

// Helper function to extract chapter number from path
const getChapterNumber = (path) => {
  // Try CS-333 format: chapter-01, chapter-02, etc.
  let match = path.match(/chapter-(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  // Try CIS-110 format: 00-zero-computers, 01-one-computer, etc.
  match = path.match(/(\d+)-/);
  return match ? parseInt(match[1]) : 0;
};

// Helper function to get chapter title from path
const getChapterTitle = (path) => {
  // Try CS-333 format: chapter-01, chapter-02
  let match = path.match(/chapter-(\d+)/);
  if (match) {
    return `Chapter ${parseInt(match[1])}`;
  }
  // Try CIS-110 format: 00-zero-computers
  match = path.match(/\d+-(.*?)\/concept-map\.yml$/);
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Unknown Chapter';
};

// Load all questions from concept map files
export const loadAllQuestions = async (conceptMapPaths = DEFAULT_CONCEPT_MAP_PATHS) => {
  const allQuestions = [];
  
  for (const conceptMapPath of conceptMapPaths) {
    try {
      console.log('Loading concept map:', conceptMapPath);
      
      // Fetch the concept map file using compiled content service
      const conceptMapData = await compiledContentService.getYaml(conceptMapPath);
      
      if (!conceptMapData?.concept_map) {
        console.warn(`Invalid concept map format: ${conceptMapPath}`);
        continue;
      }
      
      // Extract all question file paths from the concept map, preserving order
      const questionFiles = [];
      let orderIndex = 0;
      conceptMapData.concept_map.forEach(category => {
        if (category.concepts) {
          category.concepts.forEach(concept => {
            if (concept.exam_questions) {
              concept.exam_questions.forEach(questionFile => {
                // Only add if not already present (avoid duplicates)
                if (!questionFiles.find(q => q.file === questionFile)) {
                  questionFiles.push({ file: questionFile, order: orderIndex++ });
                }
              });
            }
          });
        }
      });
      
      // Load individual question files
      const conceptMapDir = conceptMapPath.substring(0, conceptMapPath.lastIndexOf('/'));
      const chapterNumber = getChapterNumber(conceptMapPath);
      const chapterTitle = getChapterTitle(conceptMapPath);
      
      for (const { file: questionFile, order } of questionFiles) {
        try {
          const questionPath = `${conceptMapDir}/${questionFile}`;
          const questionData = await compiledContentService.getYaml(questionPath);
          
          // Add metadata to match the old questions.json format
          const enrichedQuestion = {
            ...questionData,
            chapter: chapterNumber,
            chapterTitle: chapterTitle,
            id: `ch${chapterNumber}-${questionFile.replace('.yml', '')}`,
            conceptMapPath: conceptMapPath,
            questionFile: questionFile,
            order: order  // Add order from concept map
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
  
  // Sort questions by chapter and then by concept map order
  allQuestions.sort((a, b) => {
    if (a.chapter !== b.chapter) {
      return a.chapter - b.chapter;
    }
    return a.order - b.order;
  });
  
  console.log(`Loaded ${allQuestions.length} questions from ${conceptMapPaths.length} concept maps`);
  return allQuestions;
};
