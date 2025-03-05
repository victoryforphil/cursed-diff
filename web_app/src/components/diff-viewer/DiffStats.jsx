import React from 'react';
import { Paper, Group, Text } from '@mantine/core';
import { IconPlus, IconMinus, IconEqual } from '@tabler/icons-react';

/**
 * Component for displaying diff statistics
 */
const DiffStats = ({ 
  stats, 
  filePathA, 
  filePathB,
}) => {
  return (
    <Paper withBorder p="md" mb="md" style={{ 
      backgroundColor: '#25262b', 
      borderColor: '#444'
    }}>
      <Group position="apart">
        <Group spacing="xl">
          <Group spacing="xs">
            <IconPlus size={16} style={{ color: '#4caf50' }} />
            <Text>{stats.added} lines added</Text>
          </Group>
          <Group spacing="xs">
            <IconMinus size={16} style={{ color: '#f44336' }} />
            <Text>{stats.removed} lines removed</Text>
          </Group>
          <Group spacing="xs">
            <IconEqual size={16} style={{ color: '#90caf9' }} />
            <Text>{stats.unchanged} lines unchanged</Text>
          </Group>
        </Group>
        
        <Group>
          <Text size="sm" color="dimmed">
            From {filePathA || 'Folder A'} → {filePathB || 'Folder B'}
          </Text>
        </Group>
      </Group>
    </Paper>
  );
};

export default DiffStats; 