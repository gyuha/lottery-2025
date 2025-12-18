# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vite + React Three Fiber (R3F) 3D application built with React 19 and Three.js. Uses `@react-three/fiber` v9.4.2 (paired with React 19) for declarative 3D scene composition.

## Development Commands

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## Architecture

### React Three Fiber Pattern

**Component Structure**: 3D objects are React components that return JSX-like Three.js primitives:
- `<Canvas>` wraps the entire 3D scene and creates WebGL context
- Geometry primitives: `<boxGeometry>`, `<sphereGeometry>`, etc.
- Material primitives: `<meshStandardMaterial>`, `<meshBasicMaterial>`, etc.
- Lights: `<ambientLight>`, `<spotLight>`, `<pointLight>`, etc.

**Animation Hook**: `useFrame` from `@react-three/fiber` runs on every frame
- Receives `(state, delta)` parameters
- `delta` is time since last frame (use for frame-rate independent animation)
- Must use refs to access Three.js objects directly

**Interaction Pattern**: R3F supports pointer events on meshes:
- `onClick`, `onPointerOver`, `onPointerOut` work directly on `<mesh>`
- Combine with React state for interactive 3D UIs

### Entry Point

`src/main.jsx` → React 19 StrictMode → `App.jsx`

### Component Pattern Example

```jsx
function Box(props) {
  const meshRef = useRef()
  const [state, setState] = useState()

  useFrame((state, delta) => {
    // Animation logic using delta
    meshRef.current.rotation.x += delta
  })

  return (
    <mesh {...props} ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial />
    </mesh>
  )
}
```

## Configuration

**Vite**: Standard React plugin configuration, no custom setup required for R3F

**ESLint**: Flat config format with:
- React Hooks linting (recommended rules)
- React Refresh for Vite
- Custom rule: `no-unused-vars` ignores uppercase/constant names

## Styling

Fullscreen canvas approach:
- `App.css` sets viewport dimensions (100vw/100vh)
- `index.css` provides minimal global styles
- 3D canvas takes full viewport, no traditional layout needed
