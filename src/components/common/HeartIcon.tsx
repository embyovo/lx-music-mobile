import { View } from 'react-native'
import { Icon } from './Icon'

// Native rounded lobes avoid emoji/font-dependent filled-heart rendering.
export default ({ filled, color, size = 24 }: { filled: boolean, color: string, size?: number }) => {
  if (!filled) return <Icon name="love" size={size} color={color} />
  const side = size * 0.54
  return <View pointerEvents="none" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: side, height: side, backgroundColor: color, borderRadius: size * 0.05, transform: [{ translateY: size * 0.06 }, { rotate: '-45deg' }] }}>
      <View style={{ position: 'absolute', width: side, height: side, borderRadius: side / 2, top: -side / 2, backgroundColor: color }} />
      <View style={{ position: 'absolute', width: side, height: side, borderRadius: side / 2, left: side / 2, backgroundColor: color }} />
    </View>
  </View>
}
