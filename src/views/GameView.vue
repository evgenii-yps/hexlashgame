<template>
  <div class="game-container">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>

    <!-- HUD -->
    <div class="hud">
      <div class="hud-left">
        <div class="hud-label">{{ $t('game.score') }}</div>
        <div class="hud-value score">{{ score }}</div>
      </div>
      <div class="hud-center">
        <div class="hud-label">{{ $t('game.round') }}</div>
        <div class="hud-value round">{{ round }}</div>
      </div>
      <div class="hud-right">
        <div class="hud-label">{{ $t('game.health') }}</div>
        <div class="health-bar">
          <div class="health-fill" :style="{ width: health + '%' }"></div>
        </div>
        <div class="hud-value health">{{ health }}%</div>
      </div>
    </div>

    <!-- Hit indicator -->
    <transition name="hit-flash">
      <div v-if="showHit" class="hit-indicator">{{ $t('game.hit') }}</div>
    </transition>

    <!-- Game Over overlay -->
    <div v-if="isGameOver" class="game-over-overlay">
      <div class="game-over-content">
        <h2 class="ko-text">{{ $t('game.ko') }}</h2>
        <p class="final-score">{{ $t('game.score') }}: {{ score }}</p>
        <div class="game-over-actions">
          <button class="btn-action btn-restart" @click="restart">{{ $t('game.restart') }}</button>
          <button class="btn-action btn-back" @click="goHome">{{ $t('game.back') }}</button>
        </div>
      </div>
    </div>

    <!-- Back button -->
    <button class="btn-back-small" @click="goHome">&larr;</button>
  </div>
</template>

<script>
import * as THREE from 'three'

export default {
  name: 'GameView',
  data() {
    return {
      renderer: null,
      animationId: null,
      showHit: false,
      punchBag: null,
      punchBagSwing: 0,
      scene: null,
      camera: null,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
    }
  },
  computed: {
    score() { return this.$store.state.score },
    health() { return this.$store.state.health },
    round() { return this.$store.state.round },
    isGameOver() { return this.$store.getters.isGameOver },
  },
  mounted() {
    this.initGame()
    window.addEventListener('resize', this.onResize)
  },
  beforeUnmount() {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    if (this.renderer) this.renderer.dispose()
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    initGame() {
      const canvas = this.$refs.gameCanvas
      this.scene = new THREE.Scene()
      this.scene.fog = new THREE.Fog(0x000000, 8, 25)

      this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100)
      this.camera.position.set(0, 1.5, 5)

      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.shadowMap.enabled = true
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping
      this.renderer.toneMappingExposure = 1.2

      // Lighting
      const ambient = new THREE.AmbientLight(0x222222)
      this.scene.add(ambient)

      const spotLight = new THREE.SpotLight(0xFF066F, 30, 20, Math.PI / 4, 0.5)
      spotLight.position.set(0, 8, 2)
      spotLight.castShadow = true
      this.scene.add(spotLight)

      const spotLight2 = new THREE.SpotLight(0xcc33ff, 20, 20, Math.PI / 4, 0.5)
      spotLight2.position.set(-3, 6, -2)
      this.scene.add(spotLight2)

      const rimLight = new THREE.DirectionalLight(0x3366ff, 2)
      rimLight.position.set(3, 4, -3)
      this.scene.add(rimLight)

      // Floor — hexagonal arena
      this.createHexArena()

      // Punching bag
      this.createPunchBag()

      // Ring ropes (simple cylinders)
      this.createRingPosts()

      // Click/touch handler
      canvas.addEventListener('click', this.onCanvasClick)
      canvas.addEventListener('touchstart', this.onCanvasTouch, { passive: false })

      this.animate()
    },

    createHexArena() {
      const hexShape = new THREE.Shape()
      const radius = 4
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        if (i === 0) hexShape.moveTo(x, y)
        else hexShape.lineTo(x, y)
      }
      hexShape.closePath()

      const floorGeom = new THREE.ShapeGeometry(hexShape)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.8,
        metalness: 0.3,
      })
      const floor = new THREE.Mesh(floorGeom, floorMat)
      floor.rotation.x = -Math.PI / 2
      floor.receiveShadow = true
      this.scene.add(floor)

      // Hex border glow
      const hexPoints = hexShape.getPoints(6)
      const borderGeom = new THREE.BufferGeometry().setFromPoints(
        hexPoints.map(p => new THREE.Vector3(p.x, 0.01, p.y))
      )
      const borderMat = new THREE.LineBasicMaterial({ color: 0xFF066F, transparent: true, opacity: 0.6 })
      const borderLine = new THREE.LineLoop(borderGeom, borderMat)
      this.scene.add(borderLine)
    },

    createPunchBag() {
      const group = new THREE.Group()

      // Chain
      const chainGeom = new THREE.CylinderGeometry(0.02, 0.02, 2, 8)
      const chainMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 })
      const chain = new THREE.Mesh(chainGeom, chainMat)
      chain.position.y = 3.5
      group.add(chain)

      // Bag body
      const bagGeom = new THREE.CylinderGeometry(0.4, 0.45, 1.5, 16)
      const bagMat = new THREE.MeshStandardMaterial({
        color: 0x880000,
        roughness: 0.6,
        metalness: 0.1,
      })
      const bag = new THREE.Mesh(bagGeom, bagMat)
      bag.position.y = 1.8
      bag.castShadow = true
      bag.name = 'punchBag'
      group.add(bag)

      // Bottom cap
      const capGeom = new THREE.SphereGeometry(0.45, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
      const cap = new THREE.Mesh(capGeom, bagMat)
      cap.position.y = 1.05
      cap.castShadow = true
      cap.name = 'punchBag'
      group.add(cap)

      // Ceiling mount
      const mountGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16)
      const mountMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 })
      const mount = new THREE.Mesh(mountGeom, mountMat)
      mount.position.y = 4.5
      group.add(mount)

      this.punchBag = group
      this.scene.add(group)
    },

    createRingPosts() {
      const postMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 })

      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const x = Math.cos(angle) * 3.8
        const z = Math.sin(angle) * 3.8

        const postGeom = new THREE.CylinderGeometry(0.06, 0.06, 3, 8)
        const post = new THREE.Mesh(postGeom, postMat)
        post.position.set(x, 1.5, z)
        post.castShadow = true
        this.scene.add(post)
      }
    },

    onCanvasClick(e) {
      if (this.isGameOver) return
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      this.tryHit()
    },

    onCanvasTouch(e) {
      if (this.isGameOver) return
      e.preventDefault()
      const touch = e.touches[0]
      this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1
      this.tryHit()
    },

    tryHit() {
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const intersects = this.raycaster.intersectObjects(this.punchBag.children, true)

      if (intersects.length > 0) {
        const damage = Math.floor(Math.random() * 5) + 3
        this.$store.dispatch('hit', damage)
        this.punchBagSwing = 0.4
        this.flashHit()
      }
    },

    flashHit() {
      this.showHit = true
      setTimeout(() => { this.showHit = false }, 400)
    },

    restart() {
      this.$store.dispatch('startGame')
      this.punchBagSwing = 0
    },

    goHome() {
      this.$store.commit('RESET_GAME')
      this.$router.push('/')
    },

    onResize() {
      if (!this.camera || !this.renderer) return
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    },

    animate() {
      this.animationId = requestAnimationFrame(this.animate)

      // Punching bag swing physics
      if (this.punchBag) {
        if (this.punchBagSwing > 0.01) {
          this.punchBagSwing *= 0.95
        } else {
          this.punchBagSwing = 0
        }
        this.punchBag.rotation.z = Math.sin(Date.now() * 0.01) * this.punchBagSwing
        this.punchBag.rotation.x = Math.cos(Date.now() * 0.008) * this.punchBagSwing * 0.5
      }

      this.renderer.render(this.scene, this.camera)
    },
  },
}
</script>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #000;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* HUD */
.hud {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 20px 30px;
  pointer-events: none;
  z-index: 10;
}

