import { Sidebar, SidebarBody, SidebarHeader, SidebarItem, SidebarLabel, SidebarSection } from '@/components/sidebar'
import { Home, MessageSquare, Heart, Gamepad2, Users, ChartBar } from 'lucide-react'

const navItems = [
  { label: 'Home', url: '/', icon: Home },
  { label: 'Poll Host', url: '/party/polls', icon: ChartBar },
  { label: 'Kahoot Host', url: '/party/kahoot-host', icon: Gamepad2 },
  { label: 'Kahoot Player', url: '/party/kahoot-player', icon: Users },
  { label: 'Feedback Host', url: '/party/feedback-host', icon: MessageSquare },
  { label: 'Feeling Stream', url: '/party/feelings', icon: Heart },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarItem href="/">
          <SidebarLabel className="text-xl font-bold">Tools</SidebarLabel>
        </SidebarItem>
      </SidebarHeader>
      <SidebarBody>
        <SidebarSection>
          {navItems.map(({ label, url, icon: Icon }) => (
            <SidebarItem key={label} href={url}>
              <Icon />
              <SidebarLabel>{label}</SidebarLabel>
            </SidebarItem>
          ))}
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  )
}
