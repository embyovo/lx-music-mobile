import AsyncStorage from '@react-native-async-storage/async-storage'
import musicSdk from '@/utils/musicSdk'
import { toNewMusicInfo } from '@/utils'
import { getSyncHost } from '@/utils/data'
import { getData, saveData } from '@/plugins/storage'
import { storageDataPrefix } from '@/config/constant'
import settingState from '@/store/setting/state'

// 网易云听歌同步：ID 匹配缓存、搜索意图、上报队列与状态。
// 网络请求全部复用项目已有的「同步服务地址 + 网易云 Cookie」链路。

const MATCH_CACHE_TTL = 30 * 86400000
const MATCH_MISS_TTL = 7 * 86400000
const MATCH_CACHE_LIMIT = 2000
const SEARCH_INTENT_LIMIT = 60
const QUEUE_LIMIT = 500
const BATCH_SIZE = 10
const REQUEST_TIMEOUT = 10000
const ACCEPT_SCORE = 45

const VERSION_WORDS = [
  'live', 'remix', 'dj', '伴奏', '纯音乐', 'instrumental', 'cover', '翻唱',
  '重制', 'remaster', 'acoustic', 'demo', '现场', '片段', '试听', '铃声',
]

interface MatchCacheEntry {
  songId: number
  albumId: number
  score: number
  fromSearch: boolean
  expiresAt: number
}

interface SearchIntent {
  songId: number
  albumId: number
  keyword: string
  at: number
}

export interface NeteaseMatch {
  songId: number
  albumId: number
  score: number
  fromSearch: boolean
}

export interface NeteaseSyncQueueItem {
  key: string
  songId: number
  albumId: number
  name: string
  singer: string
  playedSeconds: number
  at: number
  attempts: number
  nextRetryAt: number
  fromSearch: boolean
}

export interface NeteaseSyncStatus {
  lastSuccessAt: number
  lastSuccessSong: string
  lastErrorAt: number
  lastError: string
  lastMatchFailedAt: number
  lastMatchFailedSong: string
}

export interface NeteaseSyncSnapshot {
  enabled: boolean
  host: string
  loggedIn: boolean
  pending: number
  matched: number
  status: NeteaseSyncStatus
}

const emptyStatus = (): NeteaseSyncStatus => ({
  lastSuccessAt: 0,
  lastSuccessSong: '',
  lastErrorAt: 0,
  lastError: '',
  lastMatchFailedAt: 0,
  lastMatchFailedSong: '',
})

let matchCache: Record<string, MatchCacheEntry> | null = null
let matchCacheLoading: Promise<Record<string, MatchCacheEntry>> | null = null
let searchIntents: Record<string, SearchIntent> | null = null
let searchIntentsLoading: Promise<Record<string, SearchIntent>> | null = null
let queue: NeteaseSyncQueueItem[] | null = null
let queueLoading: Promise<NeteaseSyncQueueItem[]> | null = null
let status: NeteaseSyncStatus | null = null
let statusLoading: Promise<NeteaseSyncStatus> | null = null

const loadMatchCache = async() => {
  if (matchCache) return matchCache
  matchCacheLoading ??= getData<Record<string, MatchCacheEntry>>(storageDataPrefix.neteaseSyncMatch).then(data => {
    matchCache = data ?? {}
    matchCacheLoading = null
    return matchCache
  })
  return matchCacheLoading
}

const saveMatchCache = async(data: Record<string, MatchCacheEntry>) => {
  await saveData(storageDataPrefix.neteaseSyncMatch, data)
}

const loadSearchIntents = async() => {
  if (searchIntents) return searchIntents
  searchIntentsLoading ??= getData<Record<string, SearchIntent>>(storageDataPrefix.neteaseSyncSearch).then(data => {
    searchIntents = data ?? {}
    searchIntentsLoading = null
    return searchIntents
  })
  return searchIntentsLoading
}

const saveSearchIntents = async(data: Record<string, SearchIntent>) => {
  await saveData(storageDataPrefix.neteaseSyncSearch, data)
}

const loadQueue = async() => {
  if (queue) return queue
  queueLoading ??= getData<NeteaseSyncQueueItem[]>(storageDataPrefix.neteaseSyncQueue).then(data => {
    queue = Array.isArray(data) ? data : []
    queueLoading = null
    return queue
  })
  return queueLoading
}

const saveQueue = async(data: NeteaseSyncQueueItem[]) => {
  await saveData(storageDataPrefix.neteaseSyncQueue, data)
}

