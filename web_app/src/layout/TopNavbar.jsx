import { Group, Burger, Title, ActionIcon, Tooltip } from '@mantine/core'
import { IconGitCompare, IconBrightness, IconHelp } from '@tabler/icons-react'

/**
 * TopNavbar - Main navigation header component
 * 
 * Displays the app title, navigation controls, and utility actions
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.opened - Whether the sidebar is opened (mobile view)
 * @param {Function} props.toggle - Function to toggle the sidebar
 */
export function TopNavbar({ opened, toggle }) {
  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <Group>
          <IconGitCompare size={24} />
          <Title order={3}>Cursed Diff</Title>
        </Group>
      </Group>
      
      <Group>
        <Tooltip label="Toggle theme">
          <ActionIcon variant="subtle" size="md">
            <IconBrightness size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Help">
          <ActionIcon variant="subtle" size="md">
            <IconHelp size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  )
} 