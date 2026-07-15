import { memo, useEffect, useRef } from 'react'
import { Animated, TouchableOpacity, View } from 'react-native'
import { NAV_MENUS } from '@/config/constant'
import { setNavActiveId } from '@/core/common'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

const NAV_LABELS: Partial<Record<(typeof NAV_MENUS)[number]['id'], string>> = {
  nav_search: '首页',
  nav_songlist: '音乐馆',
  nav_top: '排行',
  nav_love: '我的',
  nav_setting: '设置',
}

const HOME_NAV_MENUS = NAV_MENUS.filter(item => item.id != 'nav_songlist')

const NavIcon = ({ active, icon, color, activeBackground }: { active: boolean, icon: string, color: string, activeBackground: string }) => {
  const scale = useRef(new Animated.Value(active ? 1 : 0.92)).current
  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1 : 0.92,
      damping: 15,
      stiffness: 180,
      mass: 0.7,
      useNativeDriver: true,
    }).start()
  }, [active, scale])
  return (
    <Animated.View style={[active ? { ...styles.iconActive, backgroundColor: activeBackground } : styles.icon, { transform: [{ scale }] }]}>
      <Icon name={icon} size={20} color={color} />
    </Animated.View>
  )
}

const BottomNav = () => {
  const activeId = useNavActiveId()
  const theme = useTheme()
  const t = useI18n()

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'], borderTopColor: theme['c-100'] }}>
      {HOME_NAV_MENUS.map(item => {
        const active = item.id == 'nav_search'
          ? activeId == 'nav_search' || activeId == 'nav_songlist'
          : item.id == activeId
        const color = active ? theme['c-primary'] : theme['c-600']
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            activeOpacity={0.65}
            onPress={() => { setNavActiveId(item.id == 'nav_search' ? 'nav_songlist' : item.id) }}
          >
            <NavIcon active={active} icon={item.icon} color={color} activeBackground={theme['c-primary-light-800']} />
            <Text size={11} color={color} numberOfLines={1}>{NAV_LABELS[item.id] ?? t(item.id)}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = createStyle({
  container: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  item: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    height: 29,
    minWidth: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActive: {
    height: 29,
    minWidth: 48,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default memo(BottomNav)
