import { Heading } from '@/components/heading'
import { Text } from '@/components/text'

interface ConnectionHeaderProps {
  readonly roomId: string
  readonly connectionCount: number
}

export function ConnectionHeader({ roomId, connectionCount }: ConnectionHeaderProps) {
  return (
    <div className="mb-6">
      <Heading level={1} className="text-3xl font-bold mb-2">
        Feedback Host
      </Heading>
      <Text className="text-zinc-600 dark:text-zinc-400">
        Room Code:
        {' '}
        <span className="font-mono font-bold text-lg">{roomId}</span>
      </Text>
      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
        {connectionCount}
        {' '}
        {connectionCount === 1 ? 'person' : 'people'}
        {' '}
        connected
      </Text>
    </div>
  )
}
