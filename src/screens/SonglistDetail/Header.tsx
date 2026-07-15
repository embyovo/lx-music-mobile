import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { BorderWidths } from '@/theme'
import ButtonBar from './ActionBar'
import { pop, useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import Image from '@/components/common/Image'
import { useListInfo } from './state'
import { useStatusbarHeight } from '@/store/common/hook'
import { Icon } from '@/components/common/Icon'
import commonState from '@/store/common/state'
import songlistState from '@/store/songlist/state'

const FADE_OPACITIES = [0.05, 0.09, 0.14, 0.21, 0.30, 0.42, 0.56, 0.70, 0.83, 0.93]

const Pic = ({ componentId, imgUrl }: {
  componentId: string
  imgUrl?: string
}) => {
  const [pic, setPic] = useState(imgUrl)
  const [animated, setAnimated] = useState(false)
  const info = useListInfo()
  useEffect(() => {
    if (animated) setPic(imgUrl)
  }, [imgUrl, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  return (
    <View style={styles.heroImage}>
      <Image nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info.id}`} url={pic} style={styles.heroImageContent} />
    </View>
  )
}

export interface HeaderProps {
  componentId: string
}

export interface HeaderType {
  setInfo: (info: DetailInfo) => void
}
export interface DetailInfo {
  name: string
  desc: string
  playCount: string
  imgUrl?: string
}

export default forwardRef<HeaderType, HeaderProps>(({ componentId }: { componentId: string }, ref) => {
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()
  const info = useListInfo()
  const [detailInfo, setDetailInfo] = useState<DetailInfo>({ name: '', desc: '', playCount: '', imgUrl: info.img })

  const back = () => {
    songlistState.listDetailInfo.id = ''
    songlistState.listDetailInfo.source = 'kw'
    void pop(commonState.componentIds.songlistDetail!)
  }

  useImperativeHandle(ref, () => ({
    setInfo(info) {
      setDetailInfo(info)
    },
  }), [])

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-main-background'], borderBottomColor: theme['c-border-background'] }}>
      <View style={{ ...styles.hero, backgroundColor: theme['c-main-background'] }}>
        <Pic componentId={componentId} imgUrl={detailInfo.imgUrl} />
        <View style={styles.heroOverlay} />
        {FADE_OPACITIES.map((opacity, index) => (
          <View key={index} style={{ ...styles.fadeBand, top: 170 + index * 18, opacity, backgroundColor: theme['c-main-background'] }} />
        ))}
        <View style={{ ...styles.fadeSolid, backgroundColor: theme['c-main-background'] }} />
        <TouchableOpacity style={{ ...styles.backBtn, top: statusBarHeight + 8 }} onPress={back} activeOpacity={0.7}>
          <Icon name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ ...styles.shareBtn, top: statusBarHeight + 8 }}>
          <Icon name="share" size={21} color="#fff" />
        </View>
        <View style={{ ...styles.heroInfoBackdrop, backgroundColor: theme['c-main-background'] }} />
        <View style={styles.heroInfo} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
          <Text size={25} color={theme['c-font']} style={styles.title} numberOfLines={2}>{detailInfo.name}</Text>
          <View style={styles.authorRow}>
            <Image url={detailInfo.imgUrl} style={styles.authorAvatar} />
            <Text size={14} color={theme['c-700']} style={styles.authorName} numberOfLines={1}>{info.author ? info.author : songlistState.listDetailInfo.info.author ? songlistState.listDetailInfo.info.author : '精选歌单'}</Text>
            <View style={{ ...styles.followBtn, borderColor: theme['c-200'] }}><Text size={12} color={theme['c-font']}>关注</Text></View>
          </View>
          <View style={styles.descriptionRow}>
            <Text style={styles.description} size={13} color={theme['c-600']} numberOfLines={1}>{detailInfo.desc || '用音乐记录此刻的心情'}</Text>
            <Icon name="chevron-right" size={14} color={theme['c-500']} />
          </View>
        </View>
      </View>
      <View style={{ ...styles.contentSurface, backgroundColor: theme['c-main-background'] }}>
        <ButtonBar />
        <View style={{ ...styles.listToolbar, borderTopColor: theme['c-border-background'] }}>
          <View>
            <Text size={16} color={theme['c-font']} style={styles.listTitle}>{info.total ? `${info.total}首歌曲` : '歌曲列表'}</Text>
            <Text size={11} color={theme['c-500']}>按歌单顺序播放</Text>
          </View>
          <View style={styles.toolbarActions}>
            <View style={{ ...styles.toolbarIcon, backgroundColor: theme['c-000'] }}><Icon name="comment" size={18} color={theme['c-600']} /></View>
            <View style={{ ...styles.toolbarIcon, backgroundColor: theme['c-000'] }}><Icon name="download-2" size={18} color={theme['c-600']} /></View>
            <View style={{ ...styles.toolbarIcon, backgroundColor: theme['c-000'] }}><Icon name="list-order" size={18} color={theme['c-600']} /></View>
            <Icon name="dots-vertical" size={18} color={theme['c-600']} />
          </View>
        </View>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    borderBottomWidth: BorderWidths.normal,
  },
  hero: {
    height: 410,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 330,
  },
  heroImageContent: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 330,
    backgroundColor: 'rgba(8, 14, 12, 0.10)',
  },
  fadeBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 74,
  },
  fadeSolid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 332,
    bottom: 0,
  },
  backBtn: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.46)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtn: {
    position: 'absolute',
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  heroInfoBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 146,
    opacity: 0.92,
  },
  title: {
    fontWeight: '700',
    marginBottom: 10,
  },
  authorRow: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
  },
  authorName: {
    maxWidth: 150,
    marginLeft: 8,
  },
  followBtn: {
    height: 28,
    marginLeft: 10,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
  },
  descriptionRow: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    flex: 1,
    marginRight: 6,
  },
  listToolbar: {
    height: 70,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: BorderWidths.normal,
  },
  listTitle: {
    fontWeight: '700',
    marginBottom: 3,
  },
  contentSurface: {
    marginTop: -5,
    paddingTop: 5,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolbarIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemImg: {
    // backgroundColor: '#eee',
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden',
    // width: 70,
    // height: 70,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: {
    //       width: 0,
    //       height: 1,
    //     },
    //     shadowOpacity: 0.20,
    //     shadowRadius: 1.41,
    //   },
    //   android: {
    //     elevation: 2,
    //   },
    // }),
  },
})
