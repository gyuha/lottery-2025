import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, TrackballControls } from '@react-three/drei'
import { Object3D, Vector3 } from 'three'
import { Easing, Tween, removeAll as tweenRemoveAll, update as tweenUpdate } from '@tweenjs/tween.js'
import './index.css'

type Mode = 'table' | 'sphere' | 'helix' | 'grid' | 'winner'

interface Participant {
  id: string
  index: number
  name: string
  color: string
  column: number
  row: number
}

type TargetMap = Record<Mode, Object3D[]>

const DEFAULT_NAMES = [
  'Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
  'Kevin', 'Liam', 'Mallory', 'Niaj', 'Oscar', 'Peggy', 'Quentin', 'Rose', 'Sybil', 'Trent',
  'Uma', 'Victor', 'Walter', 'Xavier', 'Yvonne', 'Zelda', 'Arthur', 'Beatrice', 'Clarence', 'Dorothy',
  'Eugene', 'Florence', 'Gilbert', 'Harriet', 'Isidore', 'Joan', 'Kenneth', 'Lucille', 'Millard', 'Nellie',
  'Oswald', 'Phyllis', 'Quincy', 'Roberta', 'Sherman', 'Thelma', 'Ulysses', 'Virginia', 'Wallace', 'Xena'
]

function buildTargets(count: number): TargetMap {
  const targets: TargetMap = { table: [], sphere: [], helix: [], grid: [], winner: [] }
  const vector = new Vector3()

  // Table (5x10 grid)
  for (let i = 0; i < count; i++) {
    const object = new Object3D()
    const col = i % 10
    const row = Math.floor(i / 10)
    object.position.x = col * 160 - 720
    object.position.y = -(row * 200) + 400
    targets.table.push(object)
  }

  // Sphere
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count)
    const theta = Math.sqrt(count * Math.PI) * phi
    const object = new Object3D()
    object.position.setFromSphericalCoords(800, phi, theta)
    vector.copy(object.position).multiplyScalar(2)
    object.lookAt(vector)
    targets.sphere.push(object)
  }

  // Helix
  for (let i = 0; i < count; i++) {
    const theta = i * 0.175 + Math.PI
    const y = -(i * 12) + 300
    const object = new Object3D()
    object.position.setFromCylindricalCoords(900, theta, y)
    vector.set(object.position.x * 2, object.position.y, object.position.z * 2)
    object.lookAt(vector)
    targets.helix.push(object)
  }

  // Grid
  for (let i = 0; i < count; i++) {
    const object = new Object3D()
    object.position.x = ((i % 5) * 400) - 800
    object.position.y = -((Math.floor(i / 5) % 5) * 400) + 800
    object.position.z = Math.floor(i / 25) * 1000 - 2000
    targets.grid.push(object)
  }

  // Winner (Center)
  for (let i = 0; i < count; i++) {
    const object = new Object3D()
    object.position.set(0, 0, 2000)
    object.scale.set(3, 3, 3)
    targets.winner.push(object)
  }

  return targets
}

function ParticipantCard({ participant, isWinner, isDrawing }: { participant: Participant, isWinner: boolean, isDrawing: boolean }) {
  return (
    <div
      className={`element transition-all duration-500 ${isWinner ? 'winner-card' : ''} ${!isWinner && !isDrawing && isWinner !== undefined ? 'opacity-20' : ''}`}
      style={{
        backgroundColor: participant.color,
        boxShadow: isWinner ? '0 0 30px rgba(255, 215, 0, 0.8)' : undefined,
        border: isWinner ? '2px solid gold' : undefined
      }}
    >
      <div className="number">{participant.index + 1}</div>
      <div className="symbol">{participant.name[0]}</div>
      <div className="details">
        <span className="name">{participant.name}</span>
      </div>
    </div>
  )
}

