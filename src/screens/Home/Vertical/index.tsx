import { View } from 'react-native'
import { useKeyboard } from '@/utils/hooks'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import BottomNav from './BottomNav'
import { createStyle } from '@/utils/tools'

const NAV_HEIGHT = 80

export default () => {
  const { keyboardShown, keyboardHeight } = useKeyboard()
  return (
    <View style={styles.container}>
      <Content />
      {/* 无键盘时为底部导航预留高度；键盘弹出时底栏沉到屏幕外，播放栏贴在键盘上方 */}
      <View style={{ marginBottom: keyboardShown ? 0 : NAV_HEIGHT }}>
        <PlayerBar isHome />
      </View>
      <View style={{ ...styles.bottomNav, bottom: -keyboardHeight }}>
        <BottomNav />
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
})
