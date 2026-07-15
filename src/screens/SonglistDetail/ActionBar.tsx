import { memo } from 'react'
import { View } from 'react-native'
import Button from '@/components/common/Button'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useListInfo } from './state'
import { Icon } from '@/components/common/Icon'
// import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const info = useListInfo()

  const handlePlayAll = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }

  const handleCollection = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handleCollect(info.id, info.source, songlistState.listDetailInfo.info.name || info.name)
  }

  return (
    <View style={styles.container}>
      <Button onPress={handleCollection} style={{ ...styles.controlBtn, backgroundColor: theme['c-000'] }}>
        <Icon name="love" size={19} color={theme['c-font']} />
        <Text style={{ ...styles.controlBtnText, color: theme['c-font'] }}>{t('collect_songlist')}</Text>
      </Button>
      <Button onPress={handlePlayAll} style={{ ...styles.controlBtn, backgroundColor: theme['c-000'] }}>
        <Icon name="play" size={19} color={theme['c-font']} />
        <Text style={{ ...styles.controlBtnText, color: theme['c-font'] }}>{t('play_all')}</Text>
      </Button>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
  },
  controlBtn: {
    flexGrow: 1,
    flexShrink: 1,
    width: '33%',
    height: 52,
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 27,
    gap: 9,
  },
  controlBtnText: {
    fontSize: 13,
    textAlign: 'center',
  },
})
