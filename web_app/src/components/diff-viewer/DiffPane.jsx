import React, { useEffect } from 'react';
import { ScrollArea, Box, Text, Center } from '@mantine/core';
import DiffLine from './DiffLine';

/**
 * Component for rendering a pane of diff content (left or right)
 */
const DiffPane = ({ 
  lines = [], 
  scrollRef,
  side,
  language = 'javascript',
  highlightSyntax = true
}) => {
  useEffect(() => {
    console.log(`DiffPane ${side} - lines:`, { 
      length: lines?.length || 0, 
      firstFew: lines?.slice(0, 3) || [] 
    });
  }, [lines, side]);

  if (!lines || lines.length === 0) {
    console.log(`DiffPane ${side} - No content available`);
    return (
      <Center style={{ height: '100%', backgroundColor: '#292c34' }}>
        <Text color="dimmed">No content available</Text>
      </Center>
    );
  }

  return (
    <ScrollArea 
      style={{ height: '100%' }} 
      ref={scrollRef}
      offsetScrollbars
    >
      <Box style={{ 
        padding: side === 'left' ? '0 12px 0 0' : '0 0 0 12px',
        minHeight: '100%'
      }}>
        {lines.map((line, index) => (
          <DiffLine
            key={`${side}-${line.number}`}
            line={line}
            side={side}
            language={language}
            highlightSyntax={highlightSyntax}
          />
        ))}
      </Box>
    </ScrollArea>
  );
};

export default DiffPane; 