import { memo, useRef } from 'react'

import { View, StyleSheet, TouchableOpacity } from 'react-native'

import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import { useStatusbarHeight } from '@/store/common/hook'
import Btn from './Btn'
import TimeoutExitBtn from './TimeoutExitBtn'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)


export default memo(({ pageIndex, onChangePage }: { pageIndex: number, onChangePage: (index: number) => void }) => {
  const popupRef = useRef<SettingPopupType>(null)
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }
  const showSetting = () => {
    popupRef.current?.show()
  }

  return (
    <View style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <StatusBar />
      <View style={styles.container}>
        <Btn icon="chevron-left" color="#fff" onPress={back} />
        <View style={styles.segment}>
          <TouchableOpacity style={pageIndex == 0 ? styles.segmentActive : styles.segmentItem} onPress={() => { onChangePage(0) }}>
            <Text size={12} color={pageIndex == 0 ? '#1d2a24' : 'rgba(255,255,255,0.68)'}>封面</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pageIndex == 1 ? styles.segmentActive : styles.segmentItem} onPress={() => { onChangePage(1) }}>
            <Text size={12} color={pageIndex == 1 ? '#1d2a24' : 'rgba(255,255,255,0.68)'}>歌词</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerSpacer} />
        <TimeoutExitBtn />
        <Btn icon="dots-vertical" color="#fff" onPress={showSetting} />
      </View>
      <SettingPopup ref={popupRef} direction="vertical" />
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'relative',
    height: '100%',
    alignItems: 'center',
  },
  segment: {
    position: 'absolute',
    left: '50%',
    marginLeft: -63,
    top: '50%',
    marginTop: -15,
    width: 126,
    maxWidth: 126,
    height: 30,
    padding: 3,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSpacer: {
    flex: 1,
  },
  segmentItem: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentActive: {
    flex: 1,
    height: 24,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
