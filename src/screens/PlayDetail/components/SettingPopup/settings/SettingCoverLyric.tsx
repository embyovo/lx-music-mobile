import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import CheckBox from '@/components/common/CheckBox'
import styles from './style'

export default () => {
  const isShowCoverLyric = useSettingValue('playDetail.isShowCoverLyric')
  const handleChange = (value: boolean) => {
    updateSetting({ 'playDetail.isShowCoverLyric': value })
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CheckBox marginBottom={3} check={isShowCoverLyric} label="显示封面歌词" onChange={handleChange} />
      </View>
    </View>
  )
}
