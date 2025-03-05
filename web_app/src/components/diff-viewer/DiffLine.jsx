import React from 'react';
import { Box } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';

// Constants for styling
const LINE_HEIGHT = 24; // pixels

/**
 * DiffLine - Renders a single line of code in the diff view with appropriate styling
 * 
 * @param {Object} props
 * @param {Object} props.line - The line data object containing content and metadata
 * @param {number} props.index - The index of the line in the array
 * @param {string} props.highlightLanguage - The language for syntax highlighting
 * @returns {JSX.Element} - A styled line component
 */
export function DiffLine({ line, index, highlightLanguage }) {
  let backgroundColor = 'transparent';
  let borderLeftColor = 'transparent';
  let borderLeftWidth = '3px';
  
  // Apply styling based on line type
  if (line.type === 'added') {
    backgroundColor = 'rgba(46, 160, 67, 0.3)'; // green with opacity
    borderLeftColor = '#2ea043';
  } else if (line.type === 'removed') {
    backgroundColor = 'rgba(248, 81, 73, 0.3)'; // red with opacity
    borderLeftColor = '#f85149';
  }
  
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
      {/* Line number display */}
      <Box style={{ 
        width: '40px', 
        minWidth: '40px', 
        backgroundColor: 'rgba(40, 42, 47, 0.5)',
        color: '#aaa', 
        textAlign: 'right',
        padding: '0 8px 0 0',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}>
        {line.number !== undefined ? line.number : ''}
      </Box>
      
      {/* Line content with syntax highlighting */}
      <Box style={{ 
        flexGrow: 1, 
        padding: '0 8px', 
        overflowX: 'auto',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'pre'
      }}>
        {highlightLanguage && line.content ? (
          <CodeHighlight 
            code={line.content} 
            language={highlightLanguage}
            withCopyButton={false}
            styles={{
              code: { padding: 0, background: 'transparent' },
              pre: { padding: 0, background: 'transparent' }
            }}
          />
        ) : (
          line.content || ' '
        )}
      </Box>
    </Box>
  );
} 