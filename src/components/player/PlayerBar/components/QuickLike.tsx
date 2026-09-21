import { useEffect, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import HeartIcon from '@/components/common/HeartIcon'
import { usePlayerMusicInfo } from '@/store/player/hook'
import playerState from '@/store/player/state'
import { useTheme } from '@/store/theme/hook'
import { getListMusics, addListMusics, removeListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import { toast } from '@/utils/tools'

export default () => {
  const theme = useTheme()
  const music = usePlayerMusicInfo()
  const [liked, setLiked] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    const update = () => {
      void getListMusics(LIST_IDS.LOVE).then(list => {
        if (active) setLiked(list.some(item => item.id === music.id))
      }).catch(() => {})
    }
    const onChange = (ids: string[]) => { if (ids.includes(LIST_IDS.LOVE)) update() }
    setLiked(false)
    update()
    global.app_event.on('myListMusicUpdate', onChange)
    return () => { active = false; global.app_event.off('myListMusicUpdate', onChange) }
  }, [music.id])
  const toggle = async() => {
    const current = playerState.playMusicInfo.musicInfo
    if (!current || busy) return
    const song = 'progress' in current ? current.metadata.musicInfo : current
    setBusy(true)
    try {
      const list = await getListMusics(LIST_IDS.LOVE)
      if (list.some(item => item.id === song.id)) await removeListMusics(LIST_IDS.LOVE, [song.id])
      else await addListMusics(LIST_IDS.LOVE, [song], 'top')
    } catch { toast('收藏操作失败，请重试') } finally { setBusy(false) }
  }
  return <TouchableOpacity accessibilityLabel={liked ? '取消喜欢' : '快速喜欢'} accessibilityState={{ selected: liked, disabled: busy || !music.id }} disabled={busy || !music.id} onPress={() => { void toggle() }} style={{ width: 40, height: 48, alignItems: 'center', justifyContent: 'center', opacity: music.id ? 1 : 0.4 }}>
    <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: liked ? 'rgba(210,112,133,0.08)' : 'transparent' }}>
      <HeartIcon filled={liked} size={24} color={liked ? '#d27085' : theme['c-600']} />
    </View>
  </TouchableOpacity>
}
