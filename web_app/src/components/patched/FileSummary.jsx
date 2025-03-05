import React from 'react';
import { 
  Paper, 
  Text, 
  Group, 
  Badge, 
  ActionIcon, 
  Tooltip,
  Stack,
  Flex,
  RingProgress
} from '@mantine/core';
import { 
  IconFileText, 
  IconGitCompare,
  IconMaximize,
  IconTrash,
  IconStar,
  IconStarFilled
} from '@tabler/icons-react';

/**
 * FileSummary - Component for displaying file comparison summary
 * 
 * Displays important information about a file comparison in a compact form
 * 
 * @param {Object} props - Component properties
 * @param {string} props.id - Unique identifier for this comparison
 * @param {string} props.sourceFile - Source file path/name
 * @param {string} props.targetFile - Target file path/name
 * @param {Object} props.stats - Comparison statistics (added, removed, unchanged)
 * @param {string} props.date - Formatted date string showing when comparison was made
 * @param {boolean} props.isStarred - Whether this comparison is starred
 * @param {Function} props.onOpen - Handler for opening the comparison
 * @param {Function} props.onDelete - Handler for deleting the comparison
 * @param {Function} props.onToggleStar - Handler for toggling starred status
 */
export function FileSummary({
  id,
  sourceFile,
  targetFile,
  stats = { added: 0, removed: 0, unchanged: 0 },
  date,
  isStarred = false,
  onOpen,
  onDelete,
  onToggleStar
}) {
  const totalLines = stats.added + stats.removed + stats.unchanged;
  
  // Calculate percentages for the ring chart
  const getPercentage = (value) => {
    return totalLines === 0 ? 0 : Math.round((value / totalLines) * 100);
  };
  
  return (
    <Paper withBorder p="md">
      <Flex gap="md" align="center">
        <RingProgress
          size={80}
          thickness={8}
          roundCaps
          sections={[
            { value: getPercentage(stats.added), color: 'green' },
            { value: getPercentage(stats.removed), color: 'red' },
            { value: getPercentage(stats.unchanged), color: 'gray' },
          ]}
          label={
            <Text ta="center" fz="sm" fw={700}>
              {totalLines}
            </Text>
          }
        />
        
        <Stack spacing={4} style={{ flex: 1 }}>
          <Group>
            <IconFileText size={16} />
            <Text size="sm" fw={500} truncate>
              {sourceFile.split('/').pop()} 
              <Text span c="dimmed"> → </Text>
              {targetFile.split('/').pop()}
            </Text>
          </Group>
          
          <Group spacing="xs">
            <Badge size="sm" color="green">+{stats.added}</Badge>
            <Badge size="sm" color="red">-{stats.removed}</Badge>
            <Badge size="sm" color="gray">{stats.unchanged}</Badge>
            {date && <Badge size="sm" color="blue" variant="light">{date}</Badge>}
          </Group>
        </Stack>
        
        <Group>
          {onToggleStar && (
            <Tooltip label={isStarred ? "Unstar" : "Star"}>
              <ActionIcon 
                color="yellow" 
                variant={isStarred ? "filled" : "subtle"}
                onClick={() => onToggleStar(id)}
              >
                {isStarred ? <IconStarFilled size={18} /> : <IconStar size={18} />}
              </ActionIcon>
            </Tooltip>
          )}
          
          <Tooltip label="View diff">
            <ActionIcon color="blue" onClick={onOpen}>
              <IconGitCompare size={18} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Fullscreen">
            <ActionIcon variant="subtle">
              <IconMaximize size={18} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Remove">
            <ActionIcon color="red" variant="subtle" onClick={onDelete}>
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Flex>
    </Paper>
  );
} 