const loadStatus = async() => {
  if (status) return status
  statusLoading ??= getData<NeteaseSyncStatus>(storageDataPrefix.neteaseSyncStatus).then(data => {
    status = { ...emptyStatus(), ...(data ?? {}) }
    statusLoading = null
    return status
  })
  return statusLoading
}

const saveStatus = async(data: NeteaseSyncStatus) => {
  await saveData(storageDataPrefix.neteaseSyncStatus, data)
}

// 解析 `03:55` / `1:03:55` 形式的时长，返回秒数
const parseInterval = (interval?: string | null): number => {
  if (!interval) return 0
  const parts = interval.split(':').map(part => Number(part))
  if (parts.some(part => Number.isNaN(part))) return 0
  if (parts.length >= 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || 0
}

// 统一大小写、空白与常见标点，保留括号里的版本词（live/remix 等）
const normalize = (text?: string | null) => (text ?? '')
  .toLowerCase()
  .replace(/[\u3000\s]+/g, '')
  .replace(/[·・、,，.。!！?？'"“”‘’`~@#$%^&*+=|/<>《》【】{}()（）\-_]/g, '')

const splitSingers = (singer?: string | null) => (singer ?? '')
  .toLowerCase()
  .split(/[/、&,，;；|]+/)
  .map(item => normalize(item))
  .filter(Boolean)

const similarity = (a: string, b: string) => {
  if (!a || !b) return 0
  if (a === b) return 1
  const shorter = a.length < b.length ? a : b
  const longer = a.length < b.length ? b : a
  const counts = new Map<string, number>()
  for (const char of shorter) counts.set(char, (counts.get(char) ?? 0) + 1)
  let hit = 0
  for (const char of longer) {
    const count = counts.get(char)
    if (count) {
      hit++
      counts.set(char, count - 1)
    }
  }
  return hit / Math.max(a.length, b.length)
}

const getVersionTags = (text?: string | null) => {
  const lower = (text ?? '').toLowerCase()
  return VERSION_WORDS.filter(word => lower.includes(word))
}

const getAlbumId = (musicInfo: LX.Music.MusicInfo) => {
  if (musicInfo.source === 'local') return 0
  const albumId = (musicInfo.meta as LX.Music.MusicInfoMeta_online).albumId
  return Number(albumId) || 0
}

const getAlbumName = (musicInfo: LX.Music.MusicInfo) => musicInfo.meta.albumName ?? ''

const isSongId = (id: number) => Number.isInteger(id) && id > 0

const scoreCandidate = (target: LX.Music.MusicInfo, candidate: LX.Music.MusicInfo) => {
  const targetName = normalize(target.name)
  const candidateName = normalize(candidate.name)
  let score = 0

  if (targetName && targetName === candidateName) score += 60
  else {
    const sim = similarity(targetName, candidateName)
    if (sim >= 0.8) score += 40
    else if (sim >= 0.55) score += 25
    else score += Math.round(sim * 20)
    if (targetName && candidateName && (candidateName.includes(targetName) || targetName.includes(candidateName))) score += 10
  }

  const targetSingers = splitSingers(target.singer)
  const candidateSingers = splitSingers(candidate.singer)
  if (targetSingers.length) {
    let hits = 0
    for (const singer of targetSingers) {
      if (candidateSingers.some(item => item === singer || item.includes(singer) || singer.includes(item))) hits++
    }
    score += Math.round(hits / targetSingers.length * 25)
  }

  // live / remix / 伴奏等版本差异要降权，版本一致则小幅加分
  const targetVersions = getVersionTags(target.name)
  const candidateVersions = getVersionTags(candidate.name)
  const extra = candidateVersions.filter(word => !targetVersions.includes(word))
  const missing = targetVersions.filter(word => !candidateVersions.includes(word))
  score -= (extra.length + missing.length) * 20
  if (targetVersions.length && !extra.length && !missing.length) score += 8

  const targetDuration = parseInterval(target.interval)
  const candidateDuration = parseInterval(candidate.interval)
  if (targetDuration && candidateDuration) {
    const diff = Math.abs(targetDuration - candidateDuration)
    if (diff <= 2) score += 15
    else if (diff <= 5) score += 8
    else if (diff > 15) score -= 15
  }

  const targetAlbum = normalize(getAlbumName(target))
  const candidateAlbum = normalize(getAlbumName(candidate))
  if (targetAlbum && candidateAlbum && (targetAlbum === candidateAlbum || targetAlbum.includes(candidateAlbum) || candidateAlbum.includes(targetAlbum))) {
    score += 5
  }

  return score
}

const getCacheKey = (musicInfo: LX.Music.MusicInfo) => [
  musicInfo.source,
  normalize(musicInfo.name),
  normalize(musicInfo.singer),
  musicInfo.interval ?? '',
].join('|')

const getSearchIntentKey = (musicInfo: LX.Music.MusicInfo) => [
  normalize(musicInfo.name),
  normalize(musicInfo.singer),
].join('|')

const findSearchIntent = async(musicInfo: LX.Music.MusicInfo) => {
  await loadSearchIntents()
  const key = getSearchIntentKey(musicInfo)
  const intent = searchIntents![key]
  // 搜索记录只保留最近一段时间，避免长期偏好干扰
  if (!intent || Date.now() - intent.at > 7 * 86400000) return null
  return intent
}

const pendingMatches = new Map<string, Promise<NeteaseMatch | null>>()

const searchNeteaseCandidates = async(musicInfo: LX.Music.MusicInfo) => {
  const keyword = `${musicInfo.name} ${musicInfo.singer}`.trim()
  if (!keyword) return []
  try {
    const result = await (musicSdk.wy as any).musicSearch.search(keyword, 1, 20) as { list?: any[] }
    return (result?.list ?? []).map(item => toNewMusicInfo(item) as LX.Music.MusicInfoOnline)
  } catch (err) {
    console.warn('[neteaseSync] search failed', err)
    return []
  }
}

const pickBestCandidate = (musicInfo: LX.Music.MusicInfo, candidates: LX.Music.MusicInfoOnline[]) => {
  let best: { candidate: LX.Music.MusicInfoOnline, score: number } | null = null
  for (const candidate of candidates) {
    if (candidate.source !== 'wy' || !isSongId(Number(candidate.meta.songId))) continue
    const score = scoreCandidate(musicInfo, candidate)
    if (!best || score > best.score) best = { candidate, score }
  }
  return best && best.score >= ACCEPT_SCORE ? best : null
}

const saveMatch = async(musicInfo: LX.Music.MusicInfo, entry: MatchCacheEntry) => {
  const cache = await loadMatchCache()
  cache[getCacheKey(musicInfo)] = entry

  const keys = Object.keys(cache)
  if (keys.length > MATCH_CACHE_LIMIT) {
    keys
      .sort((a, b) => cache[a].expiresAt - cache[b].expiresAt)
      .slice(0, keys.length - MATCH_CACHE_LIMIT)
      .forEach(key => { delete cache[key] })
  }

  await saveMatchCache(cache)
}

const recordMatchFailure = async(musicInfo: LX.Music.MusicInfo) => {
  const current = await loadStatus()
  current.lastMatchFailedAt = Date.now()
  current.lastMatchFailedSong = `${musicInfo.name} - ${musicInfo.singer}`
  await saveStatus({ ...current })
}

/**
 * 把 lx 的歌曲映射为网易云 songId。
 * - wy 源本身就有 songId，直接返回；
 * - 其他源先查本地缓存 / 搜索意图，再调用网易云搜索做打分匹配；
 * - 匹配失败返回 null，调用方直接跳过，不阻塞播放。
 */
export const resolveNeteaseSong = async(musicInfo: LX.Music.MusicInfo): Promise<NeteaseMatch | null> => {
  if (!musicInfo) return null

  if (musicInfo.source === 'wy') {
    const songId = Number(musicInfo.meta.songId)
    if (!isSongId(songId)) return null
    return { songId, albumId: getAlbumId(musicInfo), score: 100, fromSearch: false }
  }

  const cacheKey = getCacheKey(musicInfo)
  // 搜索过的网易云歌曲优先直取，避免再次搜索
  const intent = await findSearchIntent(musicInfo)
  if (intent && isSongId(intent.songId)) {
    const match = { songId: intent.songId, albumId: intent.albumId, score: 100, fromSearch: true }
    await saveMatch(musicInfo, { ...match, expiresAt: Date.now() + MATCH_CACHE_TTL })
    return match
  }

  const cache = await loadMatchCache()
  const cached = cache[cacheKey]
  if (cached && cached.expiresAt > Date.now()) {
    return cached.songId
      ? { songId: cached.songId, albumId: cached.albumId, score: cached.score, fromSearch: cached.fromSearch }
      : null
  }

  if (pendingMatches.has(cacheKey)) return pendingMatches.get(cacheKey)!

  const task = (async(): Promise<NeteaseMatch | null> => {
    const candidates = await searchNeteaseCandidates(musicInfo)
    const picked = pickBestCandidate(musicInfo, candidates)
    const fromSearch = !!intent
    if (picked) {
      const match = {
        songId: Number(picked.candidate.meta.songId),
        albumId: getAlbumId(picked.candidate),
        score: picked.score,
        fromSearch,
      }
      await saveMatch(musicInfo, { ...match, expiresAt: Date.now() + MATCH_CACHE_TTL })
      return match
    }

    await saveMatch(musicInfo, { songId: 0, albumId: 0, score: 0, fromSearch: false, expiresAt: Date.now() + MATCH_MISS_TTL })
    return null
  })().catch((err): NeteaseMatch | null => {
    console.warn('[neteaseSync] resolve failed', err)
    return null
  }).finally(() => { pendingMatches.delete(cacheKey) })

  pendingMatches.set(cacheKey, task)
  return task
}

/**
 * 记录一次搜索结果（本地），被搜索过的歌曲在播放时会优先直取网易云 id。
 */
export const recordNeteaseSearchResults = (keyword: string, list: LX.Music.MusicInfoOnline[]) => {
  if (!settingState.setting['neteaseSync.enable'] || !list.length) return
  void (async() => {
    const intents = await loadSearchIntents()
    const now = Date.now()
    for (const song of list) {
      const key = getSearchIntentKey(song)
      if (!key || key === '|') continue
      const songId = song.source === 'wy' ? Number(song.meta.songId) : 0
      const albumId = song.source === 'wy' ? getAlbumId(song) : 0
      intents[key] = {
        songId: isSongId(songId) ? songId : (intents[key]?.songId ?? 0),
        albumId: isSongId(songId) ? albumId : (intents[key]?.albumId ?? 0),
        keyword,
        at: now,
      }
    }

    const entries = Object.entries(intents).sort((a, b) => b[1].at - a[1].at)
    if (entries.length > SEARCH_INTENT_LIMIT) {
      for (const [key] of entries.slice(SEARCH_INTENT_LIMIT)) delete intents[key]
    }
    await saveSearchIntents(intents)
  })().catch(err => { console.warn('[neteaseSync] record search failed', err) })
}

const enqueueReport = async(item: NeteaseSyncQueueItem) => {
  const list = await loadQueue()
  list.push(item)
  if (list.length > QUEUE_LIMIT) list.splice(0, list.length - QUEUE_LIMIT)
  await saveQueue(list)
  scheduleNeteaseSyncFlush(8000)
}

/**
 * 播放达到阈值后调用：异步匹配并进入上报队列，不阻塞调用方。
 */
export const reportNeteasePlay = (musicInfo: LX.Music.MusicInfo, playedSeconds: number) => {
  if (!settingState.setting['neteaseSync.enable'] || playedSeconds < 5) return
  void resolveNeteaseSong(musicInfo).then(async(match) => {
    if (!match) {
      await recordMatchFailure(musicInfo)
      return
    }
    await enqueueReport({
      key: `${match.songId}_${Date.now()}`,
      songId: match.songId,
      albumId: match.albumId,
      name: musicInfo.name,
      singer: musicInfo.singer,
      playedSeconds: Math.round(playedSeconds),
      at: Date.now(),
      attempts: 0,
      nextRetryAt: 0,
      fromSearch: match.fromSearch,
    })
  }).catch(err => { console.warn('[neteaseSync] report failed', err) })
}

interface ScrobbleResult {
  ok: boolean
  auth?: boolean
  error?: string
}

const postScrobble = async(host: string, cookie: string, item: NeteaseSyncQueueItem): Promise<ScrobbleResult> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => { controller.abort() }, REQUEST_TIMEOUT)
  try {
    const response = await fetch(`${host}/api/netease/scrobble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.songId,
        sourceid: item.albumId || 0,
        time: item.playedSeconds,
        cookie,
        timestamp: Date.now(),
      }),
      signal: controller.signal,
    })
    if (response.status === 401 || response.status === 403) {
      return { ok: false, auth: true, error: '网易云登录已失效或无权访问' }
    }

    let result: { code?: number } | null = null
    try { result = await response.json() } catch {}
    const code = Number(result?.code)
    if (code === 301 || code === 401 || code === 403) {
      return { ok: false, auth: true, error: '网易云登录已失效或无权访问' }
    }
    if (response.status === 404 || code === 404) {
      return { ok: false, error: '服务端未提供打卡接口 (/api/netease/scrobble)' }
    }
    if (!response.ok) return { ok: false, error: `上报失败 (HTTP ${response.status})` }
    if (!result || code !== 200) {
      return { ok: false, error: code ? `上报失败 (code ${code})` : '响应格式不正确（缺少 code）' }
    }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.name === 'AbortError' ? '上报超时' : '网络异常' }
  } finally {
    clearTimeout(timeout)
  }
}

let flushTimer: ReturnType<typeof setTimeout> | null = null
let isFlushing = false

export const scheduleNeteaseSyncFlush = (delay = 8000) => {
  if (!settingState.setting['neteaseSync.enable'] || flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushNeteaseSyncQueue()
  }, delay)
}

export interface FlushResult {
  sent: number
  failed: number
  error?: string
}

/**
 * 顺序批量上报队列：单轮最多 10 条，失败按指数退避，离线/登录失效都不会丢记录。
 */
export const flushNeteaseSyncQueue = async(force = false): Promise<FlushResult> => {
  if (isFlushing) return { sent: 0, failed: 0, error: '正在同步中' }
  if (!force && !settingState.setting['neteaseSync.enable']) return { sent: 0, failed: 0 }

  // eslint-disable-next-line require-atomic-updates
  isFlushing = true
  try {
    const [cookie, configuredHost] = await Promise.all([AsyncStorage.getItem('cookie'), getSyncHost()])
    const host = (configuredHost ?? '').trim().replace(/\/+$/, '')
    if (!cookie) return { sent: 0, failed: 0, error: '未登录网易云' }
    if (!host) return { sent: 0, failed: 0, error: '未配置网易云服务地址' }

    const list = await loadQueue()
    const remaining: NeteaseSyncQueueItem[] = []
    const now = Date.now()
    let sent = 0
    let failed = 0
    let lastError = ''
    let lastSuccessSong = ''
    let lastSuccessAt = 0
    let authFailed = false

    for (let index = 0; index < list.length; index++) {
      const item = list[index]
      if (item.nextRetryAt > now) {
        remaining.push(item)
        continue
      }
      if (sent >= BATCH_SIZE) {
        remaining.push(...list.slice(index))
        break
      }

      const result = await postScrobble(host, cookie, item)
      if (result.ok) {
        sent++
        lastSuccessSong = `${item.name} - ${item.singer}`
        lastSuccessAt = Date.now()
        continue
      }

      failed++
      lastError = result.error ?? '上报失败'
      if (result.auth) {
        authFailed = true
        remaining.push(...list.slice(index))
        break
      }

      item.attempts++
      item.nextRetryAt = Date.now() + Math.min(300000, Math.pow(2, item.attempts) * 1000)
      remaining.push(item)
    }

    const nextStatus = await loadStatus()
    if (lastSuccessAt) {
      nextStatus.lastSuccessAt = lastSuccessAt
      nextStatus.lastSuccessSong = lastSuccessSong
    }
    if (lastError || authFailed) {
      nextStatus.lastErrorAt = Date.now()
      nextStatus.lastError = authFailed ? '网易云登录已失效，请重新登录' : lastError
    }
    await saveQueue(remaining)
    await saveStatus({ ...nextStatus })

    return { sent, failed, error: nextStatus.lastErrorAt && (lastError || authFailed) ? nextStatus.lastError : undefined }
  } finally {
    // eslint-disable-next-line require-atomic-updates
    isFlushing = false
  }
}

export const clearNeteaseSyncQueue = async() => {
  queue = []
  await saveQueue([])
}

export const getNeteaseSyncSnapshot = async(): Promise<NeteaseSyncSnapshot> => {
  await Promise.all([loadMatchCache(), loadSearchIntents(), loadQueue(), loadStatus()])
  const [cookie, configuredHost] = await Promise.all([AsyncStorage.getItem('cookie'), getSyncHost()])
  const cache = await loadMatchCache()
  const list = await loadQueue()
  return {
    enabled: settingState.setting['neteaseSync.enable'],
    host: (configuredHost ?? '').trim().replace(/\/+$/, ''),
    loggedIn: !!cookie,
    pending: list.length,
    matched: Object.values(cache).filter(entry => entry.songId > 0).length,
    status: { ...(await loadStatus()) },
  }
}

export const initNeteaseSync = async() => {
  await Promise.all([loadMatchCache(), loadSearchIntents(), loadQueue(), loadStatus()])
  if (settingState.setting['neteaseSync.enable']) scheduleNeteaseSyncFlush(0)
}

export const isNeteaseSyncEnabled = () => settingState.setting['neteaseSync.enable']
