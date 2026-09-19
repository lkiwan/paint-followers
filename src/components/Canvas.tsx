import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Point, Stroke as StrokeData } from '../types'

interface CanvasProps {
  strokes: StrokeData[]
  /** hex color of the current drawer; null = canvas locked (read-only) */
  activeColor: string | null
  /** brush size in CSS px */
  brushSize?: number
  /** called each time the drawer lifts their finger */
  onStrokeComplete: (points: Point[]) => void
  /** used only as a React key in the parent to reset canvas on new round */
  drawerId: string
}

const STROKE_WIDTH = 5 // default CSS px (before DPR scaling)

/**
 * Multi-stroke drawing canvas.
 * - Players can draw as many strokes as they like.
 * - Canvas is never locked by this component — the parent controls that via activeColor=null.
 * - All committed strokes are redrawn on every render (shared across all drawers).
 * - Uses quadratic midpoint smoothing for fluid lines.
 */
export function Canvas({
  strokes,
  activeColor,
  brushSize = STROKE_WIDTH,
  onStrokeComplete,
  drawerId,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const currentPoints = useRef<Point[]>([])
  const isDrawing = useRef(false)
  const [initialized, setInitialized] = useState(false)

  // ── Setup: size the canvas to the wrapper's pixel dimensions ──────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const dpr = window.devicePixelRatio || 1
    const rect = wrap.getBoundingClientRect()
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctxRef.current = ctx
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    setInitialized(true)
  }, [drawerId]) // re-init only when a completely new round starts (key changes)

  // ── Redraw all committed strokes whenever they change ─────────────────────
  useEffect(() => {
    redrawAll(currentPoints.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, activeColor, initialized])

  // ─────────────────────────────────────────────────────────────────────────
  function redrawAll(livePts: Point[]) {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    const wrap = wrapRef.current
    if (!canvas || !ctx || !wrap) return

    const dpr = window.devicePixelRatio || 1
    // Clear the entire bitmap
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all committed strokes
    for (const s of strokes) {
      drawPath(ctx, s.points, s.color, s.width, dpr, wrap)
    }

    // Draw the current live stroke (in-progress)
    if (livePts.length > 1 && activeColor) {
      drawPath(ctx, livePts, activeColor, brushSize, dpr, wrap)
    }
  }

  function drawPath(
    ctx: CanvasRenderingContext2D,
    pts: Point[],
    color: string,
    width: number,
    dpr: number,
    wrap: HTMLDivElement,
  ) {
    if (pts.length < 2) return

    // Map CSS-space points to canvas-bitmap space
    const { clientWidth: cw, clientHeight: ch } = wrap
    const scaleX = (canvasRef.current?.width ?? cw * dpr) / cw
    const scaleY = (canvasRef.current?.height ?? ch * dpr) / ch

    ctx.strokeStyle = color
    ctx.lineWidth = width * dpr
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(pts[0].x * scaleX, pts[0].y * scaleY)

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const cur = pts[i]
      const midX = (prev.x + cur.x) / 2
      const midY = (prev.y + cur.y) / 2
      ctx.quadraticCurveTo(
        prev.x * scaleX,
        prev.y * scaleY,
        midX * scaleX,
        midY * scaleY,
      )
    }
    ctx.stroke()
  }

  // ─────────────────────────────────────────────────────────────────────────
  function cssPoint(e: PointerEvent<HTMLCanvasElement>): Point {
    const wrap = wrapRef.current
    if (!wrap) return { x: 0, y: 0 }
    const rect = wrap.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handleDown(e: PointerEvent<HTMLCanvasElement>) {
    if (!activeColor || isDrawing.current) return
    isDrawing.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    currentPoints.current = [cssPoint(e)]
  }

  function handleMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || !activeColor) return
    currentPoints.current = [...currentPoints.current, cssPoint(e)]
    redrawAll(currentPoints.current)
  }

  function handleUp() {
    if (!isDrawing.current) return
    isDrawing.current = false
    const pts = currentPoints.current
    currentPoints.current = []
    // Commit only strokes with at least 2 points
    if (pts.length >= 2) {
      onStrokeComplete(pts)
    }
    // Redraw to clear the dangling live line
    redrawAll([])
  }

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        overflow: 'hidden',
        borderRadius: 20,
        border: '3px solid var(--ink, #2A2118)',
        boxShadow: '0 4px 0 var(--ink, #2A2118)',
        background: '#FFFDF5', // warm paper canvas — clearly visible
        cursor: activeColor ? 'crosshair' : 'not-allowed',
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        dir="ltr"
      />
      {/* Locked overlay — shown when it's not this player's turn */}
      {!activeColor && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(246,239,226,0.55)',
            borderRadius: 17,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--dim, #8A7A63)',
              background: 'var(--card, #FFF9EC)',
              border: '2.5px solid var(--ink, #2A2118)',
              borderRadius: 99,
              padding: '6px 18px',
              boxShadow: '0 2px 0 var(--ink, #2A2118)',
            }}
          >
            ✋ القلم مقفول
          </span>
        </div>
      )}
    </div>
  )
}

export default Canvas
