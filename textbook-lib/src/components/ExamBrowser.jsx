import React, { useRef, useEffect, useState } from 'react';
import { getAssetUrl } from '../utils/paths';
import './ExamBrowser.css';

function ExamBrowser({ url, title, transcript, transcript_json, currentPath }) {
  const iframeRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize transcript from prop or fetch from file
  useEffect(() => {
    const loadTranscript = async () => {
      const transcriptSource = transcript_json || transcript;
      if (!transcriptSource) return;

      try {
        // Check if it's a file path (starts with ./ or / or contains .txt/.json)
        const isFilePath = typeof transcriptSource === 'string' && 
          (transcriptSource.startsWith('./') || 
           transcriptSource.startsWith('/') ||
           transcriptSource.endsWith('.txt') ||
           transcriptSource.endsWith('.json'));

        if (isFilePath) {
          setLoading(true);
          setError(null);
          
          // Construct the fetch URL
          let fetchUrl;
          if (transcriptSource.startsWith('/')) {
            // Absolute path from root - use directly (e.g., /transcripts/file.json)
            fetchUrl = transcriptSource;
          } else if (transcriptSource.startsWith('./')) {
            // Relative path - resolve relative to current page in the textbook directory
            const directoryPath = currentPath && currentPath.includes('.') ? 
              currentPath.split('/').slice(0, -1).join('/') : 
              currentPath;
            const relativePath = transcriptSource.substring(2);
            const fullPath = directoryPath ? 
              `textbook/${directoryPath}/${relativePath}` : 
              `textbook/${relativePath}`;
            fetchUrl = getAssetUrl(fullPath);
          } else {
            // Relative to textbook directory
            fetchUrl = getAssetUrl(`textbook/${transcriptSource}`);
          }

          console.log('ExamBrowser: Fetching transcript from:', fetchUrl);
          const response = await fetch(fetchUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to load transcript: ${response.statusText}`);
          }
          
          const text = await response.text();
          const data = JSON.parse(text);
          setTranscriptData(data);
          setLoading(false);
        } else {
          // It's direct JSON data
          const data = typeof transcriptSource === 'string' ? 
            JSON.parse(transcriptSource) : 
            transcriptSource;
          setTranscriptData(data);
        }
      } catch (e) {
        console.error('Failed to load transcript:', e);
        setError(e.message);
        setLoading(false);
      }
    };

    loadTranscript();
  }, [transcript, transcript_json, currentPath]);

  // Extract video ID from various YouTube URL formats
  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return (
      <div className="exam-browser-error">
        <p>Invalid YouTube URL: {url}</p>
      </div>
    );
  }

  // Format seconds to timestamp string
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Send command to YouTube player
  const sendPlayerCommand = (command, args = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const message = {
        event: 'command',
        func: command,
        args: args
      };
      
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify(message),
        'https://www.youtube.com'
      );
    }
  };

  // Playback controls
  const handlePlayPause = () => {
    if (isPlaying) {
      sendPlayerCommand('pauseVideo');
    } else {
      sendPlayerCommand('playVideo');
    }
  };

  const handleSeek = (seconds) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    sendPlayerCommand('seekTo', [newTime, true]);
  };

  const handlePlaybackSpeed = (speed) => {
    sendPlayerCommand('setPlaybackRate', [speed]);
  };

  const handleSeekToTime = (seconds) => {
    sendPlayerCommand('seekTo', [seconds, true]);
  };

  // Listen to player state messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = JSON.parse(event.data);
        
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) {
            setCurrentTime(data.info.currentTime);
          }
          if (data.info.duration !== undefined) {
            setDuration(data.info.duration);
          }
          if (data.info.playerState !== undefined) {
            // 1 = playing, 2 = paused
            setIsPlaying(data.info.playerState === 1);
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Enable YouTube API when iframe loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        // Enable API by sending a listening message
        iframe.contentWindow.postMessage(
          '{"event":"listening","id":"ytplayer"}',
          'https://www.youtube.com'
        );
        setIsPlayerReady(true);
      };

      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, []);

  // Build embed URL with API enabled
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`;

  return (
    <div className="exam-browser">
      <div className="exam-browser-header">
        <h3 className="exam-browser-title">
          {title || "Student Exam Recording"}
        </h3>
        <div className="exam-browser-info">
          <span className="exam-browser-badge">Exam Footage</span>
        </div>
      </div>

      <div className="exam-browser-player">
        <iframe
          ref={iframeRef}
          width="100%"
          height="450"
          src={embedUrl}
          title={title || "Student exam recording"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      
      <div className="exam-browser-controls">
        <div className="exam-browser-timeline">
          <span className="time-display">{formatTime(currentTime)}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="time-display">{formatTime(duration)}</span>
        </div>

        <div className="exam-browser-buttons">
          <div className="control-group">
            <button 
              className="control-button"
              onClick={() => handleSeek(-10)}
              title="Rewind 10 seconds"
            >
              ⏪ 10s
            </button>
            <button 
              className="control-button play-pause"
              onClick={handlePlayPause}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button 
              className="control-button"
              onClick={() => handleSeek(10)}
              title="Forward 10 seconds"
            >
              10s ⏩
            </button>
          </div>

          <div className="control-group speed-controls">
            <span className="control-label">Speed:</span>
            <button 
              className="control-button speed-button"
              onClick={() => handlePlaybackSpeed(0.5)}
              title="0.5x speed"
            >
              0.5x
            </button>
            <button 
              className="control-button speed-button"
              onClick={() => handlePlaybackSpeed(1)}
              title="Normal speed"
            >
              1x
            </button>
            <button 
              className="control-button speed-button"
              onClick={() => handlePlaybackSpeed(1.5)}
              title="1.5x speed"
            >
              1.5x
            </button>
            <button 
              className="control-button speed-button"
              onClick={() => handlePlaybackSpeed(2)}
              title="2x speed"
            >
              2x
            </button>
          </div>
        </div>
      </div>

      <div className="exam-browser-notes">
        <p>
          💡 <strong>Tip:</strong> Use the playback controls to review specific sections of the exam.
          Adjust the speed to analyze responses more carefully or skip through quickly.
        </p>
      </div>

      {/* Transcript Section */}
      {loading && (
        <div className="exam-browser-transcript">
          <div className="transcript-loading">Loading transcript...</div>
        </div>
      )}
      
      {error && (
        <div className="exam-browser-transcript">
          <div className="transcript-error">Error loading transcript: {error}</div>
        </div>
      )}
      
      {transcriptData && !loading && !error && (
        <div className="exam-browser-transcript">
          <div className="transcript-header">
            <h4>Transcript</h4>
            <span className="transcript-count">
              {transcriptData.length} segments
            </span>
          </div>

          <div className="transcript-content">
            {transcriptData.map((item, index) => (
              <div 
                key={index} 
                className={`transcript-item ${Math.abs(currentTime - item.start) < 2 ? 'active' : ''}`}
              >
                <button
                  className="transcript-timestamp"
                  onClick={() => handleSeekToTime(item.start)}
                  title={`Jump to ${formatTime(item.start)}`}
                >
                  {formatTime(item.start)}
                </button>
                <span className="transcript-text">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamBrowser;
