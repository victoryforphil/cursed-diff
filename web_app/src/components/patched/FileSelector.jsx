import React from 'react';
import { 
  Paper, 
  Title, 
  Text, 
  Group, 
  Button, 
  Stack,
  Divider,
  ActionIcon,
  Tooltip,
  Flex,
  Box
} from '@mantine/core';
import { 
  IconFolderOpen, 
  IconRefresh, 
  IconArrowsMaximize,
  IconFileText
} from '@tabler/icons-react';

/**
 * FileTreeItem - Simple component for displaying a file in the tree
 * 
 * @param {Object} props - Component properties
 * @param {string} props.name - File name
 * @param {boolean} props.isSelected - Whether this file is selected
 * @param {Function} props.onClick - Click handler
 */
function FileTreeItem({ name, isSelected, onClick }) {
  return (
    <Box
      py={6}
      px={8}
      style={{ 
        cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : 'transparent',
        borderRadius: 4
      }}
      onClick={onClick}
    >
      <Group gap="xs">
        <IconFileText size={16} />
        <Text size="sm">{name}</Text>
      </Group>
    </Box>
  );
}

/**
 * FileSelector - Component for selecting files to diff
 * 
 * Provides a clean interface for browsing and selecting files
 * from source and target directories
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.sourceFiles - List of source files
 * @param {Array} props.targetFiles - List of target files
 * @param {string} props.selectedSourceFile - Currently selected source file
 * @param {string} props.selectedTargetFile - Currently selected target file
 * @param {Function} props.onSelectSourceFile - Handler for source file selection
 * @param {Function} props.onSelectTargetFile - Handler for target file selection
 * @param {Function} props.onCompare - Handler for compare button click
 * @param {boolean} props.loading - Whether files are loading
 */
export function FileSelector({
  sourceFiles = [],
  targetFiles = [],
  selectedSourceFile,
  selectedTargetFile,
  onSelectSourceFile,
  onSelectTargetFile,
  onCompare,
  onRefresh,
  loading = false
}) {
  const canCompare = selectedSourceFile && selectedTargetFile;
  
  return (
    <Paper withBorder p="md">
      <Stack>
        <Group justify="space-between">
          <Title order={4}>File Selection</Title>
          <Group>
            <Tooltip label="Refresh files">
              <ActionIcon 
                variant="light" 
                color="blue" 
                onClick={onRefresh}
                loading={loading}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Expand view">
              <ActionIcon variant="light" color="gray">
                <IconArrowsMaximize size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        
        <Divider />
        
        <Flex gap="md">
          {/* Source files */}
          <Box style={{ flex: 1 }}>
            <Group mb="xs" position="apart">
              <Text fw={500}>Source Files</Text>
              <Tooltip label="Browse folder">
                <ActionIcon size="sm" variant="subtle">
                  <IconFolderOpen size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
            
            <Paper withBorder p="xs" style={{ height: 200, overflowY: 'auto' }}>
              {sourceFiles.length > 0 ? (
                <Stack spacing={4}>
                  {sourceFiles.map((file, index) => (
                    <FileTreeItem
                      key={index}
                      name={file.name}
                      isSelected={selectedSourceFile === file.path}
                      onClick={() => onSelectSourceFile(file.path)}
                    />
                  ))}
                </Stack>
              ) : (
                <Text size="sm" color="dimmed" align="center" pt="lg">
                  No files available
                </Text>
              )}
            </Paper>
          </Box>
          
          {/* Target files */}
          <Box style={{ flex: 1 }}>
            <Group mb="xs" position="apart">
              <Text fw={500}>Target Files</Text>
              <Tooltip label="Browse folder">
                <ActionIcon size="sm" variant="subtle">
                  <IconFolderOpen size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
            
            <Paper withBorder p="xs" style={{ height: 200, overflowY: 'auto' }}>
              {targetFiles.length > 0 ? (
                <Stack spacing={4}>
                  {targetFiles.map((file, index) => (
                    <FileTreeItem
                      key={index}
                      name={file.name}
                      isSelected={selectedTargetFile === file.path}
                      onClick={() => onSelectTargetFile(file.path)}
                    />
                  ))}
                </Stack>
              ) : (
                <Text size="sm" color="dimmed" align="center" pt="lg">
                  No files available
                </Text>
              )}
            </Paper>
          </Box>
        </Flex>
        
        <Group position="right">
          <Button 
            onClick={onCompare}
            disabled={!canCompare}
            leftIcon={<IconArrowsMaximize size={16} />}
          >
            Compare Files
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
} 