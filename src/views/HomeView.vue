<template>
  <div class="home">
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>

    <div class="overlay">
      <div class="logo-container">
        <h1 class="title">HEXLASH</h1>
        <div class="subtitle">{{ $t('menu.subtitle') }}</div>
      </div>

      <div class="menu-actions">
        <button class="btn-fight" @click="startGame">
          <span class="btn-text">{{ $t('menu.play') }}</span>
          <span class="btn-glow"></span>
        </button>
      </div>

      <div class="version">v{{ appVersion }}</div>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three'

export default {
  name: 'HomeView',
  data() {
    return {
      appVersion: __APP_VERSION__,
      renderer: null,
      animationId: null,
    }
  },
  mounted() {
    this.initBackground()
  },
  beforeUnmount() {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    if (this.renderer) this.renderer.dispose()
  },
  methods: {
    startGame() {
      this.$store.dispatch('startGame')
      this.$router.push('/game')
    },
    initBackground() {
      const canvas = this.$refs.bgCanvas
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
      camera.position.z = 5

      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      // Hexagonal grid particles
      const geometry = new THREE.BufferGeometry()
      const count = 300
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)

      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 15
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8

        const isPink = Math.random() > 0.5
        colors[i * 3] = isPink ? 1.0 : 0.8
        colors[i * 3 + 1] = isPink ? 0.024 : 0.2
        colors[i * 3 + 2] = isPink ? 0.435 : 1.0
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      })

      const points = new THREE.Points(geometry, material)
      scene.add(points)

      // Hexagon wireframe
      const hexShape = new THREE.Shape()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const x = Math.cos(angle) * 2
        const y = Math.sin(angle) * 2
        if (i === 0) hexShape.moveTo(x, y)
        else hexShape.lineTo(x, y)
      }
      hexShape.closePath()

      const hexPoints = hexShape.getPoints(6)
      const hexGeom = new THREE.BufferGeometry().setFromPoints(hexPoints)
      const hexLine = new THREE.LineLoop(hexGeom, new THREE.LineBasicMaterial({
        color: 0xFF066F,
        transparent: true,
        opacity: 0.3,
      }))
      scene.add(hexLine)

      const clock = new THREE.Clock()

      const animate = () => {
        this.animationId = requestAnimationFrame(animate)
        const elapsed = clock.getElapsedTime()

        points.rotation.y = elapsed * 0.05
        points.rotation.x = Math.sin(elapsed * 0.03) * 0.1
        hexLine.rotation.z = elapsed * 0.2
        hexLine.scale.setScalar(1 + Math.sin(elapsed * 0.5) * 0.1)

        this.renderer.render(scene, camera)
      }

      animate()

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
      })
    },
  },
}
</script>

<style scoped>
.home {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #000;
}

.bg-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.logo-container {
  text-align: center;
  margin-bottom: 60px;
}

.title {
  font-family: 'Orbitron', sans-serif;
  font-size: 5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #FF066F, #cc33ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  letter-spacing: 0.2em;
  animation: pulseTitle 3s ease-in-out infinite;
}

.subtitle {
  font-family: 'Orbitron', sans-serif;
  font-size: 1rem;
  color: #888;
  letter-spacing: 0.5em;
  margin-top: 10px;
  text-transform: uppercase;
}

.btn-fight {
  position: relative;
  padding: 18px 60px;
  font-family: 'Orbitron', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #FF066F, #cc33ff);
  border: none;
  cursor: pointer;
  clip-path: polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%);
  transition: transform 0.2s, filter 0.2s;
  letter-spacing: 0.15em;
}

.btn-fight:hover {
  transform: scale(1.08);
  filter: brightness(1.3);
}

.btn-fight:active {
  transform: scale(0.95);
}

.version {
  position: absolute;
  bottom: 20px;
  right: 20px;
  font-family: monospace;
  font-size: 0.7rem;
  color: #333;
}

@keyframes pulseTitle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
</style>
