import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { BorderWidths } from '@/theme'
import { useTheme } from '@/store/theme/hook'
import { useActiveListId, useListFetching, useMusicList, useMyList } from '@/store/list/hook'
import { createStyle } from '@/utils/tools'
import { getListPrevSelectId } from '@/utils/data'
import { setActiveList } from '@/core/list'
import Text from '@/components/common/Text'
import Loading from '@/components/common/Loading'
import { playList } from '@/core/player/player'

export interface ActiveListProps {
  onShowSearchBar: () => void
  onScrollToTop: () => void
}
export interface ActiveListType {
  setVisibleBar: (visible: boolean) => void
}

export default forwardRef<ActiveListType, ActiveListProps>(({ onShowSearchBar, onScrollToTop }, ref) => {
  const theme = useTheme()
  const currentListId = useActiveListId()
  const fetching = useListFetching(currentListId)
  const musicList = useMusicList()
  const allLists = useMyList()
  const [visibleBar, setVisibleBar] = useState(true)

  useImperativeHandle(ref, () => ({
    setVisibleBar(visible) {
      setVisibleBar(visible)
    },
  }))

  const showList = () => {
    global.app_event.changeLoveListVisible(true)
  }
  const playAll = () => {
    if (!musicList.length) return
    void playList(currentListId, 0)
  }

  useEffect(() => {
    void getListPrevSelectId().then((id) => {
      setActiveList(id)
    })
  }, [])

  return (
    <View style={{ ...styles.header, opacity: visibleBar ? 1 : 0 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {allLists.map(item => {
          const active = item.id == currentListId
          return (
            <TouchableOpacity key={item.id} style={styles.listTab} onPress={() => { setActiveList(item.id) }}>
              <Text size={15} numberOfLines={1} color={active ? theme['c-primary'] : theme['c-700']} style={active ? styles.tabText : undefined}>{item.name}</Text>
              {active ? <View style={{ ...styles.listTabActive, backgroundColor: theme['c-primary'] }} /> : null}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
      <TouchableOpacity style={{ ...styles.search, backgroundColor: theme['c-000'] }} onPress={onShowSearchBar}>
        <Icon color={theme['c-400']} name="search-2" size={18} />
        <Text style={styles.searchText} color={theme['c-500']}>搜索我收藏的歌曲</Text>
      </TouchableOpacity>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.playAll} onPress={playAll} onLongPress={onScrollToTop}>
          <View style={{ ...styles.playCircle, backgroundColor: theme['c-primary'] }}><Icon name="play" size={17} color="#10271e" /></View>
          <Text size={16} style={styles.playText}>全部播放 ({musicList.length})</Text>
        </TouchableOpacity>
        {fetching ? <Loading color={theme['c-primary']} style={styles.loading} /> : null}
        <TouchableOpacity style={styles.toolBtn} onPress={showList}><Icon name="album" size={19} color={theme['c-600']} /></TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={onShowSearchBar}><Icon name="search-2" size={19} color={theme['c-600']} /></TouchableOpacity>
      </View>
    </View>
  )
})


const styles = createStyle({
  header: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  tabs: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  listTab: {
    maxWidth: 132,
    height: 34,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTabActive: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 1,
    height: 3,
    borderRadius: 2,
  },
  tabText: {
    fontWeight: '700',
  },
  search: {
    height: 38,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchText: {
    marginLeft: 9,
  },
  toolbar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playAll: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    fontWeight: '700',
    marginLeft: 10,
  },
  toolBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentList: {
    flexDirection: 'row',
    paddingRight: 2,
    height: 36,
    alignItems: 'center',
    borderBottomWidth: BorderWidths.normal,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  currentListIcon: {
    paddingLeft: 15,
    paddingRight: 10,
    // paddingTop: 10,
    // paddingBottom: 0,
  },
  currentListText: {
    flex: 1,
    // minWidth: 70,
    // paddingLeft: 10,
    paddingRight: 10,
    // paddingTop: 10,
    // paddingBottom: 10,
  },
  loading: {
    marginRight: 5,
  },
  currentListBtns: {
    width: 46,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
})
