import BackgroundTimer from 'react-native-background-timer'
import playerState from '@/store/player/state'
import { initNeteaseSync, reportNeteasePlay, scheduleNeteaseSyncFlush } from './neteaseSync'

// 播放会话计时：只用现有 play / pause / stop / musicToggled 事件，
// 不侵入播放核心，也不在 UI 线程做网络请求。

const TICK_INTERVAL = 5000

interface PlaySession {
  musicInfo: LX.Music.MusicInfo
  accumulated: number
  resumeAt: number
  reported: boolean
}

let session: PlaySession | null = null
let ticker: number | null = null

const getMusicInfo = (info: LX.Music.MusicInfo | LX.Download.ListItem | null): LX.Music.MusicInfo | null => {
  if (!info) return null
  return 'progress' in info ? info.metadata.musicInfo : info
}

const getCurrentMusicInfo = () => getMusicInfo(playerState.playMusicInfo.musicInfo)

const parseInterval = (interval?: string | null): number => {
  if (!interval) return 0
  const parts = interval.split(':').map(part => Number(part))
  if (parts.some(part => Number.isNaN(part))) return 0
  if (parts.length >= 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || 0
}

// 达到 min(60s, max(15s, 时长30%)) 视为一次有效收听
const getRequiredSeconds = (musicInfo: LX.Music.MusicInfo) => {
  const duration = parseInterval(musicInfo.interval)
  if (!duration) return 30
  return Math.max(15, Math.min(60, Math.round(duration * 0.3)))
}

const getElapsedSeconds = (target: PlaySession) => {
  const running = target.resumeAt ? (Date.now() - target.resumeAt) / 1000 : 0
  return target.accumulated + running
}

const stopTicker = () => {
  if (ticker == null) return
  BackgroundTimer.clearInterval(ticker)
  ticker = null
}

const checkThreshold = () => {
  const target = session
  if (!target || target.reported || !target.resumeAt) return
  const elapsed = getElapsedSeconds(target)
  const required = getRequiredSeconds(target.musicInfo)
  if (elapsed < required) return

  target.reported = true
  stopTicker()
  reportNeteasePlay(target.musicInfo, Math.min(elapsed, parseInterval(target.musicInfo.interval) || elapsed))
}

const startTicker = () => {
  if (ticker != null) return
  ticker = BackgroundTimer.setInterval(checkThreshold, TICK_INTERVAL)
  checkThreshold()
}

const accumulate = () => {
  const target = session
  if (!target?.resumeAt) return
  target.accumulated += (Date.now() - target.resumeAt) / 1000
  target.resumeAt = 0
}

const startSession = (musicInfo: LX.Music.MusicInfo | null) => {
  session = musicInfo
    ? {
        musicInfo,
        accumulated: 0,
        resumeAt: 0,
        reported: false,
      }
    : null
}

const finalize = (isStop: boolean) => {
  const target = session
  if (!target) return
  accumulate()
  stopTicker()

  if (!target.reported) {
    const required = getRequiredSeconds(target.musicInfo)
    if (target.accumulated >= required) {
      target.reported = true
      reportNeteasePlay(target.musicInfo, Math.min(target.accumulated, parseInterval(target.musicInfo.interval) || target.accumulated))
    }
  }

  if (isStop) session = null
}

const handleMusicToggled = () => {
  // 切歌时先结算上一首，再为新歌曲开启会话
  finalize(false)
  startSession(getCurrentMusicInfo())
}

const handlePlay = () => {
  const musicInfo = getCurrentMusicInfo()
  if (!musicInfo) return
  if (!session || session.musicInfo.id !== musicInfo.id) {
    finalize(false)
    startSession(musicInfo)
  }
  session!.resumeAt = Date.now()
  startTicker()
}

const handlePause = () => {
  accumulate()
  stopTicker()
}

const handleStop = () => {
  finalize(true)
}

const handleConfigUpdated: typeof global.state_event.configUpdated = (keys) => {
  if (!keys.includes('neteaseSync.enable')) return
  if (playerState.isPlay) scheduleNeteaseSyncFlush(0)
}

export const initNeteasePlaySync = () => {
  global.app_event.on('musicToggled', handleMusicToggled)
  global.app_event.on('play', handlePlay)
  global.app_event.on('pause', handlePause)
  global.app_event.on('stop', handleStop)
  global.state_event.on('configUpdated', handleConfigUpdated)
  void initNeteaseSync()
}
