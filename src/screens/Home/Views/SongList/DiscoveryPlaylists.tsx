import { useEffect, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { useTheme } from '@/store/theme/hook'
import songlistState, { type ListInfoItem, type TagInfoItem } from '@/store/songlist/state'
import musicSdk from '@/utils/musicSdk'
import { getTags } from '@/core/songlist'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { loadDiscovery } from './discoveryData'

export default ({ refreshKey }: { refreshKey: number }) => {
  const theme = useTheme()
  const [selection, setSelection] = useState<{ source: LX.OnlineSource, tag: string }>({ source: 'wy', tag: '' })
  const [tags, setTags] = useState<TagInfoItem[]>([])
  const [list, setList] = useState<ListInfoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setTags([])
    void getTags(selection.source).then(result => {
      if (active) setTags(result.hotTag.slice(0, 10))
    }).catch(() => {})
    return () => { active = false }
  }, [selection.source])
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setList([])
    setLoading(true)
    const timer = setTimeout(() => { controller.abort(); if (active) setLoading(false) }, 15000)
    const run = async() => {
      try {
        const { source, tag } = selection
        let result: ListInfoItem[]
        if (source === 'wy') result = (await loadDiscovery(tag || '为你推荐', controller.signal, 'playlists')).playlists
        else {
          const sortId = songlistState.sortList[source]?.[0]?.id
          if (!sortId) throw new Error('Source unavailable')
          const response = await musicSdk[source].songList.getList(sortId, tag, 1) as { list: ListInfoItem[] }
          result = response.list.filter(item => item.id !== '-1').slice(0, 12).map(item => ({ ...item, source }))
        }
        if (active && !controller.signal.aborted) setList(result)
      } catch { /* This section never clears the independent daily recommendations. */ } finally {
        clearTimeout(timer)
        if (active) setLoading(false)
      }
    }
    void run()
    return () => { active = false; controller.abort(); clearTimeout(timer) }
  }, [selection, retry, refreshKey])
  return <>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 14 }}>
      {songlistState.sources.map(source => <TouchableOpacity key={source} onPress={() => { setSelection({ source, tag: '' }) }} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: selection.source === source ? theme['c-primary'] : theme['c-content-background'] }}><Text size={14} color={selection.source === source ? '#10251c' : theme['c-font']}>{musicSdk.sources.find(item => item.id === source)?.name ?? source}</Text></TouchableOpacity>)}
    </ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 18 }}>
      {[{ id: '', name: '为你推荐' }, ...tags].map(tag => <TouchableOpacity key={tag.id} onPress={() => { setSelection(value => ({ ...value, tag: tag.id })) }} style={{ paddingVertical: 8 }}><Text size={13} color={selection.tag === tag.id ? theme['c-primary-font'] : theme['c-500']}>{tag.name}</Text></TouchableOpacity>)}
    </ScrollView>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      {list.map(item => <TouchableOpacity key={`${item.source}_${item.id}`} style={{ width: '31%', marginBottom: 20 }} onPress={() => { if (commonState.componentIds.home) navigations.pushSonglistDetailScreen(commonState.componentIds.home, item) }}>
        <Image url={item.img} style={{ width: '100%', aspectRatio: 1, borderRadius: 13 }} />
        <Text size={13} numberOfLines={2} style={{ marginTop: 8, lineHeight: 19 }}>{item.name}</Text>
      </TouchableOpacity>)}
    </View>
    {!list.length ? <TouchableOpacity disabled={loading} onPress={() => { setRetry(value => value + 1) }} style={{ padding: 22, borderRadius: 16, backgroundColor: theme['c-content-background'] }}><Text size={13} color={theme['c-500']}>{loading ? '正在挑选歌单…' : '该音源暂未返回歌单，点击重试或切换音源'}</Text></TouchableOpacity> : null}
  </>
}
