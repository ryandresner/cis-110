import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getAssetUrl } from '../utils/paths';
import './WikiPage.css';

// Custom link component for internal wiki links
function WikiLink({ href, children, ...props }) {
  const navigate = useNavigate();
  
  // Check if this is an internal wiki link
  const isInternalWikiLink = href && href.startsWith('/wiki');
  
  if (isInternalWikiLink) {
    return (
      <a
        {...props}
        href={href}
        onClick={(e) => {
          e.preventDefault();
          navigate(href);
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

function WikiPage() {
  const { '*': path } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default to index if no path provided
  const wikiPath = path || 'index';
  const markdownUrl = getAssetUrl(`wiki/${wikiPath}.md`);

  useEffect(() => {
    const fetchMarkdown = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        let attemptedUrls = [];
        
        // For 'index' path, try /wiki/index.md directly
        if (wikiPath === 'index') {
          const url = getAssetUrl(`wiki/index.md`);
          attemptedUrls.push(url);
          response = await fetch(url);
        } else {
          // Strategy: Try multiple URL patterns to handle both folder and direct file links
          // Try direct file first (more common), then folder with index.md
          const urlsToTry = [
            getAssetUrl(`wiki/${wikiPath}.md`),         // For direct file links like /wiki/content/overviews/01-hardware-how-we-got-physics-to-do-math-r
            getAssetUrl(`wiki/${wikiPath}/index.md`)   // For folder-style links like /wiki/hardware
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
          throw new Error(`Wiki page not found. Tried: ${attemptedUrls.join(', ')}`);
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
  }, [wikiPath, markdownUrl]);

  if (loading) {
    return (
      <div className="wiki-page loading">
        <div className="wiki-header">
          <Link to="/wiki" className="wiki-home-link">← Wiki Home</Link>
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wiki-page error">
        <div className="wiki-header">
          <Link to="/wiki" className="wiki-home-link">← Wiki Home</Link>
          <h1>Page Not Found</h1>
        </div>
        <div className="wiki-content">
          <p>The requested wiki page could not be found.</p>
          <p><strong>Path:</strong> {wikiPath}</p>
          <p><strong>Error:</strong> {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wiki-page">
      <div className="wiki-header">
        <Link to="/wiki" className="wiki-home-link">← Wiki Home</Link>
        <div className="wiki-breadcrumb">
          <span>Wiki</span>
          {wikiPath !== 'index' && (
            <span> / {wikiPath.replace(/\//g, ' / ')}</span>
          )}
        </div>
      </div>
      
      <div className="wiki-content">
        <ReactMarkdown 
          components={{
            a: WikiLink
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default WikiPage;
