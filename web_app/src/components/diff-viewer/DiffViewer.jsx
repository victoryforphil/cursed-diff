import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, ScrollArea, Center, Text } from '@mantine/core';
import { DiffPane } from './DiffPane';
import { DiffConnector } from './DiffConnector';

// Constants for styling
const LINE_HEIGHT = 24; // pixels

/**
 * Get the scrollable element from a Mantine ScrollArea ref
 */
const getScrollableElement = (ref) => {
  if (!ref.current) return null;
  
  // Try different methods to get the scrollable element
  if (ref.current.viewport) return ref.current.viewport;
  
  const element = ref.current;
  return element.querySelector('.mantine-ScrollArea-viewport') ||
         element.querySelector('[data-scrollable]') ||
         element.querySelector('[data-viewport]') ||
         element;
};

/**
 * DiffViewer - Main component for displaying side-by-side file diffs with synchronization
 * 
 * @param {Object} props
 * @param {Array} props.diffLines - Processed lines for each pane {left, right, connectors}
 * @param {string} props.fileExtension - File extension for syntax highlighting
 * @param {Object} props.diffStats - Statistics about changes
 * @param {string} props.sourceFileName - Display name for the source file
 * @param {string} props.targetFileName - Display name for the target file
 * @param {string} props.error - Error message if any
 * @returns {JSX.Element} - The complete diff viewer component
 */
