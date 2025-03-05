import React from 'react';
import {
  Paper,
  Group,
  Title,
  Badge,
  ActionIcon,
} from '@mantine/core';
import { IconArrowLeft, IconFileCode } from '@tabler/icons-react';

/**
 * Header component for diff viewer
 */
const DiffHeader = ({ 
  fileName, 
  fileStatus,
  onBackClick
}) => {
  // Render file status badge
  const renderStatusBadge = () => {
    switch(fileStatus) {
      case 'added':
        return <Badge color="green">Added</Badge>;
      case 'removed':
        return <Badge color="red">Removed</Badge>;
      case 'modified':
        return <Badge color="orange">Modified</Badge>;
      default:
        return <Badge color="blue">Unchanged</Badge>;
    }
  };

  return (
    <Paper withBorder p="md" mb="md" style={{ 
      backgroundColor: '#25262b', 
      borderColor: '#444'
    }}>
      <Group position="apart">
        <Group>
          <ActionIcon 
            size="lg" 
            variant="light" 
            color="blue" 
            onClick={onBackClick}
          >
            <IconArrowLeft size={18} />
          </ActionIcon>
          <Group spacing="xs">
            <IconFileCode size={22} style={{ color: '#607d8b' }}/>
            <Title order={3}>{fileName || 'Unknown file'}</Title>
            {renderStatusBadge()}
          </Group>
        </Group>
        
        <Group>
          <Badge size="lg" variant="outline">File Diff</Badge>
        </Group>
      </Group>
    </Paper>
  );
};

export default DiffHeader; 