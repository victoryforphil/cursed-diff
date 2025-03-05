import { 
  Stack, 
  Text, 
  Group, 
  UnstyledButton, 
  rem, 
  Title, 
  Divider, 
  ScrollArea 
} from '@mantine/core'
import { 
  IconFile3d
} from '@tabler/icons-react'
import { NavLink, useLocation } from 'react-router-dom'
// Navigation link component
function NavbarLink({ 
  icon: Icon, 
  label, 
  to, 
  active 
}) {
  return (
    <NavLink to={to} style={{ textDecoration: 'none' }}>
      <UnstyledButton
        style={{
          display: 'block',
          width: '100%',
          padding: `${rem(8)} ${rem(12)}`,
          borderRadius: rem(6),
          color: active ? 'var(--mantine-primary-color)' : 'inherit',
          backgroundColor: active ? 'var(--mantine-primary-color-light)' : 'transparent',
        }}
      >
        <Group>
          <Icon size={16} />
          <Text size="sm">{label}</Text>
        </Group>
      </UnstyledButton>
    </NavLink>
  )
}

export function Sidebar() {
  const location = useLocation()
  
  return (
    <Stack h="100%" style={{ justifyContent: 'space-between' }}>
      <Stack>
        <Title order={4} mb="xs">Mission Planner</Title>
        
        <Divider my="sm" />
        
        <ScrollArea>
          <Stack>
            <NavbarLink 
              icon={IconFile3d}
              label="Files"
              to="/"
              active={location.pathname === '/'}
            />
          </Stack>
        </ScrollArea>
      </Stack>
      
      <Stack mb="md">
        <Divider />
        <Text size="xs" c="dimmed" ta="center">SkyPlan © 2023</Text>
      </Stack>
    </Stack>
  )
} 