// Color schemes for visualization
export interface ColorScheme {
  name: string
  landmarks: string
  connections: string
  iris: string
  attention: string
  strain: string
  background: string
}

export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  default: {
    name: "Default",
    landmarks: "#00ff00",
    connections: "#ffffff",
    iris: "#00ffff",
    attention: "#ffff00",
    strain: "#ff0000",
    background: "rgba(0, 0, 0, 0.1)",
  },
  neon: {
    name: "Neon",
    landmarks: "#ff00ff",
    connections: "#00ffff",
    iris: "#ffff00",
    attention: "#00ff00",
    strain: "#ff0000",
    background: "rgba(0, 0, 0, 0.2)",
  },
  ocean: {
    name: "Ocean",
    landmarks: "#00bfff",
    connections: "#1e90ff",
    iris: "#00ced1",
    attention: "#20b2aa",
    strain: "#ff6347",
    background: "rgba(0, 0, 50, 0.1)",
  },
  sunset: {
    name: "Sunset",
    landmarks: "#ff6347",
    connections: "#ffa500",
    iris: "#ff69b4",
    attention: "#ffd700",
    strain: "#dc143c",
    background: "rgba(50, 0, 0, 0.1)",
  },
  matrix: {
    name: "Matrix",
    landmarks: "#00ff00",
    connections: "#00cc00",
    iris: "#00ff00",
    attention: "#00ff00",
    strain: "#ff0000",
    background: "rgba(0, 0, 0, 0.3)",
  },
}

export interface DrawingOptions {
  showLandmarks: boolean
  showConnections: boolean
  showIris: boolean
  showMetrics: boolean
  colorScheme: string
  lineWidth: number
  pointSize: number
}

export const DEFAULT_DRAWING_OPTIONS: DrawingOptions = {
  showLandmarks: true,
  showConnections: true,
  showIris: true,
  showMetrics: true,
  colorScheme: "default",
  lineWidth: 1,
  pointSize: 1,
}
