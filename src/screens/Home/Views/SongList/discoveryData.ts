import AsyncStorage from '@react-native-async-storage/async-storage'
import { getSyncHost } from '@/utils/data'
import { type ListInfoItem } from '@/store/songlist/state'
import { markDailyRecommendations } from '@/utils/dailyRecommendation'
import { toMD5 } from '@/utils/tools'

type DiscoverySection = 'all' | 'songs' | 'playlists'
interface DiscoveryCache {
  daily: LX.Music.MusicInfoOnline[]
  radio: LX.Music.MusicInfoOnline[]
  playlists: ListInfoItem[]
}
const emptyCache = (): DiscoveryCache => ({ daily: [], radio: [], playlists: [] })
const cacheKey = (host: string, cookie: string | null, section: string) =>
  `@discovery_cache_v1_${toMD5(`${host}\n${cookie ?? ''}\n${section}`)}`

const getSession = async() => {
  const [configuredHost, cookie] = await Promise.all([getSyncHost(), AsyncStorage.getItem('cookie')])
  return { host: configuredHost.trim().replace(/\/+$/, ''), cookie }
}

export const loadDiscoveryCache = async(category: string, section: DiscoverySection) => {
  const { host, cookie } = await getSession()
  const identity = cacheKey(host, cookie, section === 'playlists' ? `playlists:${category}` : 'songs')
  try {
    const value = await AsyncStorage.getItem(identity)
    const parsed = value ? JSON.parse(value) as Partial<DiscoveryCache> : {}
    return { identity, daily: Array.isArray(parsed.daily) ? parsed.daily : [], radio: Array.isArray(parsed.radio) ? parsed.radio : [], playlists: Array.isArray(parsed.playlists) ? parsed.playlists : [] }
  } catch {
    return { identity, ...emptyCache() }
  }
}

