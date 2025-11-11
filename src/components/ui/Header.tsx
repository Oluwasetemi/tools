import { Moon, Settings, Sun, User } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Avatar } from '@/components/avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/components/dropdown'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '@/components/navbar'
import { useTheme } from '@/hooks/use-theme'

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Navbar>
      <NavbarSection>
        <Link to="/" className="text-xl font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          TOOLS
        </Link>
      </NavbarSection>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem onClick={toggleTheme} aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}>
          {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
        </NavbarItem>
        <Dropdown>
          <DropdownButton as={NavbarItem}>
            <Avatar initials="U" square />
          </DropdownButton>
          <DropdownMenu className="min-w-64" anchor="bottom end">
            <DropdownItem href="/profile">
              <User />
              <DropdownLabel>Profile</DropdownLabel>
            </DropdownItem>
            <DropdownItem href="/settings">
              <Settings />
              <DropdownLabel>Settings</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="https://oluwasetemi.dev" target="_blank" rel="noopener noreferrer">
              <User />
              <DropdownLabel>@oluwasetemi</DropdownLabel>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarSection>
    </Navbar>
  )
}
