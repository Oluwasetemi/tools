// Returns the PartyKit host for WebSocket connections.
// Dev: VITE_PARTYKIT_HOST=localhost:1999 (direct connection to local PartyKit server)
// Production: VITE_PARTYKIT_HOST=<your-project>.partykit.dev
export function getPartykitHost(): string {
  return import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'
}
