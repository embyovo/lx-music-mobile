import { useEffect, useMemo, useRef, useState } from 'react'
import { PanResponder, View, type GestureResponderEvent, type PanResponderGestureState } from 'react-native'
import settingState from '@/store/setting/state'
import MusicList from './MusicList'
import MyList from './MyList'
import { useTheme } from '@/store/theme/hook'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { COMPONENT_IDS } from '@/config/constant'
import { scaleSizeW } from '@/utils/pixelRatio'
import type { InitState as CommonState } from '@/store/common/state'
import { useActiveListId, useMyList } from '@/store/list/hook'
import { setActiveList } from '@/core/list'
import { setNavActiveId } from '@/core/common'

const MAX_WIDTH = scaleSizeW(400)

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const theme = useTheme()
  const lists = useMyList()
  const activeListId = useActiveListId()
  const [drawerLocked, setDrawerLocked] = useState(true)
  // const [width, setWidth] = useState(0)

  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_love') drawer.current?.fixWidth()
    }
    const changeVisible = (visible: boolean) => {
      if (visible) {
        setDrawerLocked(false)
        requestAnimationFrame(() => {
          drawer.current?.openDrawer()
        })
      } else {
        drawer.current?.closeDrawer()
        setDrawerLocked(true)
      }
    }

    // setWidth(getWindowSise().width * 0.82)

    global.state_event.on('navActiveIdUpdated', handleFixDrawer)
    global.app_event.on('changeLoveListVisible', changeVisible)

    // 就放旋转屏幕后的宽度没有更新的问题
    // const changeEvent = onDimensionChange(({ window }) => {
    //   setWidth(window.width * 0.82)
    //   drawer.current?.setNativeProps({
    //     width: window.width,
    //   })
    // })

    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      global.app_event.off('changeLoveListVisible', changeVisible)
    // changeEvent.remove()
    }
  }, [])

  const navigationView = () => <MyList />
  const swipeResponder = useMemo(() => {
    const shouldCapture = (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
      return Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25
    }
    return PanResponder.create({
      onMoveShouldSetPanResponder: shouldCapture,
      onMoveShouldSetPanResponderCapture: shouldCapture,
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) < 38 && Math.abs(gesture.vx) < 0.42) return
        const index = lists.findIndex(item => item.id == activeListId)
        const nextIndex = gesture.dx < 0 ? index + 1 : index - 1
        const next = lists[nextIndex]
        if (next) {
          setActiveList(next.id)
        } else if (gesture.dx < 0 && index == lists.length - 1) {
          setNavActiveId('nav_setting')
        }
      },
    })
  }, [activeListId, lists])
  // console.log('render drawer content')

  return (
    <DrawerLayoutFixed
      ref={drawer}
      visibleNavNames={[COMPONENT_IDS.home]}
      // drawerWidth={width}
      widthPercentage={0.82}
      widthPercentageMax={MAX_WIDTH}
      drawerPosition={settingState.setting['common.drawerLayoutPosition']}
      renderNavigationView={navigationView}
      drawerBackgroundColor={theme['c-content-background']}
      drawerLockMode={drawerLocked ? 'locked-closed' : 'unlocked'}
      onDrawerClose={() => { setDrawerLocked(true) }}
      style={{ elevation: 1 }}
    >
      <View style={{ flex: 1 }} {...swipeResponder.panHandlers}>
        <MusicList />
      </View>
    </DrawerLayoutFixed>
  )
}
