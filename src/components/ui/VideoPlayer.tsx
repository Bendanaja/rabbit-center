'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { cn, isMobile as checkIsMobile } from '@/lib/utils'

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  maxHeight?: string
  autoPlay?: boolean
  onDownload?: () => void
  compact?: boolean
}

const EASE_CURVE = [0.22, 1, 0.36, 1] as const

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface BufferedRange {
  start: number
  end: number
}

interface ProgressBarProps {
  currentTime: number
  duration: number
  buffered: BufferedRange[]
  onSeek: (time: number) => void
  compact?: boolean
}

function ProgressBar({ currentTime, duration, buffered, onSeek, compact }: ProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const getSeekTime = useCallback(
    (clientX: number) => {
      if (!progressRef.current || !duration) return null
      const rect = progressRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      return percentage * duration
    },
    [duration]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true)
      const time = getSeekTime(e.clientX)
      if (time !== null) onSeek(time)
    },
    [getSeekTime, onSeek]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation()
      setIsDragging(true)
      const touch = e.touches[0]
      const time = getSeekTime(touch.clientX)
      if (time !== null) onSeek(time)
    },
    [getSeekTime, onSeek]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const time = getSeekTime(e.clientX)
      if (time !== null) onSeek(time)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const time = getSeekTime(touch.clientX)
      if (time !== null) onSeek(time)
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleEnd)
    document.addEventListener('touchcancel', handleEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)
      document.removeEventListener('touchcancel', handleEnd)
    }
  }, [isDragging, getSeekTime, onSeek])

  const progress = duration ? (currentTime / duration) * 100 : 0

  const bufferedRanges: Array<{ start: number; end: number }> = []
  if (buffered.length > 0 && duration) {
    for (const range of buffered) {
      bufferedRanges.push({
        start: (range.start / duration) * 100,
        end: (range.end / duration) * 100,
      })
    }
  }

  return (
    <div
      ref={progressRef}
      className={cn(
        'group/progress relative w-full cursor-pointer',
        compact ? 'h-3 py-1' : 'h-4 py-1.5'
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className={cn(
        'absolute left-0 right-0 rounded-full bg-neutral-700/60',
        compact ? 'top-1 bottom-1' : 'top-1.5 bottom-1.5'
      )}>
        {bufferedRanges.map((range, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 rounded-full bg-neutral-500/40"
            style={{
              left: `${range.start}%`,
              width: `${range.end - range.start}%`,
            }}
          />
        ))}
      </div>
      <div
        className={cn(
          'absolute left-0 rounded-full bg-primary-500 transition-all',
          compact ? 'top-1 bottom-1' : 'top-1.5 bottom-1.5'
        )}
        style={{ width: `${progress}%` }}
      />
      <motion.div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg transition-opacity',
          isDragging ? 'opacity-100' : 'opacity-0 group-hover/progress:opacity-100',
          compact ? 'w-2.5 h-2.5' : 'w-3 h-3'
        )}
        style={{ left: `${progress}%`, marginLeft: compact ? '-5px' : '-6px' }}
        whileHover={{ scale: 1.3 }}
      />
    </div>
  )
}

interface TimeDisplayProps {
  currentTime: number
  duration: number
  compact?: boolean
}

function TimeDisplay({ currentTime, duration, compact }: TimeDisplayProps) {
  return (
    <div
      className={cn(
        'font-mono text-white/90 tabular-nums',
        compact ? 'text-[10px]' : 'text-xs'
      )}
    >
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>
  )
}

interface VolumeControlProps {
  volume: number
  muted: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  compact?: boolean
  mobile?: boolean
}

