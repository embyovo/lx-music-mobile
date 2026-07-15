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
import { useTheme } from '@/store/theme/hook'


export default ({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()
  const isPlay = useIsPlay()
  const rotateValue = useRef(new Animated.Value(0)).current
  const entrance = useRef(new Animated.Value(0)).current
  const armValue = useRef(new Animated.Value(isPlay ? 1 : 0)).current
  const pulseValues = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current
  const rotateLoopRef = useRef<ReturnType<typeof Animated.loop> | null>(null)
  const pulseLoopRef = useRef<ReturnType<typeof Animated.parallel> | null>(null)

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
    Animated.spring(armValue, {
      toValue: isPlay ? 1 : 0,
      damping: 14,
      stiffness: 90,
      mass: 0.8,
      useNativeDriver: true,
    }).start()
    if (!isPlay) {
      rotateLoopRef.current?.stop()
      pulseLoopRef.current?.stop()
      pulseValues.forEach(value => { value.setValue(0) })
      return
    }
    rotateLoopRef.current = Animated.loop(Animated.timing(rotateValue, {
      toValue: 1,
      duration: 18000,
      easing: Easing.linear,
      useNativeDriver: true,
    }), { resetBeforeIteration: true })
    rotateLoopRef.current.start()
    pulseLoopRef.current = Animated.parallel(pulseValues.map((value, index) => Animated.loop(Animated.sequence([
      Animated.delay(index * 980),
      Animated.timing(value, {
        toValue: 1,
        duration: 3400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay((2 - index) * 980),
    ]))))
    pulseLoopRef.current.start()
    return () => {
      rotateLoopRef.current?.stop()
      pulseLoopRef.current?.stop()
    }
  }, [armValue, isPlay, pulseValues, rotateValue])
  // console.log('render pic')

  const style = useMemo(() => {
    const imgWidth = Math.min(winWidth * 0.72, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.46)
    return {
      disc: {
        width: imgWidth,
        height: imgWidth,
        borderRadius: imgWidth / 2,
      },
      image: {
        width: imgWidth * 0.48,
        height: imgWidth * 0.48,
        borderRadius: imgWidth * 0.24,
      },
      hole: {
        width: imgWidth * 0.055,
        height: imgWidth * 0.055,
        borderRadius: imgWidth * 0.0275,
      },
      arm: {
        height: imgWidth * 0.43,
        top: imgWidth * 0.015,
        right: imgWidth * 0.035,
      },
      pulse: {
        width: imgWidth * 0.78,
        height: imgWidth * 0.78,
        borderRadius: imgWidth * 0.39,
      },
    }
  }, [statusBarHeight, winHeight, winWidth])

  return (
    <View style={styles.container}>
      {pulseValues.map((value, index) => (
        <Animated.View key={index} style={{ ...styles.pulseRing, ...style.pulse, opacity: value.interpolate({ inputRange: [0, 0.16, 0.72, 1], outputRange: [0, 0.46, 0.28, 0] }), transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.94, 2.35] }) }] }}>
          <Image url={pic} style={styles.pulseImage} />
          <View style={styles.pulseCutout} />
        </Animated.View>
      ))}
      <View style={{ ...styles.stage, ...style.disc }}>
        <Animated.View style={{ ...styles.content, ...style.disc, elevation: animated ? 8 : 0, opacity: entrance, transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }, { rotate: rotateValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
          <View style={{ ...styles.discRing, ...style.disc }} />
          <Image url={pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={style.image} />
          <View style={{ ...styles.hole, ...style.hole, backgroundColor: theme['c-content-background'] }} />
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
  discRing: {
    position: 'absolute',
    borderWidth: 14,
    borderColor: '#292929',
    opacity: 0.75,
  },
  hole: {
    position: 'absolute',
  },
  pulseRing: {
    position: 'absolute',
    overflow: 'hidden',
  },
  pulseImage: {
    width: '100%',
    height: '100%',
  },
  pulseCutout: {
    position: 'absolute',
    left: '13%',
    right: '13%',
    top: '13%',
    bottom: '13%',
    borderRadius: 999,
    backgroundColor: 'rgba(12, 21, 15, 0.78)',
  },
  tonearm: {
    position: 'absolute',
    width: 28,
    alignItems: 'center',
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
