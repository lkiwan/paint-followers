import { useState } from 'react'
import { useGame } from './context/GameContext'
import HomeScreen from './screens/HomeScreen'
import SetupScreen from './screens/SetupScreen'
import RoleRevealScreen from './screens/RoleRevealScreen'
import DrawingScreen from './screens/DrawingScreen'
import VotingScreen from './screens/VotingScreen'
import ResolutionScreen from './screens/ResolutionScreen'

export default function App() {
  const { state } = useGame()
  const [started, setStarted] = useState(false)

  if (!started) return <HomeScreen onStart={() => setStarted(true)} />

  switch (state.phase) {
    case 'setup':
      return <SetupScreen />
    case 'roleReveal':
      return <RoleRevealScreen />
    case 'drawing':
      return <DrawingScreen />
    case 'voting':
      return <VotingScreen />
    case 'resolution':
      return <ResolutionScreen />
    default:
      return <SetupScreen />
  }
}