import React, { useMemo, useEffect } from 'react';
import {
  Paper,
  Box,
  Center,
  Stack,
  Loader,
  Text
} from '@mantine/core';

// Import sub-components and hook
import DiffHeader from './DiffHeader';
import DiffStats from './DiffStats';
import DiffPane from './DiffPane';
import DiffConnector from './DiffConnector';
import useDiffViewer from './useDiffViewer';

/**
 * Main component for the diff viewer
 */
const DiffViewer = ({
  fileA,
  fileB,
  filePathA,
  filePathB,
  fileName,
  fileExtension,
  onBackClick,
  loading,
  error,
  enableSyntaxHighlighting = true
}) => {
  // Direct access to file contents for debugging
  console.log('DiffViewer - Direct file contents:', {
    fileAContents: fileA?.contents,
    fileBContents: fileB?.contents,
    fileAContentsType: typeof fileA?.contents,
    fileBContentsType: typeof fileB?.contents
  });

  // Check if we have valid file content to diff
  const hasValidContent = useMemo(() => {
    const hasFileA = fileA && typeof fileA.contents === 'string';
    const hasFileB = fileB && typeof fileB.contents === 'string';
    return hasFileA || hasFileB;
  }, [fileA, fileB]);

  console.log('DiffViewer - Has valid content:', hasValidContent);

  // Only use the hook when we have valid file data and not in loading state
  const {
    diffResult,
    leftLines,
    rightLines,
    changeMap,
    leftScrollRef,
    rightScrollRef,
    diffStats,
    fileStatus,
    language,
    isCalculating
  } = useDiffViewer({
    // Pass files directly without conditional checks - let the hook handle it
    fileA: fileA,
    fileB: fileB,
    fileExtension,
    enableSyntaxHighlighting
  });
  
  // Log the processed lines for debugging
  useEffect(() => {
    console.log('DiffViewer - Processed data:', {
      diffResult: diffResult?.length || 0,
      leftLines: leftLines?.length || 0,
      rightLines: rightLines?.length || 0,
      changeMap: changeMap?.length || 0,
      diffStats,
      fileStatus,
      language,
      isCalculating
    });
  }, [diffResult, leftLines, rightLines, changeMap, diffStats, fileStatus, language, isCalculating]);
  
  // Memoize the loading and error states to prevent unnecessary re-renders
  const { showLoading, showError } = useMemo(() => ({
    showLoading: loading || isCalculating,
    showError: !!error
  }), [loading, isCalculating, error]);

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DiffHeader
        fileName={fileName}
        fileStatus={fileStatus}
        onBackClick={onBackClick}
      />
      
      {showError && (
        <Paper withBorder p="md" mb="md" style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: '#f44336' }}>
          <Text color="red">{error}</Text>
        </Paper>
      )}
      
      {!showLoading && !showError && (
        <DiffStats
          stats={diffStats}
          filePathA={filePathA}
          filePathB={filePathB}
        />
      )}
      
      <Paper withBorder radius="md" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderColor: '#444',
        backgroundColor: '#25262b',
        padding: '1rem'
      }}>
        {showLoading ? (
          <Center style={{ height: '100%' }}>
            <Stack align="center" spacing="sm">
              <Loader color="blue" size="xl" />
              <Text size="sm" color="dimmed">
                {loading ? 'Loading file contents...' : isCalculating ? 'Processing diff...' : 'Preparing view...'}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Box style={{ 
            height: '100%', 
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1fr 30px 1fr',
            gap: '0'
          }}>
            <DiffPane
              lines={leftLines}
              scrollRef={leftScrollRef}
              side="left"
              language={language}
              highlightSyntax={enableSyntaxHighlighting}
            />
            
            <DiffConnector
              changeMap={changeMap}
              leftLines={leftLines}
              rightLines={rightLines}
              diffStats={diffStats}
            />
            
            <DiffPane
              lines={rightLines}
              scrollRef={rightScrollRef}
              side="right"
              language={language}
              highlightSyntax={enableSyntaxHighlighting}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DiffViewer; 