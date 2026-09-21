import { type ListInfoItem } from '@/store/songlist/state'
import { createContext, useContext } from 'react'

export const ListInfoContext = createContext<ListInfoItem>({
  id: '',
  author: '',
  name: '',
  source: 'kw',
})

export const useListInfo = () => {
  return useContext(ListInfoContext)
}

/** 每日推荐固定主题色（浅色系清新薄荷绿，明快有活力） */
export const DAILY_ACCENT = '#2ED573'
/** 每日推荐的歌单 id */
export const DAILY_LIST_ID = '-1'

/** 歌单主题色（由封面提取），null 表示使用全局主题色 */
export const AccentContext = createContext<string | null>(null)

export const useAccent = () => {
  return useContext(AccentContext)
}

