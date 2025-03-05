import React from 'react';
import { Tooltip } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';


/**
 * Component for rendering a single line in the diff view
 */
const DiffLine = ({ 
  line,
  side,
  showLineNumbers = true,
  highlightSyntax = true,
  language = 'javascript'
}) => {
  // Background color based on line type
  const getBgColor = () => {
    switch (line.type) {
      case 'added':
        return 'rgba(0, 170, 0, 0.15)';
      case 'removed':
        return 'rgba(255, 0, 0, 0.15)';
      default:
        return 'transparent';
    }
  };
  
  // Get tooltip text based on line type
  const getTooltipText = () => {
    switch (line.type) {
      case 'added':
        return 'Added line';
      case 'removed':
        return 'Removed line';
      default:
        return 'Unchanged line';
    }
  };

  return (
    <Tooltip 
      label={getTooltipText()} 
      position="top" 
      openDelay={500}
      withinPortal
      disabled={line.type === 'unchanged'}
    >
      <div
        id={`${side}-${line.number}`}
        style={{ 
          backgroundColor: getBgColor(),
          padding: '2px 0',
          display: 'flex',
          width: '100%'
        }}
      >
        {showLineNumbers && (
          <div style={{ 
            minWidth: '40px', 
            textAlign: 'right', 
            color: '#6c757d',
            padding: '0 8px',
            userSelect: 'none',
            fontSize: '0.85rem'
          }}>
            {line.number}
          </div>
        )}
        
        <div style={{ 
          padding: '0 8px',
          fontFamily: 'monospace',
          flex: 1,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          fontSize: '0.9rem',
          overflow: 'hidden'
        }}>
          {highlightSyntax ? (
            <CodeHighlight
              code={line.content}
              language={language}
              withLineNumbers={false}
              highlightLines={[]}
              styles={{
                root: {
                  backgroundColor: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                },
                code: {
                  padding: 0,
                  margin: 0,
                  fontSize: '0.9rem',
                  backgroundColor: 'transparent',
                }
              }}
            />
          ) : (
            line.content
          )}
        </div>
      </div>
    </Tooltip>
  );
};

export default DiffLine; 