.hud-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.65rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 4px;
}

.hud-value {
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
}

.hud-value.score {
  font-size: 1.8rem;
  color: #FF066F;
}

.hud-value.round {
  font-size: 1.4rem;
  color: #cc33ff;
  text-align: center;
}

.hud-value.health {
  font-size: 0.9rem;
  color: #eee;
  text-align: right;
}

.hud-center {
  text-align: center;
}

.hud-right {
  text-align: right;
}

.health-bar {
  width: 140px;
  height: 8px;
  background: #222;
  border-radius: 4px;
  overflow: hidden;
  margin-left: auto;
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF066F, #ff4488);
  transition: width 0.3s ease;
  border-radius: 4px;
}

/* Hit indicator */
.hit-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Orbitron', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  color: #FF066F;
  text-shadow: 0 0 30px rgba(255, 6, 111, 0.8);
  pointer-events: none;
  z-index: 20;
}

.hit-flash-enter-active {
  animation: hitPop 0.4s ease-out;
}

.hit-flash-leave-active {
  animation: hitFade 0.3s ease-in;
}

@keyframes hitPop {
  0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

@keyframes hitFade {
  0% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -60%) scale(1.5); }
}

/* Game Over */
.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fadeIn 0.5s ease;
}

.game-over-content {
  text-align: center;
}

.ko-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #FF066F, #cc33ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
}

.final-score {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.5rem;
  color: #eee;
  margin-bottom: 40px;
}

.game-over-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.btn-action {
  padding: 14px 36px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  clip-path: polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%);
  transition: transform 0.2s;
}

.btn-restart {
  background: linear-gradient(135deg, #FF066F, #cc33ff);
  color: #fff;
}

.btn-back {
  background: #222;
  color: #aaa;
}

.btn-action:hover {
  transform: scale(1.05);
}

.btn-back-small {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: none;
  border: 1px solid #333;
  color: #666;
  font-size: 1.2rem;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  z-index: 10;
  transition: color 0.2s, border-color 0.2s;
}

.btn-back-small:hover {
  color: #FF066F;
  border-color: #FF066F;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
