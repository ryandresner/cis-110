#!/usr/bin/env python3
"""
Add YouTube video URLs to question YAML files based on the pairing file.
The new video will be added as the first item in the example_videos list.
"""

import re
from pathlib import Path

def parse_pairings_file(filepath):
    """Parse the video-question-pairs.txt file and return a dict mapping question paths to video URLs."""
    pairings = {}
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Match each numbered entry
    pattern = r'\d+\.\s+([^\n]+)\n\s+Video:\s+(https://[^\n]+)\n\s+Question:\s+([^\n]+)'
    matches = re.findall(pattern, content)
    
    for title, video_url, question_path in matches:
        pairings[question_path.strip()] = video_url.strip()
    
    return pairings

def add_video_to_yaml(yaml_file_path, video_url):
    """Add video URL to the example_videos list in a YAML file, placing it first."""
    
    # Read the file content
    with open(yaml_file_path, 'r') as f:
        lines = f.readlines()
    
    # Find example_videos section
    example_videos_line = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('example_videos:'):
            example_videos_line = i
            break
    
    # Check if video already exists
    file_content = ''.join(lines)
    if video_url in file_content:
        print(f"  Video already exists in {yaml_file_path}")
        return False
    
    if example_videos_line == -1:
        # No example_videos section - add it at the end
        # Remove trailing whitespace from last line if present
        if lines and lines[-1].strip() == '':
            lines = lines[:-1]
        
        lines.append('example_videos:\n')
        lines.append(f'  - "{video_url}"\n')
    else:
        # example_videos exists - insert as first item
        # Find the indentation level of the existing items
        indent = '  '  # default
        for i in range(example_videos_line + 1, len(lines)):
            line = lines[i]
            if line.strip().startswith('- '):
                # Found an existing item, get its indentation
                indent = line[:len(line) - len(line.lstrip())]
                break
            elif line.strip() and not line.strip().startswith('#'):
                # Hit a different section
                break
        
        # Insert new video as first item right after example_videos:
        lines.insert(example_videos_line + 1, f'{indent}- "{video_url}"\n')
    
    # Write back to file
    with open(yaml_file_path, 'w') as f:
        f.writelines(lines)
    
    return True

def main():
    # Paths
    base_dir = Path('/home/stephen/Dev/current/cis-110')
    pairings_file = base_dir / 'scripts' / 'video-question-pairs.txt'
    content_base = base_dir / 'frontend' / 'public' / 'textbook' / 'content' / 'overviews'
    
    # Parse pairings
    print("Parsing video-question pairings...")
    pairings = parse_pairings_file(pairings_file)
    print(f"Found {len(pairings)} video-question pairs\n")
    
    # Process each pairing
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for question_path, video_url in pairings.items():
        # Construct full file path
        yaml_file = content_base / question_path
        
        if not yaml_file.exists():
            print(f"❌ File not found: {yaml_file}")
            error_count += 1
            continue
        
        print(f"Processing: {question_path}")
        print(f"  Adding video: {video_url}")
        
        if add_video_to_yaml(yaml_file, video_url):
            print(f"  ✅ Updated successfully")
            updated_count += 1
        else:
            print(f"  ⏭️  Skipped (already exists)")
            skipped_count += 1
        print()
    
    # Summary
    print("=" * 60)
    print(f"Summary:")
    print(f"  ✅ Updated: {updated_count} files")
    print(f"  ⏭️  Skipped: {skipped_count} files")
    print(f"  ❌ Errors: {error_count} files")
    print(f"  Total processed: {len(pairings)} pairs")

if __name__ == '__main__':
    main()
