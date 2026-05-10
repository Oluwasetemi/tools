import { createFileRoute, Link } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { db } from '@/db'
import { kahootGames, kahootPlayers } from '@/db/schema'

interface PlayerRow {
  id: number
  name: string
  score: number
}

interface GameRow {
  id: number
  roomId: string
  gameName: string
  state: string
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  playerCount: number
  winner: string | null
  winnerScore: number
  topPlayers: PlayerRow[]
}

async function getKahootHistory(): Promise<GameRow[]> {
  const games = await db
    .select()
    .from(kahootGames)
    .orderBy(desc(kahootGames.createdAt))
    .limit(50)

  const result: GameRow[] = []
  for (const game of games) {
    const players = await db
      .select()
      .from(kahootPlayers)
      .where(eq(kahootPlayers.gameId, game.id))
      .orderBy(desc(kahootPlayers.score))
      .limit(10)

    result.push({
      id: game.id,
      roomId: game.roomId,
      gameName: game.gameName,
      state: game.state,
      createdAt: game.createdAt.toISOString(),
      startedAt: game.startedAt?.toISOString() ?? null,
      endedAt: game.endedAt?.toISOString() ?? null,
      playerCount: players.length,
      winner: players[0]?.playerName ?? null,
      winnerScore: players[0]?.score ?? 0,
      topPlayers: players.map(p => ({ id: p.id, name: p.playerName, score: p.score })),
    })
  }
  return result
}

function KahootHistoryPage() {
  const { gameHistory } = Route.useLoaderData()
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="h-1 bg-[#D4380D]" />

      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link to="/" className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <Link to="/party/kahoot-host" className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 hover:text-[#1A1008] transition-colors no-underline">
          ← Kahoot Host
        </Link>
      </nav>

      <div className="px-5 sm:px-8 pt-8 pb-6 border-b-2 border-[#1A1008]">
        <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
          Quiz History<span className="text-[#D4380D]">.</span>
        </h1>
        <p className="f-mono text-[11px] text-[#1A1008]/40 mt-1">{gameHistory.length} games</p>
      </div>

      <div className="px-5 sm:px-8 py-6 max-w-3xl">
        {gameHistory.length === 0
          ? (
              <div className="border-2 border-dashed border-[#1A1008]/20 p-12 text-center">
                <div className="text-4xl mb-4">⚡</div>
                <p className="f-mono text-[12px] text-[#1A1008]/40">No games yet. Host your first quiz to see history here.</p>
              </div>
            )
          : (
              <div className="space-y-3">
                {gameHistory.map(game => (
                  <div key={game.id} className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008]">
                    <button
                      onClick={() => setExpanded(expanded === game.id ? null : game.id)}
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-[#D4380D]/[0.03] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="f-display font-bold text-[15px] text-[#1A1008] leading-snug truncate">{game.gameName}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="f-mono text-[10px] text-[#1A1008]/40">
                            {new Date(game.createdAt).toLocaleDateString()}
                          </span>
                          <span className="f-mono text-[10px] text-[#1A1008]/40">{game.playerCount} players</span>
                          {game.winner && (
                            <span className="f-mono text-[10px] text-[#D4380D]">
                              🏆 {game.winner} ({game.winnerScore} pts)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={[
                          'f-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border',
                          game.state === 'ended'
                            ? 'border-[#1A1008]/25 text-[#1A1008]/40'
                            : 'border-[#1B6B3A] text-[#1B6B3A] bg-[#1B6B3A]/[0.07]',
                        ].join(' ')}>
                          {game.state}
                        </span>
                        <span className="f-mono text-[11px] text-[#1A1008]/30">{expanded === game.id ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {expanded === game.id && (
                      <div className="border-t border-[#1A1008]/10 px-5 py-4">
                        <div className="f-mono text-[9px] tracking-[0.18em] uppercase text-[#D4380D] mb-3">Leaderboard</div>
                        <div className="space-y-1.5">
                          {game.topPlayers.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-[#1A1008]/[0.06] last:border-0">
                              <span className="f-mono text-[11px] font-bold text-[#1A1008]/30 w-5">{i + 1}</span>
                              <span className="f-mono text-[13px] text-[#1A1008] flex-1">{p.name}</span>
                              <span className="f-mono text-[12px] font-bold text-[#D4380D]">{p.score}</span>
                            </div>
                          ))}
                          {game.topPlayers.length === 0 && (
                            <p className="f-mono text-[11px] text-[#1A1008]/30">No players joined this game.</p>
                          )}
                        </div>
                        <p className="f-mono text-[9px] text-[#1A1008]/25 pt-3">Room: {game.roomId}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/party/kahoot-host/history')({
  loader: async () => {
    const gameHistory = await getKahootHistory()
    return { gameHistory }
  },
  head: () => ({ meta: [{ title: 'Quiz History — Tools' }] }),
  component: KahootHistoryPage,
})
