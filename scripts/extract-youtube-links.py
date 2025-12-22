#!/usr/bin/env python3
"""
Extract YouTube links and titles from Chrome bookmarks HTML export.
Specifically looks for links in the "CIS 110" folder.
"""

from html.parser import HTMLParser
import sys

class BookmarkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_cis110 = False
        self.in_cis110_dl = 0
        self.youtube_links = []
        self.current_link = None
        self.current_title = ""
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        # Check if we're entering the CIS 110 section
        if tag == 'h3':
            self.current_title = ""
            
        # Track DL depth when in CIS 110 section
        if self.in_cis110 and tag == 'dl':
            self.in_cis110_dl += 1
            
        # Check for anchor tags with YouTube links
        if tag == 'a' and self.in_cis110:
            href = attrs_dict.get('href', '')
            if 'youtube.com' in href or 'youtu.be' in href:
                self.current_link = href
                self.current_title = ""
    
    def handle_endtag(self, tag):
        # Exit CIS 110 section when we close its DL
        if self.in_cis110 and tag == 'dl':
            self.in_cis110_dl -= 1
            if self.in_cis110_dl == 0:
                self.in_cis110 = False
        
        # Save the YouTube link when anchor closes
        if tag == 'a' and self.current_link:
            self.youtube_links.append({
                'url': self.current_link,
                'title': self.current_title.strip()
            })
            self.current_link = None
            self.current_title = ""
    
    def handle_data(self, data):
        data = data.strip()
        
        # Check if this is the CIS 110 heading
        if data == "CIS 110" and not self.in_cis110:
            self.in_cis110 = True
            self.in_cis110_dl = 0
        
        # Collect title text for current link
        if self.current_link is not None:
            self.current_title += data

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract-youtube-links.py <bookmarks.html>")
        sys.exit(1)
    
    bookmarks_file = sys.argv[1]
    
    with open(bookmarks_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    parser = BookmarkParser()
    parser.feed(html_content)
    
    print(f"Found {len(parser.youtube_links)} YouTube videos in CIS 110 folder:\n")
    
    for i, video in enumerate(parser.youtube_links, 1):
        print(f"{i}. {video['title']}")
        print(f"   {video['url']}")
        print()

if __name__ == '__main__':
    main()
