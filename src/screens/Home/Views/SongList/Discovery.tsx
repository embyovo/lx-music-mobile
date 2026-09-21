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

export default () => {
  const theme = useTheme()
  const { width } = useWindowDimensions()
  const cardWidth = Math.min(width * 0.72, 360)
  const [daily, setDaily] = useState<LX.Music.MusicInfoOnline[]>([])
  const [radio, setRadio] = useState<LX.Music.MusicInfoOnline[]>([])
  const [needsLogin, setNeedsLogin] = useState(false)
  const [playlistRefreshKey, setPlaylistRefreshKey] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const exploreY = useRef(0)
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
  const cards = [
    { title: 'For\nYou', label: '网易云每日推荐', desc: daily[0] ? `${daily[0].name} · ${daily[0].singer}` : '每天更新，遇见你的心动', songs: daily, color: '#477366', open: openDaily },
    { title: 'Your\nRadio', label: '猜你喜欢 · 私人 FM', desc: radio[0] ? `${radio[0].name} · ${radio[0].singer}` : '跟着直觉，发现下一首', songs: radio, color: '#6978ac', open: () => { void play(radio) } },
  ]
  return (
    <ScrollView ref={scrollRef} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { void load(); setPlaylistRefreshKey(value => value + 1) }} tintColor={theme['c-primary']} />} contentContainerStyle={styles.content}>
      <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={cardWidth + 14} decelerationRate="fast" contentContainerStyle={styles.carousel}>
          {cards.map(card => <TouchableOpacity key={card.label} activeOpacity={0.88} onPress={card.open} style={[styles.card, { width: cardWidth, backgroundColor: card.color }]}>
            <View style={styles.cardTop}>
              <Text size={28} color="#fff" style={styles.bold}>{card.title}</Text>
              <Image url={card.songs[0]?.meta.picUrl} style={{ width: cardWidth * 0.43, height: cardWidth * 0.43, borderRadius: 12 }} />
            </View>
            <View style={styles.cardBottom}>
              <View style={styles.grow}><Text color="#fff" size={16} style={styles.bold}>{card.label}</Text><Text color="#ffffffcc" size={12} numberOfLines={1} style={{ marginTop: 6 }}>{card.desc}</Text></View>
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
        <TouchableOpacity activeOpacity={0.9} onPress={() => { scrollRef.current?.scrollTo({ y: exploreY.current, animated: true }) }} style={[styles.explore, { backgroundColor: theme['c-content-background'] }]}>
          <View style={styles.orbits}><View style={[styles.orbit, { backgroundColor: theme['c-primary-alpha-800'] }]} /><View style={[styles.orbitSmall, { backgroundColor: theme['c-primary-alpha-700'] }]} /></View>
          <Text size={11} color={theme['c-primary-font']} style={styles.bold}>FIND YOUR NEXT FAVORITE</Text>
          <Text size={23} style={[styles.bold, { marginTop: 12 }]}>发现下一首心动</Text>
          <Text size={13} color={theme['c-500']} style={{ marginTop: 8 }}>不止一种风格，也不止一种心情</Text>
          <View style={[styles.exploreButton, { backgroundColor: theme['c-primary'] }]}><Text color="#10251c" size={14} style={styles.bold}>探索音乐分类  →</Text></View>
        </TouchableOpacity>
        <View style={styles.section} onLayout={event => { exploreY.current = event.nativeEvent.layout.y }}>
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
  card: { padding: 18, borderRadius: 20, minHeight: 214, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bold: { fontWeight: '700' },
  grow: { flex: 1, minWidth: 0 },
  play: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f4f6f5', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  section: { paddingHorizontal: 20, marginTop: 32 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  smallPlay: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  song: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, marginBottom: 12 },
  songLink: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cover: { width: 60, height: 60, borderRadius: 11 },
  like: { width: 46, height: 48, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 22, borderRadius: 16, marginBottom: 12 },
  explore: { marginHorizontal: 20, marginTop: 16, padding: 24, borderRadius: 22, overflow: 'hidden' },
  exploreButton: { alignSelf: 'flex-start', marginTop: 22, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 12 },
  orbits: { position: 'absolute', right: -32, top: -24, width: 150, height: 200 },
  orbit: { width: 140, height: 140, borderRadius: 70 },
  orbitSmall: { width: 56, height: 56, borderRadius: 28, marginLeft: 24, marginTop: 15 },
  footer: { textAlign: 'center', marginTop: 24 },
})
