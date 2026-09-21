import { TouchableOpacity, View } from 'react-native'
import HeartIcon from '@/components/common/HeartIcon'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { useLoveStatus, LIKE_COLOR } from '@/utils/loveStatus'

export default () => {
  const theme = useTheme()
  const music = usePlayerMusicInfo()
  const { liked, busy, toggle } = useLoveStatus()
  return <TouchableOpacity accessibilityLabel={liked ? '取消喜欢' : '快速喜欢'} accessibilityState={{ selected: liked, disabled: busy || !music.id }} disabled={busy || !music.id} onPress={() => { void toggle() }} style={{ width: 40, height: 48, alignItems: 'center', justifyContent: 'center', opacity: music.id ? 1 : 0.4 }}>
    <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: liked ? 'rgba(236,65,65,0.08)' : 'transparent' }}>
      <HeartIcon filled={liked} size={24} color={liked ? LIKE_COLOR : theme['c-button-font']} />
    </View>
  </TouchableOpacity>
}
