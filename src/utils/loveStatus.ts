import { useEffect, useRef, useState } from 'react'
import playerState from '@/store/player/state'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { getListMusics, addListMusics, removeListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import { toast } from '@/utils/tools'

// 已喜欢状态的心形颜色（播放栏与详情页保持一致）
export const LIKE_COLOR = '#ec4141'

// 获取当前播放歌曲对应的标准歌曲信息（下载/缓存歌曲的 id 与原歌曲 id 不同，需取 metadata 内的原始信息）
export const getPlayingSong = (): LX.Music.MusicInfo | null => {
  const raw = playerState.playMusicInfo.musicInfo
  if (!raw) return null
  return 'progress' in raw ? raw.metadata.musicInfo : raw
}

// 在“喜欢”列表中查找歌曲条目：优先按 id 匹配，id 形态不同（如跨端同步）时用 源+平台歌曲ID 兜底
const findLoveItem = (list: LX.Music.MusicInfo[], song: LX.Music.MusicInfo | null) => {
  if (!song) return undefined
  return list.find(item => item.id === song.id)
    ?? list.find(item => item.source === song.source && String(item.meta.songId) === String(song.meta.songId))
}

/**
 * 当前播放歌曲的“喜欢”状态与切换
 * 播放栏（QuickLike）与播放详情页（MusicAddBtn）的喜欢按钮共用
 */
export const useLoveStatus = () => {
  const music = usePlayerMusicInfo()
  const [liked, setLiked] = useState(false)
  const [busy, setBusy] = useState(false)
  const likedIdRef = useRef<string | null>(null)

  useEffect(() => {
    let active = true
    const update = () => {
      const song = getPlayingSong()
      if (!song) {
        likedIdRef.current = null
        if (active) setLiked(false)
        return
      }
      void getListMusics(LIST_IDS.LOVE).then(list => {
        if (!active) return
        const item = findLoveItem(list, song)
        likedIdRef.current = item ? item.id : null
        setLiked(!!item)
      }).catch(() => {})
    }
    const onChange = (ids: string[]) => { if (ids.includes(LIST_IDS.LOVE)) update() }
    likedIdRef.current = null
    setLiked(false)
    update()
    global.app_event.on('myListMusicUpdate', onChange)
    return () => { active = false; global.app_event.off('myListMusicUpdate', onChange) }
  }, [music.id])

  const toggle = async() => {
    const song = getPlayingSong()
    if (!song || busy) return
    setBusy(true)
    try {
      const list = await getListMusics(LIST_IDS.LOVE)
      const item = findLoveItem(list, song)
      if (item) {
        likedIdRef.current = null
        setLiked(false)
        await removeListMusics(LIST_IDS.LOVE, [item.id])
      } else {
        likedIdRef.current = song.id
        setLiked(true)
        await addListMusics(LIST_IDS.LOVE, [song], 'top')
      }
    } catch {
      toast('收藏操作失败，请重试')
      // 失败回滚：按列表真实状态恢复
      const restored = getPlayingSong()
      if (!restored) {
        likedIdRef.current = null
        setLiked(false)
      } else {
        void getListMusics(LIST_IDS.LOVE).then(list => {
          const item = findLoveItem(list, restored)
          likedIdRef.current = item ? item.id : null
          setLiked(!!item)
        }).catch(() => {})
      }
    } finally { setBusy(false) }
  }

  return { liked, busy, toggle }
}
