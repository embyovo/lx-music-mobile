import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { BorderWidths } from '@/theme'
import { pop, useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import Image from '@/components/common/Image'
import { useListInfo } from './state'
import { useStatusbarHeight } from '@/store/common/hook'
import { useWindowSize } from '@/utils/hooks'
import { Icon } from '@/components/common/Icon'
import commonState from '@/store/common/state'
import songlistState from '@/store/songlist/state'
import { useAccent, DAILY_LIST_ID } from './state'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

// 主题色可能是 '#hex' 或 'rgb()/rgba()' 格式，统一按目标透明度输出 rgba 字符串
const withAlpha = (color: string, alpha: number) => {
  const value = color.replace(/\s+/g, '')
  if (value.startsWith('#')) {
    let hex = value.slice(1)
    if (hex.length == 3) hex = hex.split('').map(c => c + c).join('')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const match = value.match(/rgba?\(([^)]+)\)/)
  if (match) {
    const [r, g, b] = match[1].split(',').slice(0, 3)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return color
}

const Pic = ({ componentId, imgUrl, fillHeight }: {
  componentId: string
  imgUrl?: string
  fillHeight: number
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
    <View style={{ ...styles.heroImage, height: fillHeight }}>
      {/* 放大裁剪，去掉封面素材自带的白边/留白，保证铺满整个区域 */}
      <Image nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info.id}`} url={pic} style={{ ...styles.heroImageContent, transform: [{ scale: 1.18 }] }} />
    </View>
  )
}

// 老黄历：干支纪年月日 + 传统宜忌（按公历规则本地推算，趣味展示）
const GAN = '甲乙丙丁戊己庚辛壬癸'
const ZHI = '子丑寅卯辰巳午未申酉戌亥'
const ALMANAC_YI = ['出行', '嫁娶', '开市', '祭祀', '安床', '纳财', '栽种', '入宅', '祈福', '修造', '会友', '沐浴']
const ALMANAC_JI = ['动土', '词讼', '安葬', '行丧', '掘井', '破土', '上梁', '置产', '争吵', '熬夜']
// 干支纪年月日：以儒略日数为锚点推算日柱，年柱以立春为界，月柱由年干推算
const getGanZhi = (date: Date) => {
  const jdn = Math.floor(date.getTime() / 86400000 + 2440588)
  const ganDay = GAN[(jdn + 9) % 10]
  const zhiDay = ZHI[(jdn + 1) % 12]
  const almanacYear = date.getMonth() + 1 < 2 || (date.getMonth() + 1 === 2 && date.getDate() < 4) ? date.getFullYear() - 1 : date.getFullYear()
  const yearGanIdx = ((almanacYear - 4) % 10 + 10) % 10
  const ganYear = GAN[yearGanIdx]
  const zhiYear = ZHI[((almanacYear - 4) % 12 + 12) % 12]
  const firstMonthGan = (yearGanIdx % 5) * 2 + 2 // 甲己年丙寅起
  const ganMonth = GAN[((firstMonthGan + date.getMonth() - 1) % 10 + 10) % 10]
  const zhiMonth = ZHI[(date.getMonth() + 1) % 12]
  return `${ganYear}${zhiYear}年 · ${ganMonth}${zhiMonth}月 · ${ganDay}${zhiDay}日`
}
// 一言接口加载失败时的本地兜底句子
const FALLBACK_QUOTES = [
  ['生活明朗，万物可爱，人间值得', '今日份鸡汤'],
  ['把喜欢的歌循环到天亮，也是一种浪漫', '音乐日记'],
  ['今天也要为热爱的事情努力一点点', '写给今天'],
  ['日子还长，慢慢来，比较快', '今日份鸡汤'],
  ['耳机里放的是歌，心里装的是光', '音乐日记'],
]
// 历史接口失败时的本地兜底：音乐冷知识（与日期无关，保证不开天窗）
const MUSIC_FACTS = [
  '莫扎特在 35 年的生命里创作了 600 多部作品',
  '贝多芬创作《第九交响曲》时已完全失聪',
  '黑胶 33⅓ 转速的设定源自电影胶片的帧率',
  '钢琴共有 88 个键，其中 52 个是白键',
  '披头士乐队曾创下一天录制 10 首歌的纪录',
  '人类最早的乐器是约 4 万年前的骨笛',
  '《生日快乐歌》的版权曾长期归属华纳音乐',
  '一把吉他全部琴弦的张力加起来约有 70 公斤',
]

// 每日推荐头图：清新薄荷绿渐变 + 中央日期卡片（网易云每日推荐风格）
const DailyHero = ({ fillHeight, mainHeight, accent }: { fillHeight: number, mainHeight: number, accent: string }) => {
  const now = new Date()
  // 内容整体下移，避开状态栏（通知栏）
  const statusBarHeight = useStatusbarHeight()
  const weeks = ['日', '一', '二', '三', '四', '五', '六']
  // 今年进度：今天是一年中的第几天 / 全年天数
  const yearDays = (now.getFullYear() % 4 == 0 && (now.getFullYear() % 100 != 0 || now.getFullYear() % 400 == 0)) ? 366 : 365
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const yearPercent = Math.min(99, Math.max(1, Math.round(dayOfYear / yearDays * 100)))
  // 黄历与兜底内容按日期确定性轮换
  const daySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  const yi = ALMANAC_YI[daySeed % ALMANAC_YI.length]
  const ji = ALMANAC_JI[(daySeed + 7) % ALMANAC_JI.length]
  const ganZhi = getGanZhi(now)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  // 一言（鸡汤），加载失败保持本地兜底
  const [quote, setQuote] = useState<[string, string]>(() => FALLBACK_QUOTES[daySeed % FALLBACK_QUOTES.length])
  // 历史上的今天（维基百科接口），失败时显示本地音乐冷知识
  const [history, setHistory] = useState<{ label: string, text: string }>(() => ({
    label: '音乐冷知识', text: MUSIC_FACTS[daySeed % MUSIC_FACTS.length],
  }))
  useEffect(() => {
    let cancelled = false
    fetch(`https://api.wikimedia.org/feed/v1/wikipedia/zh/onthisday/selected/${mm}/${dd}`, {
      headers: { 'Accept-Language': 'zh-cn' },
    })
      .then(res => res.json())
      .then((data: any) => {
        if (cancelled || !Array.isArray(data?.selected) || !data.selected.length) return
        const ev = data.selected[daySeed % data.selected.length]
        const text = String(ev?.text ?? '').trim()
        if (!text) return
        const yearMatch = /(\d{3,4})年/.exec(ev?.pages?.[0]?.titles?.normalized ?? '')
        setHistory({ label: '历史上的今天', text: yearMatch ? `${yearMatch[1]} 年 · ${text}` : text })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [daySeed, mm, dd])
  useEffect(() => {
    let cancelled = false
    fetch('https://v1.hitokoto.cn/?encode=json&max_length=20')
      .then(res => res.json())
      .then((data: any) => {
        if (!cancelled && data?.hitokoto) setQuote([data.hitokoto, data.from || '一言'])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [daySeed])
  return (
    <View style={{ ...styles.heroImage, height: fillHeight }}>
      <LinearGradient
        style={{ width: '100%', height: '100%' }}
        colors={[accent, '#6FE3B0', '#E3FAEE']}
        locations={[0, 0.45, 1]}
        useAngle={true}
        angle={160}
      />
      {/* 斜向光带，增加层次 */}
      <View style={styles.heroLightStreak} />
      {/* 装饰气泡 */}
      <View style={{ ...styles.bubbleLg, top: -34, right: -26 }} />
      <View style={{ ...styles.bubbleMd, top: mainHeight * 0.52, left: 22 }} />
      <View style={{ ...styles.bubbleSm, top: mainHeight * 0.68, right: 58 }} />
      <View style={{ ...styles.bubbleOutline, top: mainHeight * 0.16, left: 52 }} />
      {/* 音符点缀 */}
      <Text size={26} style={{ ...styles.note, top: mainHeight * 0.14, left: 24 }}>♪</Text>
      <Text size={34} style={{ ...styles.note, top: mainHeight * 0.46, right: 26 }}>♫</Text>
      <Text size={20} style={{ ...styles.note, top: mainHeight * 0.74, left: 74 }}>♩</Text>
      <View style={{ ...styles.dailyContent, height: mainHeight, paddingTop: statusBarHeight + 8 }}>
        {/* 顶部徽标 */}
        <View style={styles.dailyBadge}>
          <Text size={12} color="#ffffff" style={styles.dailyBadgeText}>✦ 每日推荐</Text>
        </View>
        {/* 日期区：左（巨型日期 + 月/星期）｜分隔线｜右（干支 + 宜忌） */}
        <View style={styles.dateRow}>
          <View style={styles.dateLeft}>
            <Text size={74} color="#ffffff" style={styles.dateDay}>{now.getDate()}</Text>
            <View style={styles.dateSide}>
              <Text size={17} color="#ffffff" style={styles.dateMonth}>{`${now.getMonth() + 1}月`}</Text>
              <Text size={13} color="rgba(255,255,255,0.92)">{`星期${weeks[now.getDay()]}`}</Text>
            </View>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateRight}>
            <Text size={11} color="rgba(255,255,255,0.80)" numberOfLines={1}>{ganZhi}</Text>
            <Text size={13} color="#CFFFE6" style={styles.yiLine}>{`宜 · ${yi}`}</Text>
            <Text size={13} color="#FFD9D2" style={styles.jiLine}>{`忌 · ${ji}`}</Text>
          </View>
        </View>
        {/* 年度进度 */}
        <View style={styles.progressRow}>
          <View style={styles.yearProgressBg}>
            <View style={{ ...styles.yearProgressFill, width: `${yearPercent}%` }} />
          </View>
          <Text size={11} color="rgba(255,255,255,0.95)" style={styles.yearProgressLabel}>{`今年已过 ${yearPercent}%`}</Text>
        </View>
        {/* 历史上的今天 + 一言：底部细毛玻璃条 */}
        <View style={styles.factStrip}>
          <View style={styles.factRow}>
            <Text size={11} color="#1f7a4f" style={styles.factLabel}>{history.label}</Text>
            <Text size={11} color="#425c50" style={styles.factText} numberOfLines={1}>{history.text}</Text>
          </View>
          <Text size={11} color="#6b8377" style={styles.quoteText} numberOfLines={1}>{`「 ${quote[0]} 」`}</Text>
        </View>
      </View>
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
  const { height: winHeight } = useWindowSize()
  const theme = useTheme()
  const info = useListInfo()
  const accent = useAccent()
  const isDaily = info.id == DAILY_LIST_ID
  const [detailInfo, setDetailInfo] = useState<DetailInfo>({ name: '', desc: '', playCount: '', imgUrl: info.img })

  // 封面图主体区占屏幕三分之一高度，其余部分为渐变过渡 + 文字区
  const imgHeight = Math.round(winHeight / 3)
  const heroHeight = imgHeight + 156

  const back = () => {
    songlistState.listDetailInfo.id = ''
    songlistState.listDetailInfo.source = 'kw'
    void pop(commonState.componentIds.songlistDetail!)
  }

  // 封面显示开关（悬浮于头图右上角）
  const isShowCover = useSettingValue('list.isShowCover')
  const toggleShowCover = () => {
    updateSetting({ 'list.isShowCover': !isShowCover })
  }

  useImperativeHandle(ref, () => ({
    setInfo(info) {
      setDetailInfo(info)
    },
  }), [])

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-main-background'], borderBottomColor: theme['c-border-background'] }}>
      <View style={{ ...styles.hero, height: heroHeight, backgroundColor: theme['c-main-background'] }}>
        {/* 每日推荐使用渐变+日期卡片头图，其他歌单显示封面 */}
        {isDaily
          ? <DailyHero fillHeight={heroHeight} mainHeight={imgHeight} accent={accent ?? '#2ED573'} />
          : <Pic componentId={componentId} imgUrl={detailInfo.imgUrl} fillHeight={heroHeight} />}
        <View style={{ ...styles.heroOverlay, height: heroHeight }} />
        <LinearGradient
          style={{ ...styles.fadeGradient, top: imgHeight - 90 }}
          colors={[withAlpha(theme['c-main-background'], 0), withAlpha(theme['c-main-background'], 0.8), withAlpha(theme['c-main-background'], 1)]}
          locations={[0, 0.52, 0.88]}
        />
        <TouchableOpacity style={{ ...styles.backBtn, top: statusBarHeight + 8 }} onPress={back} activeOpacity={0.7}>
          <Icon name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={{ ...styles.backBtn, ...styles.coverBtn, top: statusBarHeight + 8 }} onPress={toggleShowCover} activeOpacity={0.7}>
          <Icon name="album" size={20} color={isShowCover ? '#fff' : 'rgba(255,255,255,0.55)'} />
        </TouchableOpacity>
        <View style={styles.heroInfo} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
          <Text size={25} color={theme['c-font']} style={styles.title} numberOfLines={2}>{detailInfo.name}</Text>
          <View style={styles.authorRow}>
            <Image url={detailInfo.imgUrl} style={styles.authorAvatar} />
            <Text size={14} color={theme['c-700']} style={styles.authorName} numberOfLines={1}>{info.author ? info.author : songlistState.listDetailInfo.info.author ? songlistState.listDetailInfo.info.author : '精选歌单'}</Text>
            <View style={{ ...styles.followBtn, borderColor: accent ?? theme['c-200'] }}><Text size={12} color={accent ?? theme['c-font']}>关注</Text></View>
          </View>
          <View style={styles.descriptionRow}>
            <Text style={styles.description} size={13} color={theme['c-600']} numberOfLines={1}>{detailInfo.desc || '用音乐记录此刻的心情'}</Text>
            <Icon name="chevron-right" size={14} color={theme['c-500']} />
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
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
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
    backgroundColor: 'rgba(8, 14, 12, 0.10)',
  },
  fadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  dailyContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
  },
  dailyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
  },
  dailyBadgeText: {
    letterSpacing: 1,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateDay: {
    fontWeight: '700',
    lineHeight: 80,
    textShadowColor: 'rgba(23, 92, 60, 0.28)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  dateSide: {
    marginLeft: 12,
    alignItems: 'flex-start',
  },
  dateMonth: {
    fontWeight: '700',
    marginBottom: 2,
  },
  dateDivider: {
    width: 1,
    height: 54,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  dateRight: {
    alignItems: 'flex-start',
  },
  yiLine: {
    fontWeight: '600',
    marginTop: 5,
  },
  jiLine: {
    fontWeight: '600',
    marginTop: 3,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: '78%',
    marginTop: 14,
  },
  yearProgressBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    overflow: 'hidden',
  },
  yearProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  yearProgressLabel: {
    marginLeft: 10,
  },
  factStrip: {
    position: 'absolute',
    left: '7%',
    right: '7%',
    bottom: 2,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    paddingTop: 7,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factLabel: {
    fontWeight: '600',
    marginRight: 8,
  },
  factText: {
    flex: 1,
  },
  quoteText: {
    marginTop: 5,
    fontStyle: 'italic',
  },
  heroLightStreak: {
    position: 'absolute',
    left: '-15%',
    top: '-30%',
    width: '34%',
    height: '160%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '26deg' }],
  },
  bubbleLg: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
  },
  bubbleMd: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  bubbleSm: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  bubbleOutline: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.30)',
  },
  note: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.34)',
    fontWeight: '600',
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
  coverBtn: {
    left: undefined,
    right: 12,
  },
  heroInfo: {
    paddingHorizontal: 18,
    paddingBottom: 12,
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
  listItemImg: {
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden',
  },
})
