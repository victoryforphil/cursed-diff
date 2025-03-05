import React from 'react';
import { 
  Paper, 
  Title, 
  Text, 
  Group, 
  Stack,
  Divider,
  Box,
  ActionIcon,
  Badge,
  Tooltip,
  ScrollArea
} from '@mantine/core';
import { 
  IconClock, 
  IconGitCompare,
  IconFileText,
  IconArrowRight,
  IconTrash
} from '@tabler/icons-react';

/**
 * ComparisonItem - A list item for a recent comparison
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.comparison - Comparison data
 * @param {Function} props.onOpen - Handler for opening the comparison
 * @param {Function} props.onDelete - Handler for deleting the comparison
 */
function ComparisonItem({ comparison, onOpen, onDelete }) {
  return (
    <Box
      py={8}
      px={10}
      style={{ 
        borderBottom: '1px solid var(--mantine-color-gray-2)',
      }}
    >
      <Group position="apart">
        <Group>
          <IconFileText size={16} />
          <Text size="sm">
            {comparison.sourceFile.split('/').pop()}
            <IconArrowRight size={12} style={{ margin: '0 4px', opacity: 0.5 }} />
            {comparison.targetFile.split('/').pop()}
          </Text>
          <Badge size="xs">{comparison.date}</Badge>
        </Group>
        
        <Group spacing={4}>
          <Tooltip label="View diff">
            <ActionIcon 
              size="sm" 
              color="blue" 
              variant="subtle"
              onClick={() => onOpen(comparison)}
            >
              <IconGitCompare size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Remove">
            <ActionIcon 
              size="sm" 
              color="red" 
              variant="subtle"
              onClick={() => onDelete(comparison.id)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Box>
  );
}

/**
 * RecentComparisons - Component to display list of recent comparisons
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.comparisons - List of comparison objects
 * @param {Function} props.onOpenComparison - Handler for opening a comparison
 * @param {Function} props.onDeleteComparison - Handler for deleting a comparison
 */
export function RecentComparisons({
  comparisons = [],
  onOpenComparison,
  onDeleteComparison
}) {
  return (
    <Paper withBorder p="md">
      <Stack>
        <Group>
          <IconClock size={18} />
          <Title order={4}>Recent Comparisons</Title>
        </Group>
        
        <Divider />
        
        <ScrollArea style={{ height: 260 }}>
          {comparisons.length > 0 ? (
            comparisons.map((comparison) => (
              <ComparisonItem
                key={comparison.id}
                comparison={comparison}
                onOpen={onOpenComparison}
                onDelete={onDeleteComparison}
              />
            ))
          ) : (
            <Text size="sm" color="dimmed" align="center" py="xl">
              No recent comparisons
            </Text>
          )}
        </ScrollArea>
      </Stack>
    </Paper>
  );
} 