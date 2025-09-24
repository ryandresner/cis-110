import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import ExamQuestions from './ExamQuestions';
import VocabList from './VocabList';
import ConceptMap from './ConceptMap';
import YouTube from './YouTube';
import { getAssetUrl } from '../utils/paths';
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
      
      // Enhanced parsing to handle quoted values with spaces
      const regex = /(\w+):\s*("[^"]*"|'[^']*'|\S+)/g;
      let match;
      
      while ((match = regex.exec(propsStr)) !== null) {
        const key = match[1];
        let value = match[2];
        
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        props[key] = value;
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
  const markdownUrl = getAssetUrl(`textbook/${textbookPath}.md`);

  useEffect(() => {
    const fetchMarkdown = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        let attemptedUrls = [];
        
        // For 'index' path, try /textbook/index.md directly
        if (textbookPath === 'index') {
          const url = getAssetUrl(`textbook/index.md`);
          attemptedUrls.push(url);
          response = await fetch(url);
        } else {
          // Strategy: Try multiple URL patterns to handle both folder and direct file links
          // Try direct file first (more common), then folder with index.md
          const urlsToTry = [
            getAssetUrl(`textbook/${textbookPath}.md`),         // For direct file links like /textbook/content/overviews/01-hardware-how-we-got-physics-to-do-math-r
            getAssetUrl(`textbook/${textbookPath}/index.md`)   // For folder-style links like /textbook/hardware
          ];
          
          // Try each URL until we find one that works
          for (const url of urlsToTry) {
            attemptedUrls.push(url);
            console.log(`Trying to fetch: ${url}`);
            response = await fetch(url);
            console.log(`Response for ${url}:`, response.status, response.ok);
            
            if (response.ok) {
              // Check if we got HTML instead of markdown (happens when file doesn't exist)
              const text = await response.text();
              if (text.trim().startsWith('<!doctype html>') || text.trim().startsWith('<html')) {
                console.log(`Got HTML response for ${url}, trying next URL...`);
                continue; // Try the next URL
              }
              console.log(`Successfully found content at: ${url}`);
              response.text = () => Promise.resolve(text); // Cache the text we already read
              break;
            }
          }
        }

        if (!response || !response.ok) {
          throw new Error(`Textbook page not found. Tried: ${attemptedUrls.join(', ')}`);
        }

        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [textbookPath, markdownUrl]);

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
