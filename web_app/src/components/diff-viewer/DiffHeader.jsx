import React from 'react';
import { Paper, Group, Text, Badge, ActionIcon, Divider } from '@mantine/core';
import { IconChevronLeft, IconRefresh } from '@tabler/icons-react';

/**
 * DiffHeader - Renders the header section of the diff view with file info and controls
 * 
 * @param {Object} props
 * @param {string} props.fileName - Name of the file being compared
 * @param {string} props.fileExtension - File extension for display
 * @param {boolean} props.loading - Whether the diff is loading
 * @param {boolean} props.syncScrollActive - Whether scroll sync is active
 * @param {boolean} props.hasContent - Whether there is content to display
 * @param {Function} props.onBack - Function to navigate back
 * @returns {JSX.Element} - The header component
 */
export function DiffHeader({ 
  fileName, 
  fileExtension, 
  loading, 
  error, 
  syncScrollActive, 
  hasContent,
  onBack 
}) {
  return (
    <Paper 
      withBorder 
      p="sm" 
      mb="md" 
      style={{ 
        backgroundColor: '#25262b', 
        borderColor: '#444', 
        marginBottom: '16px' 
      }}
    >
      <Group position="apart">
        <Group>
          <ActionIcon 
            variant="subtle" 
            onClick={onBack} 
            title="Back to file list"
            color="blue"
          >
            <IconChevronLeft size={18} />
          </ActionIcon>
          <Divider orientation="vertical" />
          <Text size="sm" weight={500} color="white">
            {fileName}
          </Text>
          {fileExtension && (
            <Badge size="xs" variant="filled" color="gray">
              {fileExtension}
            </Badge>
          )}
        </Group>
        <Group spacing="xs">
          {!loading && !error && hasContent && (
            <Badge 
              color={syncScrollActive ? 'teal' : 'yellow'} 
              size="xs"
              variant="light"
            >
              {syncScrollActive ? 'SCROLL SYNC ACTIVE' : 'Initializing Sync...'}
            </Badge>
          )}
          <ActionIcon 
            variant="subtle"
            color="blue"
            title="Refresh diff"
            onClick={() => window.location.reload()}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
} 