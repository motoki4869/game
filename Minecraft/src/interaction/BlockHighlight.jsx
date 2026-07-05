import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useInteractionStore } from './interactionStore.js'

const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002))
const outlineMaterial = new THREE.LineBasicMaterial({ color: '#111111' })
const crackGeometry = new THREE.BoxGeometry(1.004, 1.004, 1.004)

// Vanilla-style selection box on the targeted block, plus a darkening
// overlay whose opacity tracks hold-to-break progress. Reads the
// interaction store imperatively each frame to avoid React re-renders.
export default function BlockHighlight() {
  const outlineRef = useRef()
  const crackRef = useRef()
  const crackMaterialRef = useRef()

  useFrame(() => {
    const { target, breakProgress } = useInteractionStore.getState()
    const hit = target?.hit

    if (outlineRef.current) {
      outlineRef.current.visible = Boolean(hit)
      if (hit) outlineRef.current.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5)
    }
    if (crackRef.current && crackMaterialRef.current) {
      const showCracks = Boolean(hit) && breakProgress > 0
      crackRef.current.visible = showCracks
      if (showCracks) {
        crackRef.current.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5)
        crackMaterialRef.current.opacity = breakProgress * 0.55
      }
    }
  })

  return (
    <>
      <lineSegments ref={outlineRef} geometry={outlineGeometry} material={outlineMaterial} visible={false} />
      <mesh ref={crackRef} geometry={crackGeometry} visible={false}>
        <meshBasicMaterial ref={crackMaterialRef} color="#000000" transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}
