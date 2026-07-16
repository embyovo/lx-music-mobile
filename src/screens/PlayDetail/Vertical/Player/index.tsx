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
import { useWindowSize } from '@/utils/hooks'
import { useSettingValue } from '@/store/setting/hook'

const TrackInfo = () => {
  const musicInfo = usePlayerMusicInfo()
  return (
    <View style={styles.trackInfo}>
      <Text size={24} color="#f1f2f1" style={styles.trackName} numberOfLines={1}>{musicInfo.name}</Text>
      <Text size={14} color="rgba(225,228,226,0.72)" numberOfLines={1}>{musicInfo.singer}</Text>
    </View>
  )
}


export default memo(() => {
  const { height } = useWindowSize()
  const isShowCoverLyric = useSettingValue('playDetail.isShowCoverLyric')
  const containerStyle = {
    ...styles.container,
    paddingBottom: Math.max(48, height * (isShowCoverLyric ? 0.12 : 0.13)),
  }
  return (
    <View style={containerStyle} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
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
    paddingTop: 2,
    // backgroundColor: AppColors.primary,
    // backgroundColor: 'red',
    flexDirection: 'column',
  },
  trackInfo: {
    paddingBottom: 10,
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
