import React from 'react';
import { Box, Tooltip } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons-react';

// Constants for styling
const LINE_HEIGHT = 24; // pixels

/**
 * DiffConnector - Renders the connecting lines and blobs between the left and right panes
 * 
 * @param {Object} props
 * @param {Array} props.connectorPairs - Array of connector data defining connections
 * @param {number} props.height - Total height for the connector area
 * @param {Object} props.diffStats - Stats about added/removed lines
 * @returns {JSX.Element} - The connector visualization
 */
export function DiffConnector({ connectorPairs, height, diffStats }) {
  // Only process additions and removals (not unchanged) to reduce visual clutter
  const relevantConnectors = connectorPairs?.filter(
    conn => (conn.type === 'added' || conn.type === 'removed') && 
            conn.leftLine !== undefined && 
            conn.rightLine !== undefined
  ) || [];
  
  // Group connectors that are close to each other (within 3 lines)
  const groupedConnectors = [];
  let currentGroup = null;
  
  relevantConnectors.forEach((conn, index) => {
    if (!currentGroup || 
        (conn.leftLine - currentGroup.lastLeftLine > 3) || 
        (conn.rightLine - currentGroup.lastRightLine > 3) ||
        conn.type !== currentGroup.type) {
      // Start a new group
      currentGroup = {
        items: [conn],
        type: conn.type,
        firstLeftLine: conn.leftLine,
        lastLeftLine: conn.leftLine,
        firstRightLine: conn.rightLine,
        lastRightLine: conn.rightLine
      };
      groupedConnectors.push(currentGroup);
    } else {
      // Add to current group
      currentGroup.items.push(conn);
      currentGroup.lastLeftLine = conn.leftLine;
      currentGroup.lastRightLine = conn.rightLine;
    }
  });
  
  return (
    <Box style={{ 
      position: 'relative', 
      height: '100%', 
      backgroundColor: '#1a1b1e',
      borderLeft: '1px solid #2c2e33',
      borderRight: '1px solid #2c2e33',
      overflow: 'hidden'
    }}>
      {/* Stats indicators */}
      <Box style={{ 
        position: 'sticky',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80px',
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
      
      {/* Placeholder content to match height */}
      <div style={{ 
        height: `${Math.max(height, 100)}px`,
        width: '100%'
      }} />
      
      {/* Draw connector blobs */}
      {groupedConnectors.map((group, index) => {
        // Calculate connector position and dimensions
        const startY1 = (group.firstLeftLine - 1) * LINE_HEIGHT;
        const endY1 = (group.lastLeftLine - 1) * LINE_HEIGHT + LINE_HEIGHT;
        const startY2 = (group.firstRightLine - 1) * LINE_HEIGHT;
        const endY2 = (group.lastRightLine - 1) * LINE_HEIGHT + LINE_HEIGHT;
        
        const topY = Math.min(startY1, startY2);
        const height = Math.max(endY1, endY2) - topY;
        
        // Generate different colors for different types
        let fillColor = 'rgba(120, 120, 120, 0.2)';
        let strokeColor = 'rgba(120, 120, 120, 0.4)';
        let strokeOpacity = 0.7;
        
        if (group.type === 'added') {
          fillColor = 'rgba(46, 160, 67, 0.2)';
          strokeColor = 'rgba(46, 160, 67, 0.6)';
        } else if (group.type === 'removed') {
          fillColor = 'rgba(248, 81, 73, 0.2)';
          strokeColor = 'rgba(248, 81, 73, 0.6)';
        }
        
        // Add some padding to make the blobs larger than the exact lines
        const padding = 3;
        const adjustedHeight = height + (padding * 2);
        const adjustedTopY = topY - padding;
        
        // Calculate points for the SVG path
        const leftTop = {
          x: 0,
          y: Math.max(0, startY1 - adjustedTopY)
        };
        
        const rightTop = {
          x: 50,
          y: Math.max(0, startY2 - adjustedTopY)
        };
        
        const leftBottom = {
          x: 0,
          y: Math.min(adjustedHeight, endY1 - adjustedTopY)
        };
        
        const rightBottom = {
          x: 50,
          y: Math.min(adjustedHeight, endY2 - adjustedTopY)
        };
        
        // Create the SVG path for the connector
        const pathData = `
          M ${leftTop.x},${leftTop.y}
          L ${leftBottom.x},${leftBottom.y}
          C ${leftBottom.x + 20},${leftBottom.y} ${rightBottom.x - 20},${rightBottom.y} ${rightBottom.x},${rightBottom.y}
          L ${rightTop.x},${rightTop.y}
          C ${rightTop.x - 20},${rightTop.y} ${leftTop.x + 20},${leftTop.y} ${leftTop.x},${leftTop.y}
          Z
        `;
        
        return (
          <svg key={index} width="50" height={adjustedHeight} 
            style={{ 
              position: 'absolute', 
              top: adjustedTopY,
              left: 0,
              overflow: 'visible',
              pointerEvents: 'none'
            }}>
            {/* Generate blob shape with smoother curve */}
            <path
              d={pathData}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={1.5}
              strokeOpacity={strokeOpacity}
            />
          </svg>
        );
      })}
    </Box>
  );
} 