import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, AppState, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import SongDivider from '@/components/common/SongDivider'
import { useTheme } from '@/store/theme/hook'
import { toast } from '@/utils/tools'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { addListMusics } from '@/core/list'
import { playListById } from '@/core/player/player'
import { COMPONENT_IDS, LIST_IDS } from '@/config/constant'
import { usePageVisible } from '@/store/common/hook'
import DiscoveryPlaylists from './DiscoveryPlaylists'
import { loadDiscovery } from './discoveryData'
import CardDeco, { type DecoVariant } from './CardDeco'

// 30 天每日配色 + 装饰主题（16 种装饰 × 30 种颜色，一个月内组合不重样）
const DAILY_PALETTE: Array<{ color: string, deco: DecoVariant }> = [
  { color: '#7EC8F5', deco: 'sky' },      // 1 浅天蓝 → 太阳云朵
  { color: '#FF9B9B', deco: 'hearts' },   // 2 珊瑚红 → 爱心
  { color: '#7ED9A7', deco: 'rain' },     // 3 薄荷绿 → 云朵雨滴
  { color: '#B39DF2', deco: 'night' },    // 4 淡紫 → 月亮星星
  { color: '#FFC46B', deco: 'sunrise' },  // 5 杏黄 → 橙色大太阳
  { color: '#F49AC1', deco: 'notes' },    // 6 樱粉 → 音符
  { color: '#8FD4C1', deco: 'bubbles' },  // 7 青碧 → 泡泡
  { color: '#F5A25D', deco: 'sparkles' }, // 8 蜜橘 → 星芒
  { color: '#86C5EC', deco: 'planet' },   // 9 雾蓝 → 星球
  { color: '#E8A2C8', deco: 'kite' },     // 10 玫粉 → 风筝
  { color: '#9AD08F', deco: 'bird' },     // 11 草绿 → 飞鸟
  { color: '#C4A7E7', deco: 'balloon' },  // 12 藕紫 → 气球
  { color: '#FFB38A', deco: 'rainbow' },  // 13 蜜桃 → 彩虹
  { color: '#A5D8FF', deco: 'rocket' },   // 14 婴儿蓝 → 火箭
  { color: '#F7A6A4', deco: 'flower' },   // 15 浅珊瑚 → 小花
  { color: '#94D8B0', deco: 'disc' },     // 16 森薄荷 → 黑胶唱片
  { color: '#D3A4E0', deco: 'night' },    // 17 兰花紫 → 月亮星星
  { color: '#FFCE7A', deco: 'bubbles' },  // 18 奶油黄 → 泡泡
  { color: '#7FC8C2', deco: 'kite' },     // 19 湖水绿 → 风筝
  { color: '#F19CB6', deco: 'sparkles' }, // 20 桃粉 → 星芒
  { color: '#A8C686', deco: 'sunrise' },  // 21 橄榄绿 → 大太阳
  { color: '#DFA8E8', deco: 'planet' },   // 22 香芋紫 → 星球
  { color: '#FFAD60', deco: 'rain' },     // 23 亮橘 → 雨滴
  { color: '#8FB8DE', deco: 'balloon' },  // 24 牛仔蓝 → 气球
  { color: '#F29B88', deco: 'bird' },     // 25 砖粉红 → 飞鸟
  { color: '#B5D8A8', deco: 'hearts' },   // 26 嫩芽绿 → 爱心
  { color: '#E8A0B8', deco: 'disc' },     // 27 山茶粉 → 黑胶唱片
  { color: '#9CC3E5', deco: 'notes' },    // 28 青空蓝 → 音符
  { color: '#FFD3A5', deco: 'flower' },   // 29 浅沙杏 → 小花
  { color: '#C9A8E8', deco: 'rocket' },   // 30 薰衣草紫 → 火箭
]

// 根据卡片背景色生成与之配合的日期文字颜色：同一色相，压低明度、提升饱和度
const harmonize = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  // 目标：明度 34%，饱和度至少 55%（取原饱和度与目标的较高者），色相不变
  const h2 = h, s2 = Math.max(s, 0.55), l2 = 0.34
  const q = l2 < 0.5 ? l2 * (1 + s2) : l2 + s2 - l2 * s2
  const p = 2 * l2 - q
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const to255 = (v: number) => Math.round(v * 255)
  return `rgb(${to255(hue2rgb(h2 + 1 / 3))}, ${to255(hue2rgb(h2))}, ${to255(hue2rgb(h2 - 1 / 3))})`
}