function VolumeControl({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
  compact,
  mobile,
}: VolumeControlProps) {
  const [showSlider, setShowSlider] = useState(false)
  const volumeRef = useRef<HTMLDivElement>(null)

  const handleVolumeChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
      if (!volumeRef.current) return
      const rect = volumeRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      onVolumeChange(percentage)
    },
    [onVolumeChange]
  )

  const VolumeIcon = muted || volume === 0 ? VolumeX : Volume2

  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => !mobile && setShowSlider(true)}
      onMouseLeave={() => !mobile && setShowSlider(false)}
    >
      <motion.button
        onClick={onToggleMute}
        className="text-white/90 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
      >
        <VolumeIcon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </motion.button>

      {!mobile && (
        <AnimatePresence>
          {showSlider && (
            <motion.div
              ref={volumeRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: compact ? 50 : 60, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_CURVE }}
              className={cn('relative cursor-pointer', compact ? 'h-1' : 'h-1.5')}
              onClick={handleVolumeChange}
            >
              <div className="absolute inset-0 rounded-full bg-neutral-700/60" />
              <div
                className="absolute top-0 bottom-0 left-0 rounded-full bg-white transition-all"
                style={{ width: `${muted ? 0 : volume * 100}%` }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

interface FullscreenButtonProps {
  isFullscreen: boolean
  onToggle: () => void
  compact?: boolean
}

function FullscreenButton({ isFullscreen, onToggle, compact }: FullscreenButtonProps) {
  const Icon = isFullscreen ? Minimize : Maximize

  return (
    <motion.button
      onClick={onToggle}
      className="text-white/90 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isFullscreen ? 'ออกจากเต็มหน้าจอ' : 'เต็มหน้าจอ'}
    >
      <Icon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
    </motion.button>
  )
}

interface DownloadButtonProps {
  src: string
  compact?: boolean
  onDownload?: () => void
}

function DownloadButton({ src, compact, onDownload }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (onDownload) {
      onDownload()
      return
    }
    setDownloading(true)
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rabbithub-video-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(src, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <motion.button
      onClick={handleDownload}
      disabled={downloading}
      className="text-white/90 hover:text-white transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="ดาวน์โหลดวิดีโอ"
    >
      {downloading ? (
        <Loader2 className={cn('animate-spin', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      ) : (
        <Download className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      )}
    </motion.button>
  )
}

interface BigPlayButtonProps {
  onClick: () => void
  compact?: boolean
}

function BigPlayButton({ onClick, compact }: BigPlayButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="absolute inset-0 z-20 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      aria-label="เล่นวิดีโอ"
    >
      <motion.div
        className={cn(
          'rounded-full bg-black/60 backdrop-blur-sm border-2 border-white/30',
          compact ? 'p-4' : 'p-6'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Play
          className={cn('text-white fill-white', compact ? 'w-8 h-8' : 'w-16 h-16')}
          style={{ marginLeft: compact ? '2px' : '4px' }}
        />
      </motion.div>
    </motion.button>
  )
}

function LoadingOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Loader2 className="w-12 h-12 text-white animate-spin" />
    </motion.div>
  )
}

function BufferingOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="rounded-full bg-black/60 backdrop-blur-sm p-4">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    </motion.div>
  )
}

interface ErrorOverlayProps {
  onRetry: () => void
}

function ErrorOverlay({ onRetry }: ErrorOverlayProps) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AlertTriangle className="w-16 h-16 text-primary-500 mb-4" />
      <p className="text-white text-lg mb-4">เกิดข้อผิดพลาด</p>
      <motion.button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors min-h-[44px]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <RotateCcw className="w-4 h-4" />
        ลองใหม่
      </motion.button>
    </motion.div>
  )
}

export function VideoPlayer({
  src,
  poster,
  className,
  maxHeight = '400px',
  autoPlay = false,
  onDownload,
  compact = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState<BufferedRange[]>([])
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const check = () => setMobile(checkIsMobile())
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [playing])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    resetControlsTimeout()
  }, [resetControlsTimeout])

  const handleTouchContainer = useCallback(() => {
    if (mobile) {
      setShowControls(prev => {
        const next = !prev
        if (next && playing) {
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
          controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
        }
        return next
      })
    }
  }, [mobile, playing])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [playing])

  const handleSeek = useCallback((time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
  }, [])

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    if (newVolume > 0) {
      setMuted(false)
      videoRef.current.muted = false
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !muted
    setMuted(!muted)
  }, [muted])

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [])

  const handleRetry = useCallback(() => {
    if (!videoRef.current) return
    setError(false)
    setLoading(true)
    videoRef.current.load()
  }, [])

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleProgress = () => {
      const ranges: BufferedRange[] = []
      for (let i = 0; i < video.buffered.length; i++) {
        ranges.push({ start: video.buffered.start(i), end: video.buffered.end(i) })
      }
      setBuffered(ranges)
    }

    const handlePlay = () => setPlaying(true)
    const handlePause = () => setPlaying(false)
    const handleWaiting = () => setBuffering(true)
    const handleCanPlay = () => {
      setBuffering(false)
      setLoading(false)
    }
    const handleEnded = () => setPlaying(false)
    const handleError = () => {
      setError(true)
      setLoading(false)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      // Only handle keys when this player is focused or in fullscreen
      if (!isFullscreen && !container.contains(document.activeElement)) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleSeek(Math.max(0, currentTime - 5))
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSeek(Math.min(duration, currentTime + 5))
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 0.1))
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, handleSeek, currentTime, duration, toggleMute, toggleFullscreen, isFullscreen, handleVolumeChange, volume])

  // Auto-show/hide controls based on playing state
  useEffect(() => {
    if (playing) {
      setShowControls(true)
      resetControlsTimeout()
    } else {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      setShowControls(true)
    }
  }, [playing, resetControlsTimeout])

  // AutoPlay
  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked by browser policy
      })
    }
  }, [autoPlay])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-xl overflow-hidden group',
        className
      )}
      style={{ maxHeight: isFullscreen ? undefined : maxHeight }}
      onMouseMove={!mobile ? handleMouseMove : undefined}
      onMouseEnter={!mobile ? () => setShowControls(true) : undefined}
      onMouseLeave={!mobile ? () => { if (playing) resetControlsTimeout() } : undefined}
      onClick={mobile ? handleTouchContainer : undefined}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        style={{ maxHeight: isFullscreen ? '100vh' : maxHeight }}
        playsInline
        preload="metadata"
      />

      <AnimatePresence>
        {!playing && !loading && !error && (
          <BigPlayButton onClick={togglePlay} compact={compact} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && <LoadingOverlay />}
      </AnimatePresence>

      <AnimatePresence>
        {buffering && !loading && <BufferingOverlay />}
      </AnimatePresence>

      <AnimatePresence>
        {error && <ErrorOverlay onRetry={handleRetry} />}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: EASE_CURVE }}
            className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-3 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <ProgressBar
                currentTime={currentTime}
                duration={duration}
                buffered={buffered}
                onSeek={handleSeek}
                compact={compact}
              />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <motion.button
                    onClick={togglePlay}
                    className="text-white/90 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={playing ? 'หยุดชั่วคราว' : 'เล่น'}
                  >
                    {playing ? (
                      <Pause className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                    ) : (
                      <Play className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                    )}
                  </motion.button>

                  <VolumeControl
                    volume={volume}
                    muted={muted}
                    onVolumeChange={handleVolumeChange}
                    onToggleMute={toggleMute}
                    compact={compact}
                    mobile={mobile}
                  />

                  <TimeDisplay currentTime={currentTime} duration={duration} compact={compact} />
                </div>

                <div className="flex items-center gap-0">
                  <DownloadButton src={src} compact={compact} onDownload={onDownload} />
                  <FullscreenButton isFullscreen={isFullscreen} onToggle={toggleFullscreen} compact={compact} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
