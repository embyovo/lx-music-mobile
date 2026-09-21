import { useLoveStatus, LIKE_COLOR } from '@/utils/loveStatus'
import HeartIcon from '@/components/common/HeartIcon'
import Btn, { BTN_ICON_SIZE } from './Btn'


export default () => {
  const { liked, toggle } = useLoveStatus()

  return (
    // 与播放栏心形一致：点击直接收藏/取消收藏，已喜欢时红色填满心形
    <Btn icon="add-music" onPress={() => { void toggle() }}>
      {liked
        ? <HeartIcon filled size={BTN_ICON_SIZE} color={LIKE_COLOR} />
        : undefined}
    </Btn>
  )
}
