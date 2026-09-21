import { memo, useEffect, useMemo, useRef } from 'react'
import { Animated, View } from 'react-native'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'


export default memo(({ isHome = false }: { isHome?: boolean }) => {
  // const { onLayout, ...layout } = useLayout()
  const theme = useTheme()
  const entrance = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      damping: 18,
      stiffness: 150,
      mass: 0.8,
      useNativeDriver: true,
    }).start()
  }, [entrance])

  const playerComponent = useMemo(() => (
    <Animated.View style={{ ...styles.container, backgroundColor: theme['c-content-background'], opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
      <Pic isHome={isHome} />
      <View style={styles.center}>
        <Title isHome={isHome} />
        {/* <View style={{ ...styles.row, justifyContent: 'space-between' }}>
          <PlayTime />
        </View> */}
        <PlayInfo isHome={isHome} />
      </View>
      <View style={styles.right}>
        <ControlBtn />
      </View>
    </Animated.View>
  ), [entrance, theme, isHome])

  // console.log('render pb')

  return playerComponent
})


const styles = createStyle({
  container: {
    alignSelf: 'stretch',
    // height: 100,
    // paddingTop: progressContentPadding,
    // marginTop: -progressContentPadding,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
    // borderTopWidth: BorderWidths.normal2,
    paddingVertical: 12,
    paddingLeft: 10,
    minHeight: 86,
    marginHorizontal: 12,
    marginTop: 22,
    marginBottom: 4,
    // backgroundColor: AppColors.primary,
    // backgroundColor: 'red',
    borderRadius: 22,
    overflow: 'visible',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
  },
  left: {
    // borderRadius: 3,
    flexGrow: 0,
    flexShrink: 0,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 12,
    minWidth: 0,
    justifyContent: 'center',
    // justifyContent: 'space-evenly',
    // height: 48,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: 5,
    paddingRight: 5,
  },
  // row: {
  //   flexDirection: 'row',
  //   flexGrow: 0,
  //   flexShrink: 0,
  // },
})
