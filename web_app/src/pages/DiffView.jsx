import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Button, 
  Text, 
  Center, 
  Loader, 
  Badge, 
  Group,
  ScrollArea,
  Tooltip,
  Code,
  ActionIcon,
  Divider,
  Title
} from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { IconPlus, IconMinus, IconEqual, IconDownload, IconCopy, IconChevronLeft, IconRefresh } from '@tabler/icons-react';
import * as Diff from 'diff';

// Constants for styling
const LINE_HEIGHT = 24; // pixels

// Function to safely get references to DOM scrollable elements from Mantine ScrollArea
const getScrollableElement = (ref) => {
  if (!ref.current) return null;
  
  // Try different methods to get the scrollable element
  // 1. Direct viewport access
  if (ref.current.viewport) return ref.current.viewport;
  
  // 2. DOM traversal for specific classes/attributes
  const element = ref.current;
  return element.querySelector('.mantine-ScrollArea-viewport') ||
         element.querySelector('[data-scrollable]') ||
         element.querySelector('[data-viewport]') ||
         element;
};

export function DiffView() {
  const { filePathA, filePathB } = useParams();
  const navigate = useNavigate();
  
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diffLines, setDiffLines] = useState({ left: [], right: [], connectors: [] });
  const [diffStats, setDiffStats] = useState({ added: 0, removed: 0, unchanged: 0 });
  
  // Refs for ScrollArea components
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const connectorScrollRef = useRef(null);
  
  // State to track if sync scroll is working
  const [syncScrollActive, setSyncScrollActive] = useState(false);
  
  // Ref to track which side is currently being scrolled
  const isScrollingRef = useRef({
    left: false,
    right: false,
    connector: false
  });
  
  // Get file extension for syntax highlighting
  const getFileExtension = (filePath) => {
    if (!filePath) return '';
    const parts = filePath.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };
  
  // Get file name from path
  const getFileName = (filePath) => {
    if (!filePath) return '';
    return filePath.split('/').pop();
  };
  
  // Get language for syntax highlighting based on file extension
  const getLanguageFromExtension = (extension) => {
    if (!extension) return 'plaintext';
    
    const extensionMap = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'md': 'markdown',
      'sql': 'sql',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sh': 'bash',
      'bash': 'bash',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
    };
    
    return extensionMap[extension.toLowerCase()] || 'plaintext';
  };
  
  const fileExtension = getFileExtension(filePathA || filePathB);
  const fileName = getFileName(filePathA || filePathB);
  const language = getLanguageFromExtension(fileExtension);
  
  // Fetch file contents from the backend
  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Find the file indexes in both directories
        const [filesA, filesB] = await Promise.all([
          fetch('http://localhost:3000/api/files/a').then(res => res.json()),
          fetch('http://localhost:3000/api/files/b').then(res => res.json())
        ]);
        
        console.log('Files found:', {
          filesACount: filesA.length,
          filesBCount: filesB.length
        });
        
        // Find matching files by path
        const fileAIndex = filesA.findIndex(file => file.path === filePathA);
        const fileBIndex = filesB.findIndex(file => file.path === filePathB);
        
        console.log('File indexes:', {
          filePathA,
          filePathB,
          fileAIndex,
          fileBIndex
        });
        
        // If files exist, fetch their contents
        let fileAContents = null;
        let fileBContents = null;
        
        if (fileAIndex !== -1) {
          try {
            const responseA = await fetch(`http://localhost:3000/api/files/a/${fileAIndex}/contents`);
            if (!responseA.ok) {
              throw new Error(`Server returned ${responseA.status}: ${responseA.statusText}`);
            }
            fileAContents = await responseA.json();
          } catch (err) {
            console.error(`Error fetching file A contents:`, err);
            fileAContents = { contents: '', name: filePathA, path: filePathA };
          }
        }
        
        if (fileBIndex !== -1) {
          try {
            const responseB = await fetch(`http://localhost:3000/api/files/b/${fileBIndex}/contents`);
            if (!responseB.ok) {
              throw new Error(`Server returned ${responseB.status}: ${responseB.statusText}`);
            }
            fileBContents = await responseB.json();
          } catch (err) {
            console.error(`Error fetching file B contents:`, err);
            fileBContents = { contents: '', name: filePathB, path: filePathB };
          }
        }
        
        if (!fileAContents && !fileBContents) {
          throw new Error('Could not find files to compare');
        }
        
        // Ensure we have valid objects with contents properties
        fileAContents = fileAContents || { contents: '', name: filePathA, path: filePathA };
        fileBContents = fileBContents || { contents: '', name: filePathB, path: filePathB };
        
        // Ensure contents is always a string
        if (typeof fileAContents.contents !== 'string') fileAContents.contents = '';
        if (typeof fileBContents.contents !== 'string') fileBContents.contents = '';
        
        console.log('File contents retrieved:', {
          fileALength: fileAContents.contents.length,
          fileBLength: fileBContents.contents.length,
        });
        
        setFileA(fileAContents);
        setFileB(fileBContents);
      } catch (err) {
        console.error('Error fetching file contents:', err);
        setError(`Failed to fetch file contents: ${err.message}`);
        setFileA(null);
        setFileB(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (filePathA || filePathB) {
      fetchFiles();
    } else {
      setError('No files selected for comparison');
      setLoading(false);
    }
  }, [filePathA, filePathB]);
  
  // Handle back button click
  const handleBack = () => {
    navigate('/');
  };
  
  // Function to set up scroll synchronization
  const setupScrollSync = useCallback(() => {
    // Add a slight delay to ensure all DOM elements are properly rendered
    setTimeout(() => {
      const leftScrollable = getScrollableElement(leftScrollRef);
      const rightScrollable = getScrollableElement(rightScrollRef);
      const connectorScrollable = getScrollableElement(connectorScrollRef);
      
      if (!leftScrollable || !rightScrollable || !connectorScrollable) {
        console.log('Scrollable elements not found, will retry');
        setSyncScrollActive(false);
        return null;
      }
      
      console.log('Scrollable elements found:', { 
        left: leftScrollable.className || 'element', 
        right: rightScrollable.className || 'element',
        connector: connectorScrollable.className || 'element'
      });
      
      // Function to synchronize left scroll to right and connector scroll
      const syncLeftToRight = () => {
        if (isScrollingRef.current.right || isScrollingRef.current.connector) return;
        
        isScrollingRef.current.left = true;
        
        // Calculate the scroll percentage
        const leftScrollHeight = leftScrollable.scrollHeight;
        const leftClientHeight = leftScrollable.clientHeight;
        const scrollableHeightLeft = leftScrollHeight - leftClientHeight;
        
        if (scrollableHeightLeft <= 0) return;
        
        const scrollPercentage = leftScrollable.scrollTop / scrollableHeightLeft;
        
        // Apply the same percentage to the right side
        const rightScrollHeight = rightScrollable.scrollHeight;
        const rightClientHeight = rightScrollable.clientHeight;
        const scrollableHeightRight = rightScrollHeight - rightClientHeight;
        
        if (scrollableHeightRight > 0) {
          rightScrollable.scrollTop = scrollPercentage * scrollableHeightRight;
        }
        
        // Apply the same percentage to the connector
        const connectorScrollHeight = connectorScrollable.scrollHeight;
        const connectorClientHeight = connectorScrollable.clientHeight;
        const scrollableHeightConnector = connectorScrollHeight - connectorClientHeight;
        
        if (scrollableHeightConnector > 0) {
          connectorScrollable.scrollTop = scrollPercentage * scrollableHeightConnector;
        }
        
        // Reset the scrolling flag after a short delay
        setTimeout(() => {
          isScrollingRef.current.left = false;
        }, 50);
      };
      
      // Function to synchronize right scroll to left and connector scroll
      const syncRightToLeft = () => {
        if (isScrollingRef.current.left || isScrollingRef.current.connector) return;
        
        isScrollingRef.current.right = true;
        
        // Calculate the scroll percentage
        const rightScrollHeight = rightScrollable.scrollHeight;
        const rightClientHeight = rightScrollable.clientHeight;
        const scrollableHeightRight = rightScrollHeight - rightClientHeight;
        
        if (scrollableHeightRight <= 0) return;
        
        const scrollPercentage = rightScrollable.scrollTop / scrollableHeightRight;
        
        // Apply the same percentage to the left side
        const leftScrollHeight = leftScrollable.scrollHeight;
        const leftClientHeight = leftScrollable.clientHeight;
        const scrollableHeightLeft = leftScrollHeight - leftClientHeight;
        
        if (scrollableHeightLeft > 0) {
          leftScrollable.scrollTop = scrollPercentage * scrollableHeightLeft;
        }
        
        // Apply the same percentage to the connector
        const connectorScrollHeight = connectorScrollable.scrollHeight;
        const connectorClientHeight = connectorScrollable.clientHeight;
        const scrollableHeightConnector = connectorScrollHeight - connectorClientHeight;
        
        if (scrollableHeightConnector > 0) {
          connectorScrollable.scrollTop = scrollPercentage * scrollableHeightConnector;
        }
        
        // Reset the scrolling flag after a short delay
        setTimeout(() => {
          isScrollingRef.current.right = false;
        }, 50);
      };
      
      // Function to synchronize connector scroll to left and right scroll
      const syncConnectorToSides = () => {
        if (isScrollingRef.current.left || isScrollingRef.current.right) return;
        
        isScrollingRef.current.connector = true;
        
        // Calculate the scroll percentage
        const connectorScrollHeight = connectorScrollable.scrollHeight;
        const connectorClientHeight = connectorScrollable.clientHeight;
        const scrollableHeightConnector = connectorScrollHeight - connectorClientHeight;
        
        if (scrollableHeightConnector <= 0) return;
        
        const scrollPercentage = connectorScrollable.scrollTop / scrollableHeightConnector;
        
        // Apply the same percentage to the left side
        const leftScrollHeight = leftScrollable.scrollHeight;
        const leftClientHeight = leftScrollable.clientHeight;
        const scrollableHeightLeft = leftScrollHeight - leftClientHeight;
        
        if (scrollableHeightLeft > 0) {
          leftScrollable.scrollTop = scrollPercentage * scrollableHeightLeft;
        }
        
        // Apply the same percentage to the right side
        const rightScrollHeight = rightScrollable.scrollHeight;
        const rightClientHeight = rightScrollable.clientHeight;
        const scrollableHeightRight = rightScrollHeight - rightClientHeight;
        
        if (scrollableHeightRight > 0) {
          rightScrollable.scrollTop = scrollPercentage * scrollableHeightRight;
        }
        
        // Reset the scrolling flag after a short delay
        setTimeout(() => {
          isScrollingRef.current.connector = false;
        }, 50);
      };
      
      // Add event listeners for scroll events
      leftScrollable.addEventListener('scroll', syncLeftToRight);
      rightScrollable.addEventListener('scroll', syncRightToLeft);
      connectorScrollable.addEventListener('scroll', syncConnectorToSides);
      
      // Mark sync as active
      setSyncScrollActive(true);
      
      // Return cleanup function to remove event listeners
      return () => {
        leftScrollable.removeEventListener('scroll', syncLeftToRight);
        rightScrollable.removeEventListener('scroll', syncRightToLeft);
        connectorScrollable.removeEventListener('scroll', syncConnectorToSides);
        setSyncScrollActive(false);
      };
    }, 200); // Small delay to ensure DOM is ready
    
    // Return a no-op cleanup for now
    return () => {};
  }, []);
  
  // Set up scroll synchronization when content loads
  useEffect(() => {
    // Wait for DOM to be ready
    const timeoutId = setTimeout(() => {
      const cleanup = setupScrollSync();
      return () => {
        if (cleanup) cleanup();
      };
    }, 500); // Delay to ensure DOM is ready
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [setupScrollSync, loading, diffLines.left, diffLines.right]);
  
  // Reset scroll sync when window resizes
  useEffect(() => {
    const handleResize = () => {
      const cleanup = setupScrollSync();
      if (cleanup) return cleanup;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setupScrollSync]);
  
  // Function to render a single line with proper styling and syntax highlighting
  const renderLine = (line, index) => {
    let backgroundColor = 'transparent';
    let borderLeftColor = 'transparent';
    let borderLeftWidth = '3px';
    
    // Colors similar to the Meld reference
    if (line.type === 'added') {
      backgroundColor = 'rgba(46, 160, 67, 0.15)';
      borderLeftColor = '#2ea043';
    } else if (line.type === 'removed') {
      backgroundColor = 'rgba(248, 81, 73, 0.15)';
      borderLeftColor = '#f85149';
    }
    
    // Get proper language for syntax highlighting
    const highlightLanguage = getLanguageFromExtension(fileExtension);
    
    return (
      <Box
        key={`${line.number}-${index}`}
        style={{
          minHeight: `${LINE_HEIGHT}px`,
          padding: '0',
          display: 'flex',
          borderLeft: `${borderLeftWidth} solid ${borderLeftColor}`,
          backgroundColor,
          fontFamily: 'monospace',
          fontSize: '13px',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(82, 82, 89, 0.2)'
        }}
      >
        <Box 
          style={{
            userSelect: 'none',
            width: '40px',
            minWidth: '40px',
            textAlign: 'right',
            padding: '0 8px 0 0',
            backgroundColor: '#1E1F22',
            color: '#6C757D',
            fontSize: '12px',
            borderRight: '1px solid #444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: '100%'
          }}
        >
          {line.number}
        </Box>
        
        {line.content === '' ? (
          <Box style={{ 
            flex: 1, 
            lineHeight: `${LINE_HEIGHT}px`, 
            paddingLeft: '8px',
            color: '#6C757D'
          }}>
            {'\u00A0'} {/* Non-breaking space for empty lines */}
          </Box>
        ) : (
          <Box style={{ flex: 1, fontSize: '13px', overflow: 'hidden' }}>
            <CodeHighlight
              code={line.content}
              language={highlightLanguage}
              withCopyButton={false}
              styles={{
                code: {
                  padding: '0 8px',
                  margin: 0,
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'monospace',
                  lineHeight: `${LINE_HEIGHT}px`,
                  fontSize: '13px',
                  height: '100%',
                  whiteSpace: 'pre',
                  display: 'block'
                },
                pre: {
                  padding: 0,
                  margin: 0,
                  background: 'transparent',
                  border: 'none',
                  minHeight: `${LINE_HEIGHT}px`
                }
              }}
            />
          </Box>
        )}
      </Box>
    );
  };
  
  // Process changes into left and right arrays with connection information
  const processChanges = useCallback((changes) => {
    if (!changes || changes.length === 0) return { left: [], right: [], connectors: [] };
    
    console.log('Processing changes:', {
      changesLength: changes.length,
      sampleChange: changes[0]
    });
    
    const left = [];
    const right = [];
    const connectors = [];
    
    let leftLineNumber = 0;
    let rightLineNumber = 0;
    
    // Parse and process each change
    changes.forEach((change) => {
      if (!change || typeof change.value !== 'string') {
        console.log('Skipping invalid change:', change);
        return;
      }
      
      const lines = change.value.split('\n');
      // Remove the last empty line that comes from splitting at newline
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      
      lines.forEach((line) => {
        if (change.added) {
          // Added lines go to the right side
          right.push({
            number: rightLineNumber + 1,
            content: line,
            type: 'added',
            changed: true
          });
          
          // Add a connector for each added line
          if (leftLineNumber > 0) {
            connectors.push({
              leftLine: leftLineNumber - 1, // Connect to previous line on left
              rightLine: rightLineNumber,
              dashed: true,
              type: 'added'
            });
          }
          
          rightLineNumber++;
        } else if (change.removed) {
          // Removed lines go to the left side
          left.push({
            number: leftLineNumber + 1,
            content: line,
            type: 'removed',
            changed: true
          });
          
          // Add a connector for each removed line
          if (rightLineNumber > 0) {
            connectors.push({
              leftLine: leftLineNumber,
              rightLine: rightLineNumber - 1, // Connect to previous line on right
              dashed: true,
              type: 'removed'
            });
          }
          
          leftLineNumber++;
        } else {
          // Unchanged lines go to both sides
          left.push({
            number: leftLineNumber + 1,
            content: line,
            type: 'unchanged',
            changed: false
          });
          
          right.push({
            number: rightLineNumber + 1,
            content: line,
            type: 'unchanged',
            changed: false
          });
          
          // Add a connector for each unchanged line
          connectors.push({
            leftLine: leftLineNumber,
            rightLine: rightLineNumber,
            dashed: false,
            type: 'unchanged'
          });
          
          leftLineNumber++;
          rightLineNumber++;
        }
      });
    });
    
    console.log('Processed result:', {
      leftCount: left.length,
      rightCount: right.length,
      connectorsCount: connectors.length,
      sampleConnector: connectors.length > 0 ? connectors[0] : null
    });
    
    // Calculate stats
    const added = right.filter(line => line.type === 'added').length;
    const removed = left.filter(line => line.type === 'removed').length;
    const unchanged = left.filter(line => line.type === 'unchanged').length;
    
    // Set diff stats
    setDiffStats({ added, removed, unchanged });
    
    return { left, right, connectors };
  }, []);
  
  // Process files and calculate diff
  useEffect(() => {
    if (loading || !fileA || !fileB) return;
    
    try {
      // Extract the content from file objects
      const contentA = typeof fileA.contents === 'string' ? fileA.contents : '';
      const contentB = typeof fileB.contents === 'string' ? fileB.contents : '';
      
      console.log('Processing file contents:', {
        contentALength: contentA.length,
        contentBLength: contentB.length,
        contentASample: contentA.substring(0, 50) + (contentA.length > 50 ? '...' : ''),
        contentBSample: contentB.substring(0, 50) + (contentB.length > 50 ? '...' : '')
      });
      
      // Only proceed if at least one file has content
      if (!contentA && !contentB) {
        console.warn('Both files are empty');
        setDiffLines({ left: [], right: [], connectors: [] });
        setError('No file content available to compare');
        return;
      }
      
      // Calculate the diff using diff library with proper options
      const diff = Diff.diffLines(contentA, contentB, { 
        newlineIsToken: true,
        ignoreWhitespace: false
      });
      
      // Check if diff was successful
      if (!diff || !Array.isArray(diff)) {
        console.error('Invalid diff result:', diff);
        setError('Failed to calculate file differences: Invalid diff result');
        return;
      }
      
      console.log('Diff calculation successful:', {
        diffLength: diff.length,
        diffSample: diff.slice(0, 2)
      });
      
      // Process changes into display format
      const result = processChanges(diff);
      
      // Verify the results have content
      if (!result.left.length && !result.right.length) {
        console.warn('Processed diff has no content');
        setError('No differences found between files');
      } else {
        // Clear any previous errors
        setError(null);
      }
      
      setDiffLines(result);
      
    } catch (err) {
      console.error('Error calculating diff:', err);
      setError(`Failed to calculate file differences: ${err.message || 'Unknown error'}`);
      setDiffLines({ left: [], right: [], connectors: [] });
    }
  }, [fileA, fileB, loading, processChanges]);
  
  // Create a ScrollArea for the connectors that will be synchronized with the content panes
  const renderConnectors = () => {
    // Temporarily use div until we have proper synced scroll metrics
    if (!diffLines.left.length || !diffLines.right.length) {
      return (
        <Box style={{ 
          height: '100%', 
          width: '100%', 
          backgroundColor: '#1a1b1e', 
          borderLeft: '1px solid #2c2e33',
          borderRight: '1px solid #2c2e33'
        }} />
      );
    }

    // Get all pairs that need connectors
    const connectorPairs = diffLines.connectors || [];
    
    // Group connectors by type and proximity to create blobs instead of individual lines
    const groupedConnectors = [];
    let currentGroup = null;
    
    // Only process additions and removals (not unchanged) to reduce visual clutter
    const relevantConnectors = connectorPairs.filter(
      conn => (conn.type === 'added' || conn.type === 'removed') && 
              conn.leftLine !== undefined && 
              conn.rightLine !== undefined
    );
    
    // Group connectors that are close to each other (within 3 lines)
    relevantConnectors.forEach((conn, index) => {
      if (!currentGroup || 
          conn.type !== currentGroup.type || 
          index > 0 && (
            Math.abs(conn.leftLine - relevantConnectors[index-1].leftLine) > 3 ||
            Math.abs(conn.rightLine - relevantConnectors[index-1].rightLine) > 3
          )) {
        // Start a new group
        currentGroup = {
          type: conn.type,
          connectors: [conn],
          minLeftLine: conn.leftLine,
          maxLeftLine: conn.leftLine,
          minRightLine: conn.rightLine,
          maxRightLine: conn.rightLine
        };
        groupedConnectors.push(currentGroup);
      } else {
        // Add to existing group
        currentGroup.connectors.push(conn);
        currentGroup.minLeftLine = Math.min(currentGroup.minLeftLine, conn.leftLine);
        currentGroup.maxLeftLine = Math.max(currentGroup.maxLeftLine, conn.leftLine);
        currentGroup.minRightLine = Math.min(currentGroup.minRightLine, conn.rightLine);
        currentGroup.maxRightLine = Math.max(currentGroup.maxRightLine, conn.rightLine);
      }
    });

    // Return a special version of ScrollArea for the connectors
    return (
      <Box style={{ 
        position: 'relative', 
        height: '100%', 
        backgroundColor: '#1a1b1e',
        borderLeft: '1px solid #2c2e33',
        borderRight: '1px solid #2c2e33',
        overflow: 'hidden'
      }}>
        {/* Color indicators to show overall changes */}
        <Box style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '30px',
          height: 'auto',
          backgroundColor: '#25262b',
          padding: '10px 5px',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          zIndex: 5,
          boxShadow: '0 0 5px rgba(0,0,0,0.3)'
        }}>
          {diffStats.added > 0 && (
            <Tooltip label={`${diffStats.added} lines added`} position="right">
              <Box style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: 'rgba(46, 160, 67, 0.5)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconPlus size={12} color="white" />
              </Box>
            </Tooltip>
          )}
          
          {diffStats.removed > 0 && (
            <Tooltip label={`${diffStats.removed} lines removed`} position="right">
              <Box style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: 'rgba(248, 81, 73, 0.5)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconMinus size={12} color="white" />
              </Box>
            </Tooltip>
          )}
        </Box>
        
        {/* This div acts as placeholder content to match the height of the longest pane */}
        <div style={{ 
          height: Math.max(
            diffLines.left.length * LINE_HEIGHT,
            diffLines.right.length * LINE_HEIGHT
          ),
          position: 'relative'
        }}>
          {/* Connector blobs */}
          {groupedConnectors.map((group, index) => {
            const startY1 = group.minLeftLine * LINE_HEIGHT;
            const startY2 = group.maxLeftLine * LINE_HEIGHT + LINE_HEIGHT;
            const endY1 = group.minRightLine * LINE_HEIGHT;
            const endY2 = group.maxRightLine * LINE_HEIGHT + LINE_HEIGHT;
            
            // Use different styles for different types of connectors
            let fillColor, strokeColor, strokeOpacity;
            
            if (group.type === 'added') {
              fillColor = 'rgba(46, 160, 67, 0.3)';
              strokeColor = '#2ea043';
              strokeOpacity = 0.9;
            } else {
              fillColor = 'rgba(248, 81, 73, 0.3)';
              strokeColor = '#f85149';
              strokeOpacity = 0.9;
            }
            
            // Calculate top position for the SVG
            const topY = Math.min(startY1, endY1);
            const height = Math.max(startY2, endY2) - topY;
            
            // Adjust calculations to make the blobs more cohesive
            // Add some padding to make the blobs larger than the exact lines
            const padding = 3;
            const adjustedStartY1 = startY1 - padding;
            const adjustedStartY2 = startY2 + padding;
            const adjustedEndY1 = endY1 - padding;
            const adjustedEndY2 = endY2 + padding;
            
            return (
              <svg key={index} width="50" height={height + (padding * 2)} 
                style={{ 
                  position: 'absolute', 
                  top: topY - padding,
                  left: 0,
                  overflow: 'visible'
                }}>
                {/* Generate blob shape with smoother curve */}
                <path
                  d={`
                    M 0,${adjustedStartY1 - (topY - padding)}
                    L 0,${adjustedStartY2 - (topY - padding)}
                    C 25,${adjustedStartY2 - (topY - padding)} 25,${adjustedEndY2 - (topY - padding)} 50,${adjustedEndY2 - (topY - padding)}
                    L 50,${adjustedEndY1 - (topY - padding)}
                    C 25,${adjustedEndY1 - (topY - padding)} 25,${adjustedStartY1 - (topY - padding)} 0,${adjustedStartY1 - (topY - padding)}
                    Z
                  `}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  strokeOpacity={strokeOpacity}
                />
              </svg>
            );
          })}
        </div>
      </Box>
    );
  };
  
  return (
    <Box p="md" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Enhanced header with file info and actions */}
      <Paper withBorder p="sm" mb="md" style={{ backgroundColor: '#25262b', borderColor: '#444' }}>
        <Group position="apart">
          <Group>
            <ActionIcon 
              variant="subtle" 
              onClick={handleBack} 
              title="Back to file list"
              color="blue"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            
            <Divider orientation="vertical" />
            
            <Text size="sm" weight={500} color="white">
              {fileName || (filePathA ? getFileName(filePathA) : getFileName(filePathB))}
            </Text>
            
            {fileExtension && (
              <Badge size="xs" variant="filled" color="gray">
                {fileExtension}
              </Badge>
            )}
          </Group>
          
          <Group spacing="xs">
            {!loading && !error && diffLines.left.length > 0 && diffLines.right.length > 0 && (
              <Badge 
                color={syncScrollActive ? 'teal' : 'yellow'} 
                size="xs"
                variant="light"
              >
                {syncScrollActive ? 'SCROLL SYNC ACTIVE' : 'Initializing Sync...'}
              </Badge>
            )}
            <ActionIcon 
              variant="subtle"
              color="blue"
              title="Refresh diff"
              onClick={() => window.location.reload()}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>
      
      {/* File paths and diff stats */}
      {!loading && !error && (diffStats.added > 0 || diffStats.removed > 0 || diffStats.unchanged > 0) && (
        <Paper withBorder p="xs" mb="md" style={{ 
          backgroundColor: '#2C2E33', 
          borderColor: '#444'
        }}>
          <Group position="apart">
            <Group>
              <Box>
                <Text size="xs" color="dimmed">SOURCE</Text>
                <Text size="sm" color="white">
                  {filePathA || "No file"}
                </Text>
              </Box>
              
              <Box mt={10}>
                <IconChevronLeft size={18} color="#666" />
                <IconChevronLeft size={18} color="#666" style={{ marginLeft: -13 }} />
              </Box>
              
              <Box>
                <Text size="xs" color="dimmed">TARGET</Text>
                <Text size="sm" color="white">
                  {filePathB || "No file"}
                </Text>
              </Box>
            </Group>
            
            <Group spacing="xs">
              {diffStats.unchanged > 0 && (
                <Tooltip label="Unchanged lines">
                  <Badge color="blue" leftSection={<IconEqual size={14} />} variant="filled">
                    {diffStats.unchanged}
                  </Badge>
                </Tooltip>
              )}
              {diffStats.added > 0 && (
                <Tooltip label="Added lines">
                  <Badge color="green" leftSection={<IconPlus size={14} />} variant="filled">
                    {diffStats.added}
                  </Badge>
                </Tooltip>
              )}
              {diffStats.removed > 0 && (
                <Tooltip label="Removed lines">
                  <Badge color="red" leftSection={<IconMinus size={14} />} variant="filled">
                    {diffStats.removed}
                  </Badge>
                </Tooltip>
              )}
            </Group>
          </Group>
        </Paper>
      )}
      
      {error && (
        <Paper withBorder p="md" mb="md" style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: '#f44336' }}>
          <Text color="red">{error}</Text>
        </Paper>
      )}
      
      {loading ? (
        <Center style={{ height: 'calc(100% - 40px)' }}>
          <Loader size="xl" />
        </Center>
      ) : (
        <Paper withBorder style={{ 
          height: diffLines.left.length || diffLines.right.length ? 'calc(100% - 140px)' : 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 50px 1fr',
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
                gridTemplateColumns: '1fr 50px 1fr',
                borderBottom: '1px solid #444',
                backgroundColor: '#25262b',
              }}>
                {/* Left file header */}
                <Box p="xs" style={{ 
                  borderRight: '1px solid #444',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Text size="xs" color="dimmed">
                    Source: {filePathA ? getFileName(filePathA) : "No file"}
                  </Text>
                </Box>
                
                {/* Center divider */}
                <Box style={{ backgroundColor: '#2c2e33' }} />
                
                {/* Right file header */}
                <Box p="xs" style={{ 
                  borderLeft: '1px solid #444',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Text size="xs" color="dimmed">
                    Target: {filePathB ? getFileName(filePathB) : "No file"}
                  </Text>
                </Box>
              </div>
              
              {/* Left pane */}
              <ScrollArea 
                style={{ 
                  height: '100%', 
                  backgroundColor: '#1a1b1e',
                  borderRight: '1px solid #333'
                }}
                ref={leftScrollRef}
                scrollbarSize={10}
                offsetScrollbars
                type="auto"
                id="left-pane"
              >
                {diffLines.left.length > 0 ? (
                  diffLines.left.map(renderLine)
                ) : (
                  <Center style={{ height: '100%', padding: '20px' }}>
                    <Text color="dimmed">No content in file A</Text>
                  </Center>
                )}
              </ScrollArea>
              
              {/* Center connector pane */}
              <ScrollArea 
                style={{ 
                  height: '100%', 
                  backgroundColor: '#1a1b1e',
                  overflow: 'hidden'
                }}
                scrollbarSize={0}
                type="auto"
                id="connector-pane"
                ref={connectorScrollRef}
              >
                {renderConnectors()}
              </ScrollArea>
              
              {/* Right pane */}
              <ScrollArea 
                style={{ 
                  height: '100%', 
                  backgroundColor: '#1a1b1e',
                  borderLeft: '1px solid #333'
                }}
                ref={rightScrollRef}
                scrollbarSize={10}
                offsetScrollbars
                type="auto"
                id="right-pane"
              >
                {diffLines.right.length > 0 ? (
                  diffLines.right.map(renderLine)
                ) : (
                  <Center style={{ height: '100%', padding: '20px' }}>
                    <Text color="dimmed">No content in file B</Text>
                  </Center>
                )}
              </ScrollArea>
            </>
          ) : !error && (
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
      )}
    </Box>
  );
}

export default DiffView; 