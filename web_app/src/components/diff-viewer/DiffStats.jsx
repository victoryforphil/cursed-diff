import React from 'react';
import { Paper, Group, Box, Text, Badge, Flex, RingProgress } from '@mantine/core';
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
  
  // Calculate percentages for the ring chart
  const getPercentage = (value) => {
    return totalLines === 0 ? 0 : Math.round((value / totalLines) * 100);
  };
  
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
      <Flex align="center" gap="md">
        {/* Progress Circle */}
        <RingProgress
          size={60}
          thickness={6}
          roundCaps
          sections={[
            { value: getPercentage(added), color: 'green' },
            { value: getPercentage(removed), color: 'red' },
            { value: getPercentage(unchanged), color: 'gray' },
          ]}
          label={
            <Text ta="center" fz="xs" fw={700}>
              {totalLines}
            </Text>
          }
        />
        
        {/* Stats Badges */}
        <Box style={{ flex: 1 }}>
          <Group spacing="xs" mb={4}>
            <Badge 
              size="sm" 
              color="green" 
              styles={{ root: { textTransform: 'none' } }}
            >
              <Group spacing={4}>
                <IconPlus size={10} />
                <span>{added} added</span>
              </Group>
            </Badge>
            <Badge 
              size="sm" 
              color="red" 
              styles={{ root: { textTransform: 'none' } }}
            >
              <Group spacing={4}>
                <IconMinus size={10} />
                <span>{removed} removed</span>
              </Group>
            </Badge>
            <Badge 
              size="sm" 
              color="gray" 
              styles={{ root: { textTransform: 'none' } }}
            >
              <Group spacing={4}>
                <IconEqual size={10} />
                <span>{unchanged} unchanged</span>
              </Group>
            </Badge>
          </Group>
          
          {/* File Names */}
          <Text size="xs" color="dimmed">
            Comparing <strong style={{ fontWeight: 'bold' }}>{sourceFileName}</strong> to <strong style={{ fontWeight: 'bold' }}>{targetFileName}</strong>
          </Text>
        </Box>
      </Flex>
    </Paper>
  );
} 