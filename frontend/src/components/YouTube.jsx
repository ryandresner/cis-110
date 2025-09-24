import React from 'react';
import './YouTube.css';

function YouTube({ url, title, width = 560, height = 315 }) {
  // Extract video ID from various YouTube URL formats
  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return (
      <div className="youtube-error">
        <p>Invalid YouTube URL: {url}</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="youtube-container">
      <iframe
        width={width}
        height={height}
        src={embedUrl}
        title={title || "YouTube video player"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      {title && <p className="youtube-caption">{title}</p>}
    </div>
  );
}

export default YouTube;