import { createFileRoute, Link } from '@tanstack/react-router'
import {
  BarChart3Icon,
  HeartIcon,
  MessageSquareIcon,
  SparklesIcon,
} from 'lucide-react'
import clsx from 'clsx'

export const Route = createFileRoute('/')({
  component: PartyHome,
})

const items = [
  {
    title: 'Kahoot Quiz Game',
    description: 'Interactive quiz game with live gameplay and leaderboards.',
    icon: SparklesIcon,
    background: 'bg-purple-500',
    href: '/party/kahoot-host',
  },
  {
    title: 'Real-time Polls',
    description: 'Create and vote on polls with instant results.',
    icon: BarChart3Icon,
    background: 'bg-blue-500',
    href: '/party/polls',
  },
  {
    title: 'Live Feedback',
    description: 'Collect feedback with emoji, text, or score ratings.',
    icon: MessageSquareIcon,
    background: 'bg-green-500',
    href: '/party/feedback-host',
  },
  {
    title: 'Feeling Stream',
    description: 'Pop and broadcast emojis in real-time with friends.',
    icon: HeartIcon,
    background: 'bg-pink-500',
    href: '/party/feelings',
  },
]

function PartyHome() {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Interactive Teaching Tools</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Get started by selecting a tool to engage your students. Created by
        {' '}
        <a
          href="https://oluwasetemi.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
        >
          @oluwasetemi
        </a>
      </p>
      <ul
        role="list"
        className="mt-6 grid grid-cols-1 gap-6 border-y border-gray-200 py-6 sm:grid-cols-2 dark:border-white/10"
      >
        {items.map((item, itemIdx) => (
          <li key={itemIdx} className="flow-root">
            <div className="relative -m-2 flex items-center space-x-4 rounded-xl p-2 focus-within:outline-2 focus-within:outline-indigo-600 hover:bg-gray-50 dark:focus-within:outline-indigo-500 dark:hover:bg-white/5">
              <div
                className={clsx(item.background, 'flex size-16 shrink-0 items-center justify-center rounded-lg')}
              >
                <item.icon aria-hidden="true" className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  <Link to={item.href} className="focus:outline-hidden">
                    <span aria-hidden="true" className="absolute inset-0" />
                    <span>{item.title}</span>
                    <span aria-hidden="true"> &rarr;</span>
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex">
        <a
          href="https://github.com/oluwasetemi/tools"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          View source code on GitHub
          <span aria-hidden="true"> &rarr;</span>
        </a>
      </div>
    </div>
  )
}