export default () => {
  const theme = useTheme()
  const { width } = useWindowDimensions()
  const cardWidth = Math.min(width * 0.72, 360)
  const [daily, setDaily] = useState<LX.Music.MusicInfoOnline[]>([])
  const [radio, setRadio] = useState<LX.Music.MusicInfoOnline[]>([])
  const [needsLogin, setNeedsLogin] = useState(false)
  const [playlistRefreshKey, setPlaylistRefreshKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('正在为你寻找好音乐…')
  const requestRef = useRef<AbortController | null>(null)
  const entrance = useRef(new Animated.Value(0)).current

  const load = useCallback(async() => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setLoading(true)
    const timeout = setTimeout(() => { controller.abort() }, 15000)
    try {
      const result = await loadDiscovery('为你推荐', controller.signal, 'songs')
      if (requestRef.current !== controller) return
      setDaily(result.daily)
      setRadio(result.radio)
      setNeedsLogin(result.needsLogin)
      setMessage(result.message)
    } catch {
      if (requestRef.current === controller) setMessage('连接超时或服务不可用，请下拉重试')
    } finally {
      clearTimeout(timeout)
      if (requestRef.current === controller) setLoading(false)
    }
  }, [])

  usePageVisible([COMPONENT_IDS.home], useCallback(visible => {
    if (visible) void load()
  }, [load]))

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 320, useNativeDriver: true }).start()
    void load()
    const onHome = (id: string) => { if (id === 'nav_songlist') void load() }
    const appState = AppState.addEventListener('change', state => { if (state === 'active' && commonState.navActiveId === 'nav_songlist') void load() })
    global.state_event.on('navActiveIdUpdated', onHome)
    return () => {
      requestRef.current?.abort()
      requestRef.current = null
      appState.remove()
      global.state_event.off('navActiveIdUpdated', onHome)
    }
  }, [entrance, load])

  const openDaily = () => {
    const componentId = commonState.componentIds.home
    if (!componentId) return
    navigations.pushSonglistDetailScreen(componentId, {
      id: '-1',
      source: 'wy',
      name: '网易云每日推荐',
      author: '网易云音乐',
      img: daily[0]?.meta.picUrl ?? undefined,
      desc: '每天更新，只为你的音乐日常',
    })
  }
  const play = async(songs: LX.Music.MusicInfoOnline[], selected = songs[0]) => {
    if (!selected) { toast(message); return }
    try {
      await addListMusics(LIST_IDS.DEFAULT, songs, 'top')
      await playListById(LIST_IDS.DEFAULT, selected.id)
    } catch { toast('暂时无法播放，请稍后重试') }
  }
  const like = async(song: LX.Music.MusicInfoOnline) => {
    try { await addListMusics(LIST_IDS.LOVE, [song], 'top'); toast('已添加到我的喜欢') } catch { toast('收藏失败，请重试') }
  }
  const tracks = radio.length ? radio : daily.slice(0, 3)
  // For You 卡片：按一年中的第几天从 30 天配色表中取色，一个月不重样
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const todayPalette = DAILY_PALETTE[dayOfYear % DAILY_PALETTE.length]
  const dateLabel = `${now.getDate()}`
  const cards = [
    { title: 'For\nYou', label: '网易云每日推荐', date: dateLabel, desc: daily[0] ? `${daily[0].name} · ${daily[0].singer}` : '每天更新，遇见你的心动', songs: daily, color: todayPalette.color, deco: todayPalette.deco, open: openDaily },
    { title: 'Your\nRadio', label: '猜你喜欢 · 私人 FM', desc: radio[0] ? `${radio[0].name} · ${radio[0].singer}` : '跟着直觉，发现下一首', songs: radio, color: '#6978ac', deco: 'planet', open: () => { void play(radio) } },
  ]
  return (
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { void load(); setPlaylistRefreshKey(value => value + 1) }} tintColor={theme['c-primary']} />} contentContainerStyle={styles.content}>
      <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={cardWidth + 14} decelerationRate="fast" contentContainerStyle={styles.carousel}>
          {cards.map(card => <TouchableOpacity key={card.label} activeOpacity={0.88} onPress={card.open} style={[styles.card, { width: cardWidth, backgroundColor: card.color }]}>
            {/* 背景装饰：落在标题与封面之间的空白带 */}
            <CardDeco variant={card.deco} color={card.color} style={{ position: 'absolute', top: 26, left: cardWidth * 0.22 }} />
            <View style={styles.cardTop}>
              <View>
                <Text size={28} color="#fff" style={styles.bold}>{card.title}</Text>
                {'date' in card && <Text size={36} style={[styles.bold, { color: harmonize(card.color), marginTop: 2 }]}>{card.date}</Text>}
              </View>
              <Image url={card.songs[0]?.meta.picUrl} style={{ width: cardWidth * 0.43, height: cardWidth * 0.43, borderRadius: 12 }} />
            </View>
            <View style={styles.cardBottom}>
              <View style={styles.grow}>
                <Text color="#fff" size={16} style={styles.bold}>{card.label}</Text>
                <Text color="#ffffffcc" size={12} numberOfLines={1} style={{ marginTop: 6 }}>{card.desc}</Text>
              </View>
              <TouchableOpacity accessibilityLabel={`播放${card.label}`} onPress={() => { if (card.songs.length) void play(card.songs); else card.open() }} style={styles.play}><Icon name="play" color={card.color} size={20} /></TouchableOpacity>
            </View>
          </TouchableOpacity>)}
        </ScrollView>
        <View style={styles.section}>
          <View style={styles.heading}><Text size={23} style={styles.bold}>Hi，终于等到你</Text><TouchableOpacity accessibilityLabel="播放推荐歌曲" onPress={() => { void play(tracks) }} style={[styles.smallPlay, { backgroundColor: theme['c-content-background'] }]}><Icon name="play" size={16} color={theme['c-600']} /></TouchableOpacity></View>
          <Text color={theme['c-500']} size={12} style={{ marginBottom: 18 }}>{radio.length ? '私人 FM · 从你的喜好出发' : '每日精选 · 让音乐陪伴此刻'}</Text>
          {tracks.length ? tracks.slice(0, 3).map(song => <View key={song.id} style={styles.song}>
            <TouchableOpacity style={styles.songLink} onPress={() => { void play(tracks, song) }}>
              <Image url={song.meta.picUrl} style={styles.cover} />
              <View style={styles.grow}><Text size={17} numberOfLines={1}>{song.name}</Text><Text size={13} color={theme['c-500']} numberOfLines={1} style={{ marginTop: 6 }}>{song.singer}</Text></View>
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel={`收藏${song.name}`} style={styles.like} onPress={() => { void like(song) }}><Icon name="love" size={24} color={theme['c-500']} /></TouchableOpacity>
            <SongDivider inset={74} />
          </View>) : <TouchableOpacity onPress={() => { if (needsLogin) openDaily(); else void load() }} style={[styles.empty, { backgroundColor: theme['c-content-background'] }]}><Text size={15}>{loading ? '正在准备你的专属音乐…' : message}</Text><Text size={12} color={theme['c-primary-font']} style={{ marginTop: 12 }}>{needsLogin ? '前往网易云登录 →' : '重新加载推荐 →'}</Text></TouchableOpacity>}
        </View>
        <View style={styles.section}>
          <View style={styles.heading}><Text size={23} style={styles.bold}>为此刻选一张歌单</Text></View>
          <Text size={12} color={theme['c-500']} style={{ marginBottom: 16 }}>跟随心情，探索不一样的音乐日常</Text>
          <DiscoveryPlaylists refreshKey={playlistRefreshKey} />
        </View>
        <Text size={11} color={theme['c-500']} style={styles.footer}>让喜欢的音乐，成为日常。</Text>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: 6, paddingBottom: 28 },
  carousel: { paddingHorizontal: 20, gap: 14 },
  card: { padding: 18, borderRadius: 20, minHeight: 214, justifyContent: 'space-between', overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bold: { fontWeight: '700' },
  grow: { flex: 1, minWidth: 0 },
  play: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  section: { paddingHorizontal: 20, marginTop: 32 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  smallPlay: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  song: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, marginBottom: 12 },
  songLink: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cover: { width: 60, height: 60, borderRadius: 11 },
  like: { width: 46, height: 48, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 22, borderRadius: 16, marginBottom: 12 },
  footer: { textAlign: 'center', marginTop: 24 },
})
