import { Group, Burger, Title } from '@mantine/core'
import { IconDrone } from '@tabler/icons-react'

export function TopNavbar({ opened, toggle }) {
  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <Group>
          <IconDrone size={24} />
          <Title order={3}>SkyPlan</Title>
        </Group>
      </Group>
    </Group>
  )
} 