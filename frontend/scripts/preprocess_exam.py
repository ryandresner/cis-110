#!/usr/bin/env python3
"""
Script to preprocess exam videos: download transcript and create student page.

Usage:
    python scripts/preprocess_exam.py YT_URL QUARTER STUDENT_SLUG
    
Example:
    python scripts/preprocess_exam.py https://youtu.be/5Bd_onCysfw w26 alex-d
"""

import argparse
import sys
import re
import json
from pathlib import Path
from youtube_transcript_api import YouTubeTranscriptApi


def extract_video_id(url):
    """
    Extract video ID from a YouTube URL.
    Supports formats:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - VIDEO_ID (if just the ID is provided)
    """
    # Pattern for youtube.com/watch?v=VIDEO_ID
    pattern1 = r'(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})'
    # Pattern for youtu.be/VIDEO_ID
    pattern2 = r'(?:youtu\.be\/)([a-zA-Z0-9_-]{11})'
    
    match = re.search(pattern1, url)
    if match:
        return match.group(1)
    
    match = re.search(pattern2, url)
    if match:
        return match.group(1)
    
    # If it's already just the video ID (11 characters)
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
    
    return None


def fetch_transcript(video_url):
    """
    Fetch and return the transcript for a given YouTube video.
    
    Args:
        video_url: YouTube URL or video ID
    
    Returns:
        Raw transcript data (list of dicts with 'text', 'start', 'duration')
    """
    # Extract video ID from URL
    video_id = extract_video_id(video_url)
    
    if not video_id:
        raise ValueError(f"Could not extract video ID from: {video_url}")
    
    print(f"Fetching transcript for video ID: {video_id}")
    
    # Create API instance and fetch transcript
    ytt_api = YouTubeTranscriptApi()
    transcript_obj = ytt_api.fetch(video_id)
    
    return transcript_obj.to_raw_data()


def save_transcript(transcript_data, quarter, student_slug, base_path):
    """
    Save transcript data to JSON file.
    
    Args:
        transcript_data: Transcript data to save
        quarter: Quarter identifier (e.g., 'w26')
        student_slug: Student identifier (e.g., 'alex-d')
        base_path: Base path to the public directory
    """
    # Create transcripts directory structure
    transcript_dir = base_path / 'transcripts' / quarter
    transcript_dir.mkdir(parents=True, exist_ok=True)
    
    # Save transcript JSON
    transcript_file = transcript_dir / f'{student_slug}.json'
    with open(transcript_file, 'w', encoding='utf-8') as f:
        json.dump(transcript_data, f, indent=2)
    
    print(f"✓ Transcript saved to: {transcript_file}")
    return transcript_file


def create_student_page(video_url, quarter, student_slug, base_path):
    """
    Create student exam page with ExamBrowser component.
    
    Args:
        video_url: YouTube URL
        quarter: Quarter identifier (e.g., 'w26')
        student_slug: Student identifier (e.g., 'alex-d')
        base_path: Base path to the public directory
    """
    # Create student directory structure
    student_dir = base_path / 'textbook' / 'students' / quarter / student_slug
    student_dir.mkdir(parents=True, exist_ok=True)
    
    # Create markdown content with ExamBrowser component
    transcript_path = f'/transcripts/{quarter}/{student_slug}.json'
    markdown_content = f'\n\n{{{{ExamBrowser:{video_url} transcript_json:"{transcript_path}" }}}}\n'
    
    # Save markdown file
    markdown_file = student_dir / f'{student_slug}.md'
    with open(markdown_file, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"✓ Student page created at: {markdown_file}")
    return markdown_file


def main():
    parser = argparse.ArgumentParser(
        description='Preprocess exam video: download transcript and create student page',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "https://www.youtube.com/watch?v=dQw4w9WgXcQ" w26 jenna
  %(prog)s "https://youtu.be/5Bd_onCysfw" w26 alex-d
        """
    )
    
    parser.add_argument(
        'url',
        help='YouTube video URL or video ID'
    )
    
    parser.add_argument(
        'quarter',
        help='Quarter identifier (e.g., w26, s26)'
    )
    
    parser.add_argument(
        'student_slug',
        help='Student identifier/slug (e.g., jenna, alex-d)'
    )
    
    parser.add_argument(
        '--base-path',
        type=Path,
        default=Path(__file__).parent.parent / 'public',
        help='Base path to the public directory (default: ../public relative to script)'
    )
    
    args = parser.parse_args()
    
    try:
        print(f"\n📺 Processing exam for {args.student_slug} ({args.quarter})")
        print(f"   Video: {args.url}\n")
        
        # Fetch transcript
        print("⏳ Fetching transcript...")
        transcript_data = fetch_transcript(args.url)
        print(f"✓ Retrieved {len(transcript_data)} transcript segments\n")
        
        # Save transcript
        print("💾 Saving transcript...")
        save_transcript(transcript_data, args.quarter, args.student_slug, args.base_path)
        print()
        
        # Create student page
        print("📄 Creating student page...")
        create_student_page(args.url, args.quarter, args.student_slug, args.base_path)
        print()
        
        print("✅ Done! You can now view the page at:")
        print(f"   /textbook/students/{args.quarter}/{args.student_slug}/{args.student_slug}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
