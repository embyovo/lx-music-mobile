import { memo } from 'react'
import { View } from 'react-native'

// import Title from './components/Title'
import MoreBtn from './components/MoreBtn'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'

const TrackInfo = () => {
  const musicInfo = usePlayerMusicInfo()
  return (
    <View style={styles.trackInfo}>
      <Text size={20} color="#fff" style={styles.trackName} numberOfLines={1}>{musicInfo.name}</Text>
      <Text size={13} color="rgba(255,255,255,0.68)" numberOfLines={1}>{musicInfo.singer}</Text>
    </View>
  )
}


export default memo(() => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      <TrackInfo />
      <PlayInfo />
      <ControlBtn />
      <MoreBtn />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 0,
    width: '100%',
    // paddingTop: progressContentPadding,
    // marginTop: -progressContentPadding,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 5,
    // backgroundColor: AppColors.primary,
    // backgroundColor: 'red',
    flexDirection: 'column',
  },
  trackInfo: {
    paddingBottom: 8,
  },
  trackName: {
    fontWeight: '700',
    marginBottom: 3,
  },
  status: {
    marginTop: 10,
    flexDirection: 'column',
    flex: 0,
    paddingLeft: 5,
    justifyContent: 'space-evenly',
    // backgroundColor: 'rgba(0, 0, 0, .1)',
  },
})
