import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  calculateDiff, 
  processDiffForDisplay, 
  calculateDiffStats, 
  getLanguageFromExtension 
} from './diffUtils';

/**
 * Custom hook for diff viewer functionality
 */
const useDiffViewer = (
  fileA, 
  fileB, 
  filePathA, 
  filePathB, 
  fileExtension
) => {
  const [diffResult, setDiffResult] = useState([]);
  const [processedDiff, setProcessedDiff] = useState({
    leftContent: '',
    rightContent: '',
    leftLines: [],
    rightLines: [],
    changeMap: []
  });
  const [diffStats, setDiffStats] = useState({ added: 0, removed: 0, unchanged: 0 });
  const [highlightedLines, setHighlightedLines] = useState(new Set());
  const [isCalculating, setIsCalculating] = useState(false);
  
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  
  // Get language for syntax highlighting
  const language = useMemo(() => 
    getLanguageFromExtension(fileExtension), [fileExtension]);
  
  // Calculate diff result - runs only when file contents change
  useEffect(() => {
    if (!fileA && !fileB) return;
    
    let isMounted = true;
    setIsCalculating(true);
    
    // Use setTimeout to avoid blocking the UI
    const timer = setTimeout(() => {
      try {
        // Check if the component is still mounted
        if (!isMounted) return;
        
        // Generate a stable version of file contents
        const contentA = fileA?.contents || '';
        const contentB = fileB?.contents || '';
        
        const diff = calculateDiff(
          contentA, 
          contentB,
          { ignoreWhitespace: false }
        );
        
        if (isMounted) {
          setDiffResult(diff);
        }
      } catch (error) {
        console.error('Error calculating diff:', error);
      } finally {
        if (isMounted) {
          setIsCalculating(false);
        }
      }
    }, 0);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fileA?.contents, fileB?.contents]); // Only depend on the contents
  
  // Process diff result for display
  useEffect(() => {
    if (!diffResult || !diffResult.length) return;
    
    let isMounted = true;
    setIsCalculating(true);
    
    // Use setTimeout to avoid blocking the UI
    const timer = setTimeout(() => {
      try {
        if (!isMounted) return;
        
        const processed = processDiffForDisplay(diffResult);
        const stats = calculateDiffStats(diffResult);
        
        if (isMounted) {
          setProcessedDiff(processed);
          setDiffStats(stats);
        }
      } catch (error) {
        console.error('Error processing diff:', error);
      } finally {
        if (isMounted) {
          setIsCalculating(false);
        }
      }
    }, 0);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [diffResult]); // Only depend on diffResult
  
  // Handle line hover
  const handleLineMouseEnter = useCallback((line, side) => {
    // Find corresponding line in the other pane
    const newHighlighted = new Set([line.number]);
    
    const findMatchingLine = (lineNum, side) => {
      const changeIndex = processedDiff.changeMap.findIndex(change => {
        if (side === 'left') {
          return change.left !== null && change.left + 1 === lineNum;
        } else {
          return change.right !== null && change.right + 1 === lineNum;
        }
      });
      
      if (changeIndex !== -1) {
        const change = processedDiff.changeMap[changeIndex];
        if (side === 'left' && change.right !== null) {
          newHighlighted.add(processedDiff.rightLines[change.right].number);
        } else if (side === 'right' && change.left !== null) {
          newHighlighted.add(processedDiff.leftLines[change.left].number);
        }
      }
    };
    
    findMatchingLine(line.number, side);
    setHighlightedLines(newHighlighted);
  }, [processedDiff]);
  
  const handleLineMouseLeave = useCallback(() => {
    setHighlightedLines(new Set());
  }, []);
  
  // Handle synchronized scrolling
  const handleScroll = useCallback((scrollPosition, side) => {
    if (!leftPaneRef.current || !rightPaneRef.current) return;
    
    const targetRef = side === 'left' ? rightPaneRef : leftPaneRef;
    const sourceRef = side === 'left' ? leftPaneRef : rightPaneRef;
    
    const sourceViewport = sourceRef.current.viewport;
    const targetViewport = targetRef.current.viewport;
    
    // Calculate percentage scrolled
    const percentScrolled = scrollPosition.y / (sourceViewport.scrollHeight - sourceViewport.clientHeight);
    
    // Apply scroll to the other pane
    targetViewport.scrollTop = percentScrolled * (targetViewport.scrollHeight - targetViewport.clientHeight);
  }, []);
  
  // Get file status
  const fileStatus = useMemo(() => {
    if (!fileA?.contents && fileB?.contents) return 'added';
    if (fileA?.contents && !fileB?.contents) return 'removed';
    if (fileA?.contents && fileB?.contents && fileA.contents !== fileB.contents) return 'modified';
    return 'unchanged';
  }, [fileA?.contents, fileB?.contents]);
  
  return {
    diffResult,
    processedDiff,
    diffStats,
    isCalculating,
    language,
    highlightedLines,
    leftPaneRef,
    rightPaneRef,
    fileStatus,
    handleLineMouseEnter,
    handleLineMouseLeave,
    handleScroll
  };
};

export default useDiffViewer; 