interface Song {
  id: number
  name: string
  dt?: number
  duration?: number
  ar?: Array<{ name: string }>
  artists?: Array<{ name: string }>
  al?: { name: string, picUrl?: string, id: number }
  album?: { name: string, picUrl?: string, id: number }
}
interface Playlist {
  id: number
  name: string
  picUrl?: string
  coverImgUrl?: string
  copywriter?: string
  description?: string
  creator?: { nickname?: string }
}
interface Response {
  code?: number | string
  data?: Song[] | { dailySongs?: Song[] }
  recommend?: Playlist[]
  result?: Playlist[]
  playlists?: Playlist[]
}
class RecommendationError extends Error {
  constructor(public kind: 'auth' | 'network' | 'service') { super(kind) }
}
export const convertSong = (song: Song): LX.Music.MusicInfoOnline => {
  const album = song.al ?? song.album
  const seconds = Math.floor((song.dt ?? song.duration ?? 0) / 1000)
  return {
    id: `wy_${song.id}`,
    source: 'wy',
    name: song.name,
    singer: (song.ar ?? song.artists ?? []).map(artist => artist.name).join(' / '),
    interval: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    meta: { songId: song.id, albumName: album?.name ?? '', albumId: album?.id, picUrl: album?.picUrl, qualitys: [{ type: '128k', size: null }], _qualitys: { '128k': { size: null } } },
  }
}
export const loadDiscovery = async(category: string, signal: AbortSignal, section: DiscoverySection = 'all') => {
  // Read the current session on every refresh, including returning from QR login.
  const { host, cookie } = await getSession()
  const identity = cacheKey(host, cookie, section === 'playlists' ? `playlists:${category}` : 'songs')
  if (!host) return { identity, daily: [], radio: [], playlists: [], dailyOk: false, radioOk: false, playlistsOk: false, needsLogin: false, message: '请先在设置中配置网易云服务地址' }
  const request = async(path: string, params: Record<string, string | number> = {}) => {
    let response
    try {
      response = await fetch(`${host}/api/netease/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-apicache-bypass': '1' },
        body: JSON.stringify({ ...params, cookie: cookie ?? '', timestamp: Date.now() }),
        signal,
      })
    } catch { throw new RecommendationError('network') }
    if (response.status === 401) throw new RecommendationError('auth')
    if (!response.ok) throw new RecommendationError('service')
    const result = await response.json() as Response
    const code = Number(result.code)
    if (code === 301 || code === 401) throw new RecommendationError('auth')
    if (code !== 200) throw new RecommendationError('service')
    return result
  }
  const songs = async(path: string) => {
    if (!cookie || section === 'playlists') return []
    const result = await request(path)
    const list = (Array.isArray(result.data) ? result.data : result.data?.dailySongs ?? []).filter(song => song.id && song.name).map(convertSong)
    return path === 'recommend/songs' ? markDailyRecommendations(list) : list
  }
  const playlists = async(): Promise<ListInfoItem[]> => {
    if (section === 'songs') return []
    let result: Response
    if (category !== '为你推荐') result = await request('top/playlist', { cat: category, limit: 9 })
    else if (cookie) {
      try { result = await request('recommend/resource') } catch {
        if (signal.aborted) throw new RecommendationError('network')
        result = await request('personalized', { limit: 9 })
      }
    } else result = await request('personalized', { limit: 9 })
    return (result.recommend ?? result.result ?? result.playlists ?? []).filter(item => item.id && item.name).slice(0, 9).map(item => ({
      id: String(item.id),
      name: item.name,
      source: 'wy',
      author: item.creator?.nickname ?? '网易云音乐',
      img: item.picUrl ?? item.coverImgUrl,
      desc: item.copywriter ?? item.description ?? '',
    }))
  }
  const [daily, radio, lists] = await Promise.allSettled([songs('recommend/songs'), songs('personal_fm'), playlists()])
  const needsLogin = !cookie || [daily, radio].some(item => item.status === 'rejected' && item.reason instanceof RecommendationError && item.reason.kind === 'auth')
  const dailyValue = daily.status === 'fulfilled' ? daily.value : []
  const radioValue = radio.status === 'fulfilled' ? radio.value : []
  const playlistValue = lists.status === 'fulfilled' ? lists.value : []
  // Keep only useful successful results. A failed request must not erase the
  // last good section, and different users and servers must never share it.
  if (!signal.aborted) {
    const writes: Array<Promise<void>> = []
    if ((section === 'songs' || section === 'all') && (dailyValue.length || radioValue.length)) {
      writes.push((async() => {
        const raw = await AsyncStorage.getItem(cacheKey(host, cookie, 'songs'))
        let cached: Partial<DiscoveryCache> = {}
        try { cached = raw ? JSON.parse(raw) as Partial<DiscoveryCache> : {} } catch {}
        if (signal.aborted) return
        await AsyncStorage.setItem(cacheKey(host, cookie, 'songs'), JSON.stringify({
          daily: dailyValue.length ? dailyValue : (cached.daily ?? []),
          radio: radioValue.length ? radioValue : (cached.radio ?? []),
        }))
      })())
    }
    if ((section === 'playlists' || section === 'all') && playlistValue.length) {
      writes.push(AsyncStorage.setItem(cacheKey(host, cookie, `playlists:${category}`), JSON.stringify({ playlists: playlistValue })))
    }
    void Promise.all(writes).catch(() => {})
  }
  return {
    identity,
    daily: dailyValue,
    radio: radioValue,
    playlists: playlistValue,
    dailyOk: daily.status === 'fulfilled',
    radioOk: radio.status === 'fulfilled',
    playlistsOk: lists.status === 'fulfilled',
    needsLogin,
    message: needsLogin ? (!cookie ? '登录网易云，开启你的专属推荐' : '网易云登录已过期，请重新登录') : '推荐服务暂未返回歌曲，点击重试或下拉刷新',
  }
}