export function DiffViewer({ 
  diffLines, 
  fileExtension, 
  diffStats,
  sourceFileName,
  targetFileName,
  error
}) {
  // Refs for ScrollArea components
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const connectorScrollRef = useRef(null);
  
  // State to track if sync scroll is working
  const [syncScrollActive, setSyncScrollActive] = useState(false);
  
  // Ref to track which side is currently being scrolled
  const isScrollingRef = useRef({
    source: null,
    scrolling: false,
    animationFrameId: null
  });
  
  // Get language for syntax highlighting based on file extension
  const getLanguageFromExtension = (extension) => {
    if (!extension) return null;
    
    const extensionMap = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'go': 'go',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'rust': 'rust',
      'rs': 'rust',
      'php': 'php',
      'sh': 'bash',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'toml': 'toml',
      'dart': 'dart',
      'kt': 'kotlin',
      'swift': 'swift'
    };
    
    return extensionMap[extension.toLowerCase()] || extension.toLowerCase();
  };
  
  const highlightLanguage = getLanguageFromExtension(fileExtension);
  
  // Set up synchronized scrolling between panes
  useEffect(() => {
    // Initialize refs to DOM elements
    const leftElement = getScrollableElement(leftScrollRef);
    const rightElement = getScrollableElement(rightScrollRef);
    const connectorElement = getScrollableElement(connectorScrollRef);
    
    if (!leftElement || !rightElement || !connectorElement) {
      return;
    }
    
    // Sync is active once all elements are ready
    setSyncScrollActive(true);
    
    // Synchronize scroll position across all panes
    const syncScroll = (source, scrollTop) => {
      if (isScrollingRef.current.scrolling && isScrollingRef.current.source !== source) {
        return;
      }
      
      isScrollingRef.current = {
        source,
        scrolling: true,
        animationFrameId: null
      };
      
      // Use requestAnimationFrame for smoother scrolling
      cancelAnimationFrame(isScrollingRef.current.animationFrameId);
      
      isScrollingRef.current.animationFrameId = requestAnimationFrame(() => {
        if (source !== 'left' && leftElement) {
          leftElement.scrollTop = scrollTop;
        }
        
        if (source !== 'right' && rightElement) {
          rightElement.scrollTop = scrollTop;
        }
        
        if (source !== 'connector' && connectorElement) {
          connectorElement.scrollTop = scrollTop;
        }
        
        // Allow new scroll events after this frame is rendered
        isScrollingRef.current.scrolling = false;
      });
    };
    
    // Event handlers for scroll
    const handleLeftScroll = () => {
      if (leftElement) {
        syncScroll('left', leftElement.scrollTop);
      }
    };
    
    const handleRightScroll = () => {
      if (rightElement) {
        syncScroll('right', rightElement.scrollTop);
      }
    };
    
    const handleConnectorScroll = () => {
      if (connectorElement) {
        syncScroll('connector', connectorElement.scrollTop);
      }
    };
    
    // Add scroll event listeners
    leftElement.addEventListener('scroll', handleLeftScroll, { passive: true });
    rightElement.addEventListener('scroll', handleRightScroll, { passive: true });
    connectorElement.addEventListener('scroll', handleConnectorScroll, { passive: true });
    
    // Handle window resize
    const handleResize = () => {
      // Ensure all panes are at the same scroll position after resize
      if (leftElement && rightElement && connectorElement) {
        const scrollTop = leftElement.scrollTop;
        syncScroll(null, scrollTop);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up event listeners on unmount
    return () => {
      leftElement?.removeEventListener('scroll', handleLeftScroll);
      rightElement?.removeEventListener('scroll', handleRightScroll);
      connectorElement?.removeEventListener('scroll', handleConnectorScroll);
      window.removeEventListener('resize', handleResize);
      
      // Cancel any pending animation frame
      if (isScrollingRef.current.animationFrameId) {
        cancelAnimationFrame(isScrollingRef.current.animationFrameId);
      }
    };
  }, [diffLines]);
  
  // Calculate the max height needed for content
  const contentHeight = Math.max(
    (diffLines.left.length || 0) * LINE_HEIGHT,
    (diffLines.right.length || 0) * LINE_HEIGHT,
    100
  );
  
  if (error) {
    return (
      <Center style={{ height: '200px' }}>
        <Box style={{ textAlign: 'center' }}>
          <Text color="red" size="lg" weight={500}>{error}</Text>
        </Box>
      </Center>
    );
  }
  
  return (
    <Paper withBorder style={{ 
      height: (diffLines.left.length || diffLines.right.length) ? 'calc(100% - 140px)' : 'auto',
      display: 'grid',
      gridTemplateColumns: '1fr 70px 1fr',
      gap: '0',
      backgroundColor: '#1a1b1e',
      overflow: 'hidden',
      borderColor: '#444',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
    }}>
      {(diffLines.left.length > 0 || diffLines.right.length > 0) ? (
        <>
          {/* File headers */}
          <div style={{ 
            gridColumn: '1 / span 3',
            display: 'grid',
            gridTemplateColumns: '1fr 70px 1fr',
            borderBottom: '1px solid #444',
            backgroundColor: '#25262b',
            paddingBottom: '4px',
            marginBottom: '4px'
          }}>
            <Box p="xs" style={{ 
              borderRight: '1px solid #444',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Text size="xs" color="dimmed">
                Source: {sourceFileName}
              </Text>
            </Box>
            <Box style={{ backgroundColor: '#2c2e33' }} />
            <Box p="xs" style={{ 
              borderLeft: '1px solid #444',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Text size="xs" color="dimmed">
                Target: {targetFileName}
              </Text>
            </Box>
          </div>
          
          {/* Left pane */}
          <DiffPane 
            lines={diffLines.left}
            highlightLanguage={highlightLanguage}
            scrollRef={leftScrollRef}
            side="left"
            emptyMessage="No content in source file"
          />
          
          {/* Center connector pane */}
          <ScrollArea
            style={{ 
              height: '100%',
              overflow: 'hidden'
            }}
            scrollbarSize={0}
            type="auto"
            id="connector-pane"
            ref={connectorScrollRef}
          >
            <DiffConnector 
              connectorPairs={diffLines.connectors}
              height={contentHeight}
              diffStats={diffStats}
            />
          </ScrollArea>
          
          {/* Right pane */}
          <DiffPane 
            lines={diffLines.right}
            highlightLanguage={highlightLanguage}
            scrollRef={rightScrollRef}
            side="right"
            emptyMessage="No content in target file"
          />
        </>
      ) : (
        <Center style={{ gridColumn: 'span 3', height: '200px', padding: '20px' }}>
          <Box style={{ textAlign: 'center' }}>
            <Text size="lg" weight={500} color="dimmed">No content to display</Text>
            <Text size="sm" color="dimmed" mt="sm">
              Either the files are empty or no differences were found
            </Text>
          </Box>
        </Center>
      )}
    </Paper>
  );
} 