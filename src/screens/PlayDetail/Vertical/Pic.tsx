import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, View } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useIsPlay, usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'

const VINYL_GROOVES = [0.96, 0.88, 0.80, 0.72, 0.66]


export default ({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()
  const isPlay = useIsPlay()
  const rotateValue = useRef(new Animated.Value(0)).current
  const entrance = useRef(new Animated.Value(0)).current
  const armValue = useRef(new Animated.Value(isPlay ? 1 : 0)).current
  const armSyncedRef = useRef(false)
  const rotateLoopRef = useRef<ReturnType<typeof Animated.loop> | null>(null)

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      damping: 17,
      stiffness: 120,
      useNativeDriver: true,
    }).start()
  }, [entrance])

  useEffect(() => {
    armValue.stopAnimation()
    if (!armSyncedRef.current) {
      armSyncedRef.current = true
      armValue.setValue(isPlay ? 1 : 0)
    } else {
      Animated.spring(armValue, {
        toValue: isPlay ? 1 : 0,
        damping: 14,
        stiffness: 90,
        mass: 0.8,
        useNativeDriver: true,
      }).start()
    }
    if (!isPlay) {
      rotateLoopRef.current?.stop()
      return
    }
    rotateLoopRef.current = Animated.loop(Animated.timing(rotateValue, {
      toValue: 1,
      duration: 18000,
      easing: Easing.linear,
      useNativeDriver: true,
    }), { resetBeforeIteration: true })
    rotateLoopRef.current.start()
    return () => {
      rotateLoopRef.current?.stop()
    }
  }, [armValue, isPlay, rotateValue])
  // console.log('render pic')

  const style = useMemo(() => {
    const imgWidth = Math.min(winWidth * 0.84, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.52)
    return {
      disc: {
        width: imgWidth,
        height: imgWidth,
        borderRadius: imgWidth / 2,
      },
      image: {
        width: imgWidth * 0.62,
        height: imgWidth * 0.62,
        borderRadius: imgWidth * 0.31,
      },
      arm: {
        height: imgWidth * 0.43,
        top: imgWidth * 0.015,
        right: imgWidth * 0.035,
      },
      grooves: VINYL_GROOVES.map(ratio => ({
        width: imgWidth * ratio,
        height: imgWidth * ratio,
        borderRadius: imgWidth * ratio / 2,
      })),
    }
  }, [statusBarHeight, winHeight, winWidth])

  return (
    <View style={styles.container}>
      <View style={{ ...styles.stage, ...style.disc }}>
        <Animated.View style={{ ...styles.content, ...style.disc, elevation: animated ? 8 : 0, opacity: entrance, transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }, { rotate: rotateValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
          <View style={{ ...styles.outerRim, ...style.disc }} />
          <View style={styles.vinylSheen} />
          {style.grooves.map((groove, index) => <View key={index} style={{ ...styles.vinylGroove, ...groove }} />)}
          <Image url={pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={style.image} />
        </Animated.View>
        <Animated.View style={{ ...styles.tonearm, ...style.arm, transformOrigin: '50% 11px', transform: [{ rotate: armValue.interpolate({ inputRange: [0, 1], outputRange: ['10deg', '-28deg'] }) }] }}>
          <View style={styles.tonearmPivot} />
          <View style={styles.tonearmBar} />
          <View style={styles.tonearmNeedle} />
        </Animated.View>
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRim: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#343434',
  },
  vinylGroove: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  vinylSheen: {
    position: 'absolute',
    width: '24%',
    height: '125%',
    backgroundColor: 'rgba(255,255,255,0.035)',
    transform: [{ rotate: '24deg' }],
  },
  tonearm: {
    position: 'absolute',
    width: 28,
    alignItems: 'center',
    zIndex: 20,
    elevation: 14,
  },
  tonearmPivot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#d9dad6',
    borderWidth: 5,
    borderColor: '#f5f5f2',
  },
  tonearmBar: {
    width: 5,
    flex: 1,
    backgroundColor: '#e7e8e4',
    borderRadius: 3,
  },
  tonearmNeedle: {
    width: 12,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#f5f5f2',
  },
})
