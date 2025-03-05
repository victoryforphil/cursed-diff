import { useState, useEffect, useRef, useMemo } from 'react';
import * as Diff from 'diff';
import { processDiff, getLanguageFromExtension } from './diffUtils';

// Custom hook to manage diff logic and state
const useDiffViewer = ({
  fileA,
  fileB,
  fileExtension,
  enableSyntaxHighlighting = true
}) => {
  // Debug the raw file inputs
  console.log('useDiffViewer - Direct inputs:', { 
    fileA, 
    fileB,
    fileAContents: fileA?.contents,
    fileBContents: fileB?.contents
  });
  
  const [diffResult, setDiffResult] = useState([]);
  const [diffStats, setDiffStats] = useState({ added: 0, removed: 0, unchanged: 0 });
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Refs for scroll synchronization
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const isScrollingSyncedRef = useRef(true);
  
  // Get file status
  const fileStatus = useMemo(() => {
    if (!fileA?.contents && fileB?.contents) return 'added';
    if (fileA?.contents && !fileB?.contents) return 'removed';
    if (fileA?.contents && fileB?.contents && fileA.contents !== fileB.contents) return 'modified';
    return 'unchanged';
  }, [fileA?.contents, fileB?.contents]);
  
  // Get language for syntax highlighting
  const language = useMemo(() => {
    return getLanguageFromExtension(fileExtension);
  }, [fileExtension]);
  
  // Calculate diff when files change
  useEffect(() => {
    // Very direct debugging to identify why the diff calculation isn't running
    console.log('useEffect diffCalculation - Direct values:', {
      fileA,
      fileB,
      fileAType: typeof fileA,
      fileBType: typeof fileB,
      fileAIsNull: fileA === null,
      fileBIsNull: fileB === null,
      fileAContents: fileA?.contents,
      fileBContents: fileB?.contents,
      fileAContentsType: typeof fileA?.contents,
      fileBContentsType: typeof fileB?.contents
    });
    
    if (!fileA && !fileB) {
      console.log('useDiffViewer - No files to compare');
      return;
    }
    
    console.log('useDiffViewer - Starting diff calculation - Direct debug point');
    
    let isMounted = true;
    setIsCalculating(true);
    
    const calculateDiffAsync = async () => {
      try {
        // Generate stable content values - ensure we have strings
        const contentA = (fileA?.contents || '').toString();
        const contentB = (fileB?.contents || '').toString();
        
        // Debug the actual content with special focus on newlines
        console.log('useDiffViewer - File contents types:', { 
          typeA: typeof contentA, 
          typeB: typeof contentB
        });
        
        console.log('useDiffViewer - Line counts:', {
          linesA: contentA.split('\n').length,
          linesB: contentB.split('\n').length
        });
        
        console.log('useDiffViewer - Raw content preview A:', 
          JSON.stringify(contentA.substring(0, 100)));
        console.log('useDiffViewer - Raw content preview B:', 
          JSON.stringify(contentB.substring(0, 100)));
        
        // Calculate diff using diff library
        console.log('useDiffViewer - Direct before diffLines call');
        const diff = Diff.diffLines(
          contentA, 
          contentB,
          { ignoreWhitespace: false }
        );
        console.log('useDiffViewer - Direct after diffLines call');
        
        console.log('useDiffViewer - Diff result:', { 
          parts: diff.length,
          sample: diff.slice(0, 2)
        });
        
        if (!isMounted) return;
        
        // Ensure diff is valid before setting state
        if (!diff || !Array.isArray(diff) || diff.length === 0) {
          console.error('Diff calculation failed - empty or invalid result');
          setDiffResult([]);
          return;
        }
        
        setDiffResult(diff);
        
        // Calculate statistics
        const stats = diff.reduce((acc, part) => {
          const lines = part.value.split('\n').length - 1 || 1;
          
          if (part.added) {
            acc.added += lines;
          } else if (part.removed) {
            acc.removed += lines;
          } else {
            acc.unchanged += lines;
          }
          
          return acc;
        }, { added: 0, removed: 0, unchanged: 0 });
        
        if (!isMounted) return;
        setDiffStats(stats);
        console.log('useDiffViewer - Diff stats calculated:', stats);
      } catch (error) {
        console.error('Error calculating diff:', error);
      } finally {
        if (isMounted) {
          setIsCalculating(false);
        }
      }
    };
    
    calculateDiffAsync();
    
    return () => {
      isMounted = false;
    };
  }, [fileA, fileB]); 
  
  // Set up scroll synchronization
  useEffect(() => {
    if (!leftScrollRef.current || !rightScrollRef.current) return;
    
    const leftViewport = leftScrollRef.current.viewport;
    const rightViewport = rightScrollRef.current.viewport;
    
    const handleScrollLeft = () => {
      if (!isScrollingSyncedRef.current) return;
      isScrollingSyncedRef.current = false;
      
      const percentScroll = leftViewport.scrollTop / (leftViewport.scrollHeight - leftViewport.clientHeight);
      rightViewport.scrollTop = percentScroll * (rightViewport.scrollHeight - rightViewport.clientHeight);
      
      setTimeout(() => {
        isScrollingSyncedRef.current = true;
      }, 100);
    };
    
    const handleScrollRight = () => {
      if (!isScrollingSyncedRef.current) return;
      isScrollingSyncedRef.current = false;
      
      const percentScroll = rightViewport.scrollTop / (rightViewport.scrollHeight - rightViewport.clientHeight);
      leftViewport.scrollTop = percentScroll * (leftViewport.scrollHeight - leftViewport.clientHeight);
      
      setTimeout(() => {
        isScrollingSyncedRef.current = true;
      }, 100);
    };
    
    leftViewport.addEventListener('scroll', handleScrollLeft);
    rightViewport.addEventListener('scroll', handleScrollRight);
    
    return () => {
      leftViewport.removeEventListener('scroll', handleScrollLeft);
      rightViewport.removeEventListener('scroll', handleScrollRight);
    };
  }, []);
  
  // Process diff for display
  const { leftLines, rightLines, changeMap } = useMemo(() => {
    console.log('useDiffViewer - Processing diff for display, length:', diffResult?.length || 0);
    
    // Manual processing for debugging
    if (diffResult?.length > 0) {
      console.log('useDiffViewer - First diff part:', {
        value: diffResult[0].value,
        added: diffResult[0].added,
        removed: diffResult[0].removed,
        lines: diffResult[0].value.split('\n').length
      });
    } else {
      console.log('useDiffViewer - No diff result to process, forcing a manual diff');
      // Try a direct diff here as a fallback
      if (fileA?.contents && fileB?.contents) {
        const manualDiff = Diff.diffLines(
          fileA.contents.toString(),
          fileB.contents.toString(),
          { ignoreWhitespace: false }
        );
        console.log('useDiffViewer - Manual diff result:', { 
          parts: manualDiff.length,
          sample: manualDiff.slice(0, 2)
        });
        
        // Return a direct process of the manual diff
        return processDiff(manualDiff);
      }
    }
    
    const result = processDiff(diffResult);
    console.log('useDiffViewer - Processed result:', { 
      leftLines: result.leftLines?.length || 0, 
      rightLines: result.rightLines?.length || 0, 
      changeMap: result.changeMap?.length || 0,
      leftSample: result.leftLines?.slice(0, 2) || [],
      rightSample: result.rightLines?.slice(0, 2) || []
    });
    return result;
  }, [diffResult, fileA, fileB]);
  
  return {
    diffResult,
    leftLines,
    rightLines,
    changeMap,
    diffStats,
    isCalculating,
    fileStatus,
    language,
    leftScrollRef,
    rightScrollRef
  };
};

export default useDiffViewer; 