function LotteryScene({ mode, participants, winnerIndex, isDrawing }: { mode: Mode, participants: Participant[], winnerIndex: number | null, isDrawing: boolean }) {
  const targets = useMemo(() => buildTargets(participants.length), [participants.length])
  const itemRefs = useRef<Object3D[]>([])
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()

  const transform = useCallback((targetKey: Mode, duration = 2000) => {
    const targetList = targets[targetKey]
    if (!targetList) return
    tweenRemoveAll()

    itemRefs.current.forEach((object, i) => {
      if (!object) return
      
      let target: Object3D | undefined
      
      if (targetKey === 'winner') {
        if (i === winnerIndex) {
          target = targetList[i]
        } else {
          // Send others to random distant positions
          target = new Object3D()
          target.position.set(
            (Math.random() - 0.5) * 10000,
            (Math.random() - 0.5) * 10000,
            -5000
          )
        }
      } else {
        target = targetList[i]
      }

      if (!target) return

      const positionDuration = Math.random() * duration + duration
      const rotationDuration = Math.random() * duration + duration

      new Tween(object.position)
        .to({ x: target.position.x, y: target.position.y, z: target.position.z }, positionDuration)
        .easing(Easing.Exponential.InOut)
        .start()

      new Tween(object.rotation)
        .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, rotationDuration)
        .easing(Easing.Exponential.InOut)
        .start()
        
      if (targetKey === 'winner' && i === winnerIndex) {
        new Tween(object.scale)
          .to({ x: 2, y: 2, z: 2 }, duration)
          .easing(Easing.Back.Out)
          .start()
      } else {
        new Tween(object.scale)
          .to({ x: 1, y: 1, z: 1 }, duration)
          .easing(Easing.Exponential.Out)
          .start()
      }
    })

    // Reset camera when showing winner
    if (targetKey === 'winner') {
       new Tween(camera.position)
        .to({ x: 0, y: 0, z: 4000 }, duration)
        .easing(Easing.Exponential.InOut)
        .start()
       camera.lookAt(0, 0, 0)
    }
  }, [targets, winnerIndex, camera])

  useEffect(() => {
    transform(mode)
  }, [mode, transform])

  useFrame((state) => {
    tweenUpdate(state.clock.elapsedTime * 1000)
    controlsRef.current?.update()
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[100, 100, 100]} />
      <group>
        {participants.map((p, i) => (
          <group
            key={p.id}
            ref={(ref) => {
              if (ref) {
                itemRefs.current[i] = ref
                if (!ref.userData.initialized) {
                  ref.position.set(
                    (Math.random() - 0.5) * 4000,
                    (Math.random() - 0.5) * 4000,
                    (Math.random() - 0.5) * 4000
                  )
                  ref.userData.initialized = true
                }
              }
            }}
          >
            <group scale={30}>
              <Html
                transform
                pointerEvents="auto"
                rotation={[0, Math.PI, 0]}
              >
                <ParticipantCard 
                  participant={p} 
                  isWinner={i === winnerIndex} 
                  isDrawing={isDrawing}
                />
              </Html>
            </group>
          </group>
        ))}
      </group>
      <TrackballControls ref={controlsRef} minDistance={500} maxDistance={10000} />
    </>
  )
}

function App() {
  const [mode, setMode] = useState<Mode>('table')
  const [namesText, setNamesText] = useState(DEFAULT_NAMES.join('\n'))
  const [participants, setParticipants] = useState<Participant[]>([])
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showDrawMenu, setShowDrawMenu] = useState(false)

  useEffect(() => {
    const names = namesText.split('\n').filter(n => n.trim() !== '')
    const newParticipants = names.map((name, i) => ({
      id: `${name}-${i}`,
      index: i,
      name: name.trim(),
      color: `rgba(0,127,127,${Math.random() * 0.5 + 0.25})`,
      column: i % 10,
      row: Math.floor(i / 10)
    }))
    setParticipants(newParticipants)
  }, [namesText])

  const startDraw = () => {
    if (participants.length === 0 || isDrawing) return
    
    setIsDrawing(true)
    setWinnerIndex(null)
    
    // Step 1: Shuffle positions
    setMode('sphere')
    
    // Step 2: Randomly change modes to create excitement
    setTimeout(() => setMode('helix'), 1000)
    setTimeout(() => setMode('grid'), 2000)
    setTimeout(() => setMode('sphere'), 3000)
    
    // Step 3: Pick a winner after 5 seconds
    setTimeout(() => {
      const luckyIndex = Math.floor(Math.random() * participants.length)
      setWinnerIndex(luckyIndex)
      setMode('winner')
      setIsDrawing(false)
    }, 5000)
  }

  const reset = () => {
    setWinnerIndex(null)
    setMode('table')
    setIsDrawing(false)
  }

  return (
    <div className="page">
      <div className="info">
        <h1>LOTTERY 2025</h1>
      </div>

      <div className={`input-panel ${showDrawMenu ? 'active' : ''}`}>
        <button className="toggle-panel" onClick={() => setShowDrawMenu(!showDrawMenu)}>
          {showDrawMenu ? 'CLOSE' : 'PARTICIPANTS'}
        </button>
        {showDrawMenu && (
          <div className="panel-content">
            <textarea 
              value={namesText} 
              onChange={(e) => setNamesText(e.target.value)}
              placeholder="Enter names (one per line)"
            />
            <div className="panel-footer">
              <p>{participants.length} participants</p>
            </div>
          </div>
        )}
      </div>

      <div className="menu">
        <button type="button" onClick={() => setMode('table')}>TABLE</button>
        <button type="button" onClick={() => setMode('sphere')}>SPHERE</button>
        <button type="button" onClick={() => setMode('helix')}>HELIX</button>
        <button type="button" onClick={() => setMode('grid')}>GRID</button>
        <button 
          type="button" 
          className="draw-btn" 
          onClick={startDraw}
          disabled={isDrawing}
        >
          {isDrawing ? 'DRAWING...' : 'START DRAW'}
        </button>
        {winnerIndex !== null && (
          <button type="button" onClick={reset}>RESET</button>
        )}
      </div>

      <Canvas camera={{ position: [0, 0, 4000], fov: 40 }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#000508']} />
        <fog attach="fog" args={['#000508', 3000, 10000]} />
        <LotteryScene 
          mode={mode} 
          participants={participants} 
          winnerIndex={winnerIndex} 
          isDrawing={isDrawing}
        />
      </Canvas>
    </div>
  )
}

export default App
