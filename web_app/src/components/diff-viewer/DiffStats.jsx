import React from 'react';
import { Paper, Group, Box, Text, Badge } from '@mantine/core';
import { IconPlus, IconMinus, IconEqual } from '@tabler/icons-react';

/**
 * DiffStats - Renders statistics about the differences between files
 * 
 * @param {Object} props
 * @param {Object} props.diffStats - Stats about added/removed/unchanged lines
 * @param {string} props.sourceFileName - Name of the source file
 * @param {string} props.targetFileName - Name of the target file
 * @returns {JSX.Element} - The stats component
 */
export function DiffStats({ diffStats, sourceFileName, targetFileName }) {
  const { added, removed, unchanged } = diffStats;
  const totalChanges = added + removed;
  const totalLines = added + removed + unchanged;
  
  return (
    <Paper 
      withBorder 
      p="xs" 
      mb="md" 
      style={{ 
        backgroundColor: '#2C2E33', 
        borderColor: '#444', 
        paddingBottom: '8px', 
        marginBottom: '12px' 
      }}
    >
      <Group position="apart">
        <Group>
          <Box>
            <Text size="xs" weight={500} style={{ marginBottom: '4px' }}>
              Changes:
            </Text>
            <Group spacing="xs">
              <Badge 
                size="sm" 
                color="green" 
                leftSection={<IconPlus size={10} />}
                styles={{ root: { textTransform: 'none' } }}
              >
                {added} added
              </Badge>
              <Badge 
                size="sm" 
                color="red" 
                leftSection={<IconMinus size={10} />}
                styles={{ root: { textTransform: 'none' } }}
              >
                {removed} removed
              </Badge>
              <Badge 
                size="sm" 
                color="gray" 
                leftSection={<IconEqual size={10} />}
                styles={{ root: { textTransform: 'none' } }}
              >
                {unchanged} unchanged
              </Badge>
            </Group>
          </Box>
        </Group>
        <Box>
          <Text size="xs" weight={500} style={{ marginBottom: '4px' }}>
            Files:
          </Text>
          <Group>
            <Text size="xs" color="dimmed">
              Comparing <strong style={{ fontWeight: 'bold' }}>{sourceFileName}</strong> to <strong style={{ fontWeight: 'bold' }}>{targetFileName}</strong>
            </Text>
          </Group>
        </Box>
      </Group>
    </Paper>
  );
} 