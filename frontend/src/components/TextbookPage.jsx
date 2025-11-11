import remarkGfm from 'remark-gfm';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import ExamQuestions from './ExamQuestions';
import VocabList from './VocabList';
import ConceptMap from './ConceptMap';
import YouTube from './YouTube';
import { getAssetUrl } from '../utils/paths';
import compiledContentService from '../services/compiledContentService';
import './TextbookPage.css';

// Custom link component for internal textbook links
function TextbookLink({ href, children, currentPath, ...props }) {
  const navigate = useNavigate();
  
  if (!href) {
    return <a {...props}>{children}</a>;
  }
  
  // Handle external links (http, https, mailto, etc.)
  if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) {
    return (
      <a href={href} {...props} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  
  // Check if this is an internal textbook link (absolute) or old wiki link
  const isAbsoluteInternalLink = href.startsWith('/textbook') || href.startsWith('/wiki');
  
  // Check if this is a relative link (doesn't start with / or protocol)
  const isRelativeLink = !href.startsWith('/') && !href.includes('://');
  
  if (isAbsoluteInternalLink || isRelativeLink) {
    let finalHref;
    
    if (isAbsoluteInternalLink) {
      // Convert old wiki links to textbook links
      finalHref = href.startsWith('/wiki') ? href.replace('/wiki', '/textbook') : href;
    } else if (isRelativeLink) {
      // Resolve relative link based on current path
      const currentDir = currentPath === 'index' ? '' : currentPath;
      const basePath = currentDir ? `/textbook/${currentDir}` : '/textbook';
      finalHref = `${basePath}/${href}`;
    }
    
    return (
      <a
        {...props}
        href={finalHref}
        onClick={(e) => {
          e.preventDefault();
          navigate(finalHref);
        }}
        style={{ cursor: 'pointer' }}
      >
        {children}
      </a>
    );
  }
  
  // For external links, use normal anchor tag
  return (
    <a href={href} {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

// Function to render content with custom components
function renderContentWithComponents(content, textbookPath) {
  console.log('renderContentWithComponents called with content:', content.substring(0, 200) + '...');
  console.log('textbookPath:', textbookPath);
  
  // Look for component markers with optional props
  const combinedRegex = /\{\{(ExamQuestions|VocabList|ConceptMap|YouTube):([^}\s]+)([^}]*)\}\}/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = combinedRegex.exec(content)) !== null) {
    const componentType = match[1];
    const fileName = match[2];
    const propsString = match[3] ? match[3].trim() : '';
    console.log(`Found ${componentType} marker:`, match[0], 'File:', fileName, 'Props:', propsString);
    
    // Parse props from the props string
    const parseProps = (propsStr) => {
      const props = {};
      if (!propsStr) return props;
      
      // Enhanced parsing to handle quoted values, arrays, and other JSON values
      const regex = /(\w+):\s*(\[[^\]]*\]|"[^"]*"|'[^']*'|\S+)/g;
      let match;
      
      while ((match = regex.exec(propsStr)) !== null) {
        const key = match[1];
        let value = match[2];
        
        // Handle arrays (JSON format)
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            props[key] = JSON.parse(value);
          } catch (error) {
            console.error(`Failed to parse array for ${key}:`, value, error);
            props[key] = value; // fallback to string
          }
        }
        // Handle quoted strings
        else if ((value.startsWith('"') && value.endsWith('"')) || 
                 (value.startsWith("'") && value.endsWith("'"))) {
          props[key] = value.slice(1, -1);
        }
        // Handle other values (strings, numbers, booleans)
        else {
          // Try to parse as JSON for numbers, booleans, etc.
          try {
            props[key] = JSON.parse(value);
          } catch {
            // If JSON parsing fails, keep as string
            props[key] = value;
          }
        }
      }
      
      return props;
    };
    
    const additionalProps = parseProps(propsString);
    
    // Add markdown content before the component
    if (match.index > lastIndex) {
      const markdownContent = content.slice(lastIndex, match.index);
      parts.push(
        <ReactMarkdown 
          key={`md-${parts.length}`}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: (props) => <TextbookLink {...props} currentPath={textbookPath} />
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      );
    }
    
    // Add the appropriate component
    if (componentType === 'ExamQuestions') {
      parts.push(
        <ExamQuestions 
          key={`eq-${parts.length}`}
          yamlPath={fileName} 
          currentPath={textbookPath}
          {...additionalProps}
        />
      );
    } else if (componentType === 'VocabList') {
      parts.push(
        <VocabList 
          key={`vl-${parts.length}`}
          yamlPath={fileName} 
          currentPath={textbookPath}
          {...additionalProps}
        />
      );
    } else if (componentType === 'ConceptMap') {
      console.log('Creating ConceptMap component with props:', { yamlPath: fileName, currentPath: textbookPath, ...additionalProps });
      parts.push(
        <ConceptMap 
          key={`cm-${parts.length}`}
          yamlPath={fileName} 
          currentPath={textbookPath}
          {...additionalProps}
        />
      );
    } else if (componentType === 'YouTube') {
      parts.push(
        <YouTube 
          key={`yt-${parts.length}`}
          url={fileName}
          {...additionalProps}
        />
      );
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining markdown content
  if (lastIndex < content.length) {
    const remainingContent = content.slice(lastIndex);
    parts.push(
      <ReactMarkdown 
        key={`md-${parts.length}`}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: (props) => <TextbookLink {...props} currentPath={textbookPath} />
        }}
      >
        {remainingContent}
      </ReactMarkdown>
    );
  }
  
  console.log('renderContentWithComponents: parts.length =', parts.length);
  
  return parts.length > 0 ? parts : [
    <ReactMarkdown 
      key="default"
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        a: (props) => <TextbookLink {...props} currentPath={textbookPath} />
      }}
    >
      {content}
    </ReactMarkdown>
  ];
}

function TextbookPage() {
  const { '*': path } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default to index if no path provided
  const textbookPath = path || 'index';

  useEffect(() => {
    const fetchMarkdown = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let text;
        
        // For 'index' path, try index.md directly
        if (textbookPath === 'index') {
          text = await compiledContentService.getText('index.md');
        } else {
          // Strategy: Try multiple path patterns to handle both folder and direct file links
          const pathsToTry = [
            `${textbookPath}.md`,         // For direct file links
            `${textbookPath}/index.md`    // For folder-style links
          ];
          
          const result = await compiledContentService.getTextFromMultiplePaths(pathsToTry);
          text = result.text;
        }

        setContent(text);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [textbookPath]);

  if (loading) {
    return (
      <div className="textbook-page loading">
        <div className="textbook-header">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="textbook-page error">
        <div className="textbook-header">
          <h1>Page Not Found</h1>
        </div>
        <div className="textbook-content">
          <p>The requested textbook page could not be found.</p>
          <p><strong>Path:</strong> {textbookPath}</p>
          <p><strong>Error:</strong> {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="textbook-page">
      <div className="textbook-header">
        <div className="textbook-breadcrumb">
          <span>Textbook</span>
          {textbookPath !== 'index' && (
            <span> / {textbookPath.replace(/\//g, ' / ')}</span>
          )}
        </div>
      </div>
      
      <div className="textbook-content">
        {renderContentWithComponents(content, textbookPath)}
      </div>
    </div>
  );
}

export default TextbookPage;
