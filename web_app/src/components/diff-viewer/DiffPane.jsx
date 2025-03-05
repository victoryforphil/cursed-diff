import React from 'react';
import { ScrollArea, Center, Text } from '@mantine/core';
import { DiffLine } from './DiffLine';

/**
 * DiffPane - Renders one side (left or right) of the diff comparison
 * 
 * @param {Object} props
 * @param {Array} props.lines - Array of line objects to render
 * @param {string} props.highlightLanguage - Language for syntax highlighting
 * @param {React.RefObject} props.scrollRef - Reference to the scroll container
 * @param {string} props.side - Which side is this pane ('left' or 'right')
 * @param {string} props.emptyMessage - Message to display when there's no content
 * @returns {JSX.Element} - The scrollable diff pane
 */
export function DiffPane({ lines, highlightLanguage, scrollRef, side, emptyMessage = "No content" }) {
  return (
    <ScrollArea 
      style={{ 
        height: '100%', 
        backgroundColor: '#1a1b1e',
        borderRight: side === 'left' ? '1px solid #333' : undefined,
        borderLeft: side === 'right' ? '1px solid #333' : undefined
      }}
      ref={scrollRef}
      scrollbarSize={10}
      offsetScrollbars
      type="auto"
      id={`${side}-pane`}
    >
      {lines.length > 0 ? (
        lines.map((line, index) => (
          <DiffLine 
            key={`${side}-${line.number}-${index}`}
            line={line}
            index={index}
            highlightLanguage={highlightLanguage}
          />
        ))
      ) : (
        <Center style={{ height: '100%', padding: '20px' }}>
          <Text color="dimmed">{emptyMessage}</Text>
        </Center>
      )}
    </ScrollArea>
  );
} 