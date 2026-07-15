import { useState } from 'react'
import { View, TouchableOpacity, TextInput } from 'react-native'
// import Button from '@/components/common/Button'
// import { navigations } from '@/navigation'
// import { BorderWidths } from '@/theme'
import { useTheme } from '@/store/theme/hook'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { useSettingValue } from '@/store/setting/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'
import { setNavActiveId } from '@/core/common'
import searchState from '@/store/search/state'
import { debounceTipSearch } from '@/screens/Home/Views/Search/TipList'

const headerComponents: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_search: <SearchTypeSelector />,
}

const HomeSearch = () => {
  const theme = useTheme()
  const [text, setText] = useState('')
  const [tips, setTips] = useState<string[]>([])
  const submit = (value = text) => {
    const keyword = value.trim()
    if (!keyword) return
    setTips([])
    searchState.searchText = keyword
    setNavActiveId('nav_search')
  }
  const changeText = (value: string) => {
    setText(value)
    const keyword = value.trim()
    if (!keyword) {
      setTips([])
      return
    }
    debounceTipSearch(keyword, searchState.temp_source, list => {
      if (keyword == value.trim()) setTips(list.slice(0, 8))
    })
  }
  return (
    <View style={{ ...styles.homeSearch, backgroundColor: theme['c-000'] }}>
      <Icon name="search-2" size={17} color={theme['c-400']} />
      <TextInput
        value={text}
        onChangeText={changeText}
        onSubmitEditing={() => { submit() }}
        onFocus={() => { changeText(text) }}
        onBlur={() => { setTimeout(() => { setTips([]) }, 180) }}
        returnKeyType="search"
        placeholder="搜索音乐、歌手"
        placeholderTextColor={theme['c-400']}
        selectionColor={theme['c-primary']}
        style={{ ...styles.homeSearchInput, color: theme['c-font'] }}
      />
      {tips.length
        ? <View style={{ ...styles.homeTips, backgroundColor: theme['c-000'] }}>
            {tips.map((item, index) => (
              <TouchableOpacity key={`${item}_${index}`} style={styles.homeTipItem} onPress={() => { setText(item); submit(item) }}>
                <Icon name="search-2" size={14} color={theme['c-400']} />
                <Text style={styles.homeTipText} numberOfLines={1}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        : null}
    </View>
  )
}


// const LeftTitle = () => {
//   const id = useNavActiveId()
//   const t = useI18n()

//   return <Text style={styles.leftTitle} size={18}>{t(id)}</Text>
// }
const LeftHeader = () => {
  const theme = useTheme()
  const id = useNavActiveId()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()

  const openMenu = () => {
    global.app_event.changeMenuVisible(true)
  }

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
    }}>
      <View style={styles.left}>
        {id == 'nav_search'
          ? <TouchableOpacity style={styles.backBtn} onPress={() => { setNavActiveId('nav_songlist') }}><Icon name="chevron-left" size={20} color={theme['c-font']} /></TouchableOpacity>
          : null}
        {id == 'nav_songlist'
          ? <HomeSearch />
          : <View style={styles.titleBtn}><Text style={styles.brand} size={20}>{id == 'nav_search' ? '搜索' : id == 'nav_love' ? '我的收藏' : t(id)}</Text></View>}
      </View>
      {headerComponents[id] ?? null}

      {id == 'nav_songlist' || id == 'nav_love' ? null : <TouchableOpacity style={styles.btn} onPress={openMenu}>
        <Icon color={theme['c-font']} name={id == 'nav_setting' ? 'dots-vertical' : 'menu'} size={19} />
      </TouchableOpacity>}

      {/* <TouchableOpacity style={styles.btn} onPress={openSetting}>
        <Icon style={{ ...styles.btnText, color: theme['c-font'] }} name="setting" size={styles.btnText.fontSize} />
      </TouchableOpacity> */}
    </View>
  )
}


// const RightTitle = () => {
//   const id = useNavActiveId()
//   const t = useI18n()

//   return <Text style={styles.rightTitle} size={18}>{t(id)}</Text>
// }
const RightHeader = () => {
  const theme = useTheme()
  const t = useI18n()
  const id = useNavActiveId()
  const statusBarHeight = useStatusbarHeight()

  const openMenu = () => {
    global.app_event.changeMenuVisible(true)
  }
  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
    }}>
      <View style={styles.left}>
        {id == 'nav_search'
          ? <TouchableOpacity style={styles.backBtn} onPress={() => { setNavActiveId('nav_songlist') }}><Icon name="chevron-left" size={20} color={theme['c-font']} /></TouchableOpacity>
          : null}
        {id == 'nav_songlist'
          ? <HomeSearch />
          : <View style={styles.titleBtn}><Text style={styles.brand} size={20}>{id == 'nav_search' ? '搜索' : id == 'nav_love' ? '我的收藏' : t(id)}</Text></View>}
      </View>
      {headerComponents[id] ?? null}
      {id == 'nav_songlist' || id == 'nav_love' ? null : <TouchableOpacity style={styles.btn} onPress={openMenu}>
        <Icon color={theme['c-font']} name={id == 'nav_setting' ? 'dots-vertical' : 'menu'} size={19} />
      </TouchableOpacity>}
      {/* <TouchableOpacity style={styles.btn} onPress={openSetting}>
        <Icon style={{ ...styles.btnText, color: theme['c-font'] }} name="setting" size={styles.btnText.fontSize} />
      </TouchableOpacity> */}
    </View>
  )
}

const Header = () => {
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

  return (
    <>
      <StatusBar />
      {
        drawerLayoutPosition == 'left'
          ? <LeftHeader />
          : <RightHeader />
      }

    </>
  )
}


const styles = createStyle({
  container: {
    // width: '100%',
    paddingRight: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 16,
    alignItems: 'center',
    height: '100%',
  },
  btn: {
    // flex: 1,
    width: HEADER_HEIGHT,
    // backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  titleBtn: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.1)',
    height: '100%',
    justifyContent: 'center',
  },
  backBtn: {
    width: 38,
    height: '100%',
    marginLeft: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeSearch: {
    flex: 1,
    height: 36,
    borderRadius: 20,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    zIndex: 20,
  },
  homeSearchInput: {
    flex: 1,
    height: 36,
    paddingVertical: 0,
    paddingLeft: 9,
    fontSize: 14,
  },
  homeTips: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 42,
    borderRadius: 14,
    paddingVertical: 6,
    elevation: 12,
    overflow: 'hidden',
  },
  homeTipItem: {
    height: 39,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeTipText: {
    marginLeft: 10,
    flex: 1,
  },
  brand: {
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  leftTitle: {
    paddingLeft: 14,
    paddingRight: 16,
  },
  rightTitle: {
    paddingLeft: 16,
    paddingRight: 16,
  },
})

export default Header
