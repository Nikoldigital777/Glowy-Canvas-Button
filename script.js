import gsap from 'https://cdn.skypack.dev/gsap@3.11.0'

// Get the current hour
const hour = new Date().getHours();

// Define color schemes for different times of day
const colorSchemes = {
  morning: { hue: 60, saturation: 100, lightness: 50 },
  day: { hue: 200, saturation: 100, lightness: 50 },
  evening: { hue: 10, saturation: 80, lightness: 50 },
  night: { hue: 240, saturation: 20, lightness: 20 },
};

// Choose a color scheme based on the time of day
let colorScheme;
if (hour < 6) {
  colorScheme = colorSchemes.night;
} else if (hour < 12) {
  colorScheme = colorSchemes.morning;
} else if (hour < 18) {
  colorScheme = colorSchemes.day;
} else {
  colorScheme = colorSchemes.evening;
}

const CONFIG = {
  hue: colorScheme.hue,
  blur: 14,
  active: false,
  winddown: 1.5,
  saturation: colorScheme.saturation,
  lightness: colorScheme.lightness,
  size: 50,
  sizeMultiplier: 0.5,
  scaleBump: 1.75,
}

const RATIO = window.devicePixelRatio || 1

const BUTTON = document.querySelector('.button')
const CANVAS = BUTTON.querySelector('.button__canvas')
CANVAS.height = CANVAS.offsetHeight * RATIO
CANVAS.width = CANVAS.offsetWidth * RATIO
const CONTEXT = CANVAS.getContext('2d')
CONTEXT.filter = `blur(${CONFIG.blur}px) brightness(1.5)`


let TRAILS = []
let activeTrail

let head = {
  active: 1,
}
const FPS = 24
gsap.ticker.fps(FPS)

const DRAW = () => {
  CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height)
  for (let t = 0; t < TRAILS.length; t++) {
    const TRAIL = TRAILS[t]
    CONTEXT.fillStyle = `hsl(${TRAIL.hue} ${CONFIG.saturation}% ${CONFIG.lightness}%)`
    for (const NODE of TRAIL.nodes) {
      const { x, y, active } = NODE
      const RENDER_SIZE = active * CONFIG.size
      CONTEXT.beginPath()
      CONTEXT.arc(
        x,
        y,
        RENDER_SIZE * 0.5,
        0,
        Math.PI * 2
      )
      CONTEXT.fill()
    }
  }
  if (CONFIG.active) {
    const RENDER_SIZE = CONFIG.size * head.active
    CONTEXT.fillStyle = `hsl(${head.hue} ${CONFIG.saturation}% ${CONFIG.lightness}%)`
    CONTEXT.beginPath()
    CONTEXT.arc(
      head.x,
      head.y,
      RENDER_SIZE * 0.5,
      0,
      Math.PI * 2
    )
    CONTEXT.fill()
  } 
}

const ADD_NODE = ({ x, y }) => {
  const BOUNDS = BUTTON.getBoundingClientRect()

  const normalizedX = x - BOUNDS.x
  const normalizedY = y - BOUNDS.y

  const NEW_NODE = {
    id: crypto.randomUUID(),
    x: normalizedX,
    y: normalizedY,
    active: 1,
  }

  head.hue = activeTrail.hue
  head.x = NEW_NODE.x
  head.y = NEW_NODE.y

  activeTrail.nodes.push(NEW_NODE)
}

let count = 0
const INITIATE_TRAIL = ({x, y }) => {
  CONFIG.size = CANVAS.height * CONFIG.sizeMultiplier
  const NEW_TRAIL = {
    id: crypto.randomUUID(),
    hue: count === 0 ? colorScheme.hue : gsap.utils.random(0, 359),
    nodes: [],
  }
  TRAILS.push(NEW_TRAIL)
  activeTrail = TRAILS[TRAILS.length - 1]
  ADD_NODE({ x, y })
  count++
  CONFIG.active = true
}

const REMOVE_NODE = (nodeId, trail) => {
  const node = activeTrail.nodes.filter(node => node.id === nodeId)[0]
  if (node) {
    gsap.to(node, {
      active: 0,
      duration: CONFIG.winddown,
      onComplete: () => {
        trail.nodes.splice(
          trail.nodes.findIndex((node) => node.id === nodeId),
          1
        )
      }
    })
  }
}

const UPDATE_TRAIL = ({ x, y }) => {
  if (activeTrail.nodes.length > 0) {
    REMOVE_NODE(activeTrail.nodes[activeTrail.nodes.length - 1].id, activeTrail)
  }
  ADD_NODE({ x, y })
}

const WIND_TRAIL = () => {
  CONFIG.active = false
  if (activeTrail && activeTrail.nodes.length > 0) {
    for (let n = 0; n < activeTrail.nodes.length; n++) {

      REMOVE_NODE(activeTrail.nodes[n].id, activeTrail)
    }
  }
}

const SCALE_UP = () => {
  gsap.to(head, { active: CONFIG.scaleBump, duration: 0.15 })
}
const SCALE_DOWN = () => {
  gsap.to(head, { active: 1, duration: 0.15 })
}

BUTTON.addEventListener('pointerenter', INITIATE_TRAIL)
BUTTON.addEventListener('pointermove', UPDATE_TRAIL)
BUTTON.addEventListener('pointerleave', WIND_TRAIL)
BUTTON.addEventListener('pointerdown', SCALE_UP)
BUTTON.addEventListener('pointerup', SCALE_DOWN)

gsap.ticker.add(DRAW)
