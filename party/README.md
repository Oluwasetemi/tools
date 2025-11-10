# PartyKit Servers

This directory contains PartyKit server implementations for real-time multiplayer features.

## Available Servers

### 1. Polls Server (`polls.ts`)

Real-time polling system where users can create polls, vote, and see results update live.

**Features:**
- Create polls with multiple options
- Real-time vote updates
- One vote per user
- Poll creator can end the poll
- Connection count tracking

**Client Usage:**
```tsx
import { PollClient } from '~/components/PollClient'

<PollClient
  roomId="my-poll-room"
  host="localhost:1999"
/>
```

**Demo:** `/demo/party/polls`

### 2. Kahoot Server (`kahoot.ts`)

Kahoot-style quiz game with real-time gameplay, scoring, and leaderboards.

**Features:**
- Host creates games with multiple questions
- Players join with their names
- Real-time question delivery
- Time-based scoring (faster = more points)
- Live leaderboards
- Final rankings

**Host Usage:**
```tsx
import { KahootHost } from '~/components/KahootHost'

<KahootHost
  roomId="game-xyz"
  host="localhost:1999"
/>
```

**Player Usage:**
```tsx
import { KahootPlayer } from '~/components/KahootPlayer'

<KahootPlayer
  roomId="game-xyz"
  playerName="John"
  host="localhost:1999"
/>
```

**Demo:**
- Host: `/demo/party/kahoot-host`
- Player: `/demo/party/kahoot-player?room=<room-id>`

## Development

### Setup

1. Install dependencies (already done):
```bash
bun install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

### Running PartyKit Server

Start the PartyKit development server:

```bash
bunx partykit dev
```

This will start the PartyKit server on `localhost:1999`.

### Running the Application

In another terminal, start the Vite development server:

```bash
bun run dev
```

This will start the application on `localhost:3000`.

### Testing

1. Open the polls demo at `http://localhost:3000/demo/party/polls`
2. Open the same URL in multiple browser windows to see real-time updates
3. Create a poll in one window and vote in others

For Kahoot:
1. Open the host dashboard at `http://localhost:3000/demo/party/kahoot-host`
2. Copy the player link and open it in other windows/devices
3. Create questions, wait for players, and start the game

## Deployment

### Deploy to PartyKit

1. Login to PartyKit:
```bash
bunx partykit login
```

2. Deploy your servers:
```bash
bunx partykit deploy
```

3. Update your `.env` file with the production PartyKit URL:
```
VITE_PARTYKIT_HOST=your-project.partykit.dev
```

## Architecture

### Polls Server

```
Client Message Types:
- create_poll: Create a new poll
- vote: Submit a vote
- end_poll: End the current poll
- get_results: Request current results

Server Message Types:
- poll_created: Poll was created
- poll_updated: Poll state changed
- poll_ended: Poll was ended
- error: Error occurred
- connection_count: Number of connected users
```

### Kahoot Server

```
Client Message Types (Host):
- host_create: Create a game
- host_start: Start the game
- host_next_question: Move to next question
- host_end_game: End the game

Client Message Types (Player):
- player_join: Join the game
- player_answer: Submit an answer

Server Message Types:
- game_created: Game was created
- player_joined: New player joined
- game_started: Game started
- question_started: New question
- question_ended: Question ended with results
- game_ended: Game ended with final rankings
- player_answered: A player submitted an answer
- game_state: Current game state
- error: Error occurred
```

## Storage

Both servers use PartyKit's built-in storage:
- **Polls**: Stores poll data and voter list
- **Kahoot**: Stores game state, questions, and player data

Storage persists across server restarts within the same room.

## Configuration

The `partykit.json` file configures the available parties:

```json
{
  "parties": {
    "polls": "party/polls.ts",
    "kahoot": "party/kahoot.ts"
  }
}
```

Each party is accessible via its name in the PartySocket connection.
