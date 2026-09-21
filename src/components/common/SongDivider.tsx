import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'

// Keep fixed row heights and scroll-to-index calculations unchanged.
export default memo(({ inset = 16 }: { inset?: number }) => {
  const theme = useTheme()
  return <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: inset, right: 16, height: StyleSheet.hairlineWidth, backgroundColor: theme['c-300'], opacity: 0.28 }} />
})
