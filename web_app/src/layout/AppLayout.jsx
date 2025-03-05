import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Outlet } from 'react-router-dom'
import { TopNavbar } from './TopNavbar'
import { Sidebar } from './Sidebar'

/**
 * AppLayout - Main application layout component
 * 
 * Provides the overall structure for the app with responsive sidebar,
 * header and main content area
 */
export function AppLayout() {
  const [opened, { toggle }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 50 }}
      navbar={{ 
        width: 280, 
        breakpoint: 'sm', 
        collapsed: { mobile: !opened } 
      }}
      padding="md"
      withBorder={false}
    >
      <AppShell.Header>
        <TopNavbar opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
} 