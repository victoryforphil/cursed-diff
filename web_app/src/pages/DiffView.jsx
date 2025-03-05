import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Center, Loader, Text, Button, Group, ActionIcon, Tooltip } from '@mantine/core';
import * as Diff from 'diff';
import { useComparisonHistory } from '../hooks';
import { IconStar, IconStarFilled, IconHistory } from '@tabler/icons-react';

// Import our new components
import { DiffHeader } from '../components/diff-viewer/DiffHeader';
import { DiffStats } from '../components/diff-viewer/DiffStats';
import { DiffViewer } from '../components/diff-viewer/DiffViewer';

// Helper function to get display name from file path
const getDisplayName = (filePath) => filePath ? filePath.split('/').pop() : 'nonexistent';

/**
 * DiffView - Main page component for the diff view
 * 
 * Handles loading files, processing diffs, and displaying the results
 */
export function DiffView() {
  const { filePathA, filePathB } = useParams();
  const navigate = useNavigate();
  const { addComparison, isStarred, toggleStarred } = useComparisonHistory();
  
  // Computed display names
  const sourceFileName = getDisplayName(filePathA);
  const targetFileName = getDisplayName(filePathB);

  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diffLines, setDiffLines] = useState({ left: [], right: [], connectors: [] });
  const [diffStats, setDiffStats] = useState({ added: 0, removed: 0, unchanged: 0 });
  const [comparisonId, setComparisonId] = useState(null);
  
  // Ref to ensure we only add to history once - moved outside useEffect
  const shouldSaveToHistory = useRef(true);
  
  // Get file extension for syntax highlighting
  const getFileExtension = (filePath) => {
    if (!filePath) return '';
    const parts = filePath.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };
  
  const fileExtension = useMemo(() => {
    // Use the extension from filePathB if it exists, otherwise filePathA
    return getFileExtension(filePathB) || getFileExtension(filePathA);
  }, [filePathA, filePathB]);
  
  // Process diff changes into a format suitable for rendering
  const processChanges = useCallback((diff) => {
    const left = [];
    const right = [];
    const connectors = [];
    
    let leftLineNumber = 1;
    let rightLineNumber = 1;
    
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;
    
    // Process each change in the diff
    diff.forEach(part => {
      const lines = part.value.split('\n');
      // Remove the last empty line that's created by splitting with \n
      if (lines[lines.length - 1] === '') {
        lines.pop();
      }
      
      if (part.added) {
        // Handle added lines (only in right pane)
        lines.forEach(line => {
          right.push({
            type: 'added',
            content: line,
            number: rightLineNumber++
          });
          
          // Connect to the last removed line or the current unchanged line
          addedCount++;
        });
      } else if (part.removed) {
        // Handle removed lines (only in left pane)
        const startLeftLineNumber = leftLineNumber;
        
        lines.forEach(line => {
          left.push({
            type: 'removed',
            content: line,
            number: leftLineNumber++
          });
          
          removedCount++;
        });
        
        // Remember the line range for later connecting
        const endLeftLineNumber = leftLineNumber - 1;
      } else {
        // Handle unchanged lines (in both panes)
        lines.forEach(line => {
          left.push({
            type: 'unchanged',
            content: line,
            number: leftLineNumber++
          });
          
          right.push({
            type: 'unchanged',
            content: line,
            number: rightLineNumber++
          });
          
          unchangedCount++;
        });
      }
    });
    
    // Create connectors by matching line numbers and types
    let lastLeftRemovedIndex = -1;
    let lastRightAddedIndex = -1;
    
    // Create direct connections between added and removed lines
    for (let i = 0; i < left.length; i++) {
      if (left[i].type === 'removed') {
        lastLeftRemovedIndex = i;
        
        // If there's a recent addition, connect them
        if (lastRightAddedIndex >= 0) {
          connectors.push({
            type: 'removed',
            leftLine: left[i].number,
            rightLine: right[lastRightAddedIndex].number
          });
        }
      }
    }
    
    for (let i = 0; i < right.length; i++) {
      if (right[i].type === 'added') {
        lastRightAddedIndex = i;
        
        // If there's a recent removal, connect them
        if (lastLeftRemovedIndex >= 0) {
          connectors.push({
            type: 'added',
            leftLine: left[lastLeftRemovedIndex].number,
            rightLine: right[i].number
          });
        }
      }
    }
    
    // Also add direct connections between unchanged lines
    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      if (left[i]?.type === 'unchanged' && right[i]?.type === 'unchanged') {
        connectors.push({
          type: 'unchanged',
          leftLine: left[i].number,
          rightLine: right[i].number
        });
      }
    }
    
    // Sort connectors by line numbers
    connectors.sort((a, b) => a.leftLine - b.leftLine || a.rightLine - b.rightLine);
    
    // Update diff stats
    setDiffStats({
      added: addedCount,
      removed: removedCount,
      unchanged: unchangedCount
    });
    
    return { left, right, connectors };
  }, []);
  
  // Fetch file contents
  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Step 1: Fetch the file listings from both directories
        const [responseFilesA, responseFilesB] = await Promise.all([
          fetch('http://localhost:3000/api/files/a'),
          fetch('http://localhost:3000/api/files/b')
        ]);
        
        if (!responseFilesA.ok || !responseFilesB.ok) {
          throw new Error('Failed to fetch file listings');
        }
        
        const [filesA, filesB] = await Promise.all([
          responseFilesA.json(),
          responseFilesB.json()
        ]);
        
        // Step 2: Find the indices of the files we want based on path
        const findFileIndex = (files, targetPath) => {
          if (!targetPath) return null;
          const decodedPath = decodeURIComponent(targetPath);
          
          // Find the file that matches the path
          const fileIndex = files.findIndex(file => file.path === decodedPath);
          return fileIndex !== -1 ? fileIndex : null;
        };
        
        const fileAIndex = findFileIndex(filesA, filePathA);
        const fileBIndex = findFileIndex(filesB, filePathB);
        
        // Step 3: Fetch the contents of the identified files
        let dataA = null;
        let dataB = null;
        
        if (fileAIndex !== null) {
          const responseA = await fetch(`http://localhost:3000/api/files/a/${fileAIndex}/contents`);
          if (responseA.ok) {
            dataA = await responseA.json();
          }
        }
        
        if (fileBIndex !== null) {
          const responseB = await fetch(`http://localhost:3000/api/files/b/${fileBIndex}/contents`);
          if (responseB.ok) {
            dataB = await responseB.json();
          }
        }
        
        // Update state with the fetched files
        setFileA(dataA);
        setFileB(dataB);
        
        // Log data for debugging
        console.log('Fetched files:', {
          fileA: dataA ? (typeof dataA.contents === 'string' ? dataA.contents.substring(0, 50) + '...' : null) : null,
          fileB: dataB ? (typeof dataB.contents === 'string' ? dataB.contents.substring(0, 50) + '...' : null) : null
        });
        
      } catch (err) {
        console.error('Error fetching files:', err);
        setError(`Failed to load files: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFiles();
  }, [filePathA, filePathB]);
  
  // Calculate and process diff when files are loaded
  useEffect(() => {
    // Skip if still loading or if we have an error
    if (loading || error) return;
    
    try {
      // Use empty string if file content is null/undefined
      const contentA = fileA && typeof fileA.contents === 'string' ? fileA.contents : '';
      const contentB = fileB && typeof fileB.contents === 'string' ? fileB.contents : '';
      
      console.log('Calculating diff between:', {
        contentALength: contentA.length,
        contentBLength: contentB.length,
      });
      
      // Calculate diff using diff library
      const diff = Diff.diffLines(contentA, contentB);
      
      console.log('Diff calculated:', {
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
  
  // Save the comparison to history
  useEffect(() => {
    if (!loading && !error && fileA !== null && fileB !== null && shouldSaveToHistory.current) {
      // Only save finished, successful comparisons once
      const id = Date.now().toString();
      setComparisonId(id);
      
      // Create a timeout to avoid state updates during render cycle
      const timer = setTimeout(() => {
        // Add to history with the generated ID
        addComparison({
          id,
          sourceFile: filePathA,
          targetFile: filePathB,
          stats: diffStats
        });
        
        // Mark as saved to prevent duplicate additions
        shouldSaveToHistory.current = false;
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [loading, error, fileA, fileB, diffStats, filePathA, filePathB, addComparison]);

  // Handle starring the current comparison
  const handleToggleStar = () => {
    if (comparisonId) {
      toggleStarred({
        id: comparisonId,
        sourceFile: filePathA,
        targetFile: filePathB,
        stats: diffStats
      });
    }
  };

  // Go to history view
  const handleViewHistory = () => {
    navigate('/history');
  };

  // Handler for back button
  const handleBack = () => {
    navigate('/');
  };

  // Check if there is content to display
  const hasContent = diffLines.left.length > 0 || diffLines.right.length > 0;
  
  // Add this after your existing header JSX, before the DiffViewer component
  const historyControls = (
    <Group position="right" mb="md">
      {comparisonId && (
        <Tooltip label={isStarred(comparisonId) ? "Unstar comparison" : "Star comparison"}>
          <ActionIcon 
            size="lg"
            color="yellow"
            variant={isStarred(comparisonId) ? "filled" : "light"}
            onClick={handleToggleStar}
          >
            {isStarred(comparisonId) ? <IconStarFilled size={20} /> : <IconStar size={20} />}
          </ActionIcon>
        </Tooltip>
      )}
      
      <Button 
        variant="light" 
        leftIcon={<IconHistory size={16} />}
        onClick={handleViewHistory}
      >
        View History
      </Button>
    </Group>
  );
  
  return (
    <Box p="md" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header with file info and actions */}
      <DiffHeader 
        fileName={sourceFileName} 
        fileExtension={fileExtension}
        loading={loading}
        error={error}
        syncScrollActive={hasContent}
        hasContent={hasContent}
        onBack={handleBack}
      />
      
      {/* Loading state */}
      {loading && (
        <Center style={{ height: '200px' }}>
          <Loader size="xl" variant="dots" />
        </Center>
      )}
      
      {/* Error state */}
      {!loading && error && (
        <Center style={{ height: '200px' }}>
          <Box style={{ textAlign: 'center' }}>
            <Text color="red" size="lg" weight={500}>{error}</Text>
              </Box>
        </Center>
      )}
      
      {/* Diff stats */}
      {!loading && !error && hasContent && (
        <DiffStats 
          diffStats={diffStats}
          sourceFileName={sourceFileName}
          targetFileName={targetFileName}
        />
      )}
      
      {/* Main diff view */}
      {!loading && !error && (
        <>
          {historyControls}
          <DiffViewer 
            diffLines={diffLines}
            fileExtension={fileExtension}
            diffStats={diffStats}
            sourceFileName={sourceFileName}
            targetFileName={targetFileName}
            error={error}
          />
        </>
      )}
    </Box>
  );
}