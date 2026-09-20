import AsyncStorage from '@react-native-async-storage/async-storage'
import { LIST_IDS } from '@/config/constant'
import { getSyncHost } from '@/utils/data'
import { toast } from '@/utils/tools'

// Remote failures must not undo a successful local favourite.
export const syncNeteaseLikes = async(listId: string, musicInfos: LX.Music.MusicInfo[]) => {
  if (listId !== LIST_IDS.LOVE) return
  const songs = musicInfos.filter(music => music.source === 'wy')
  if (!songs.length) return
  try {
    const [cookie, configuredHost] = await Promise.all([AsyncStorage.getItem('cookie'), getSyncHost()])
    const host = configuredHost.trim().replace(/\/+$/, '')
    if (!cookie || !host) {
      toast('已收藏到本地；请先配置服务并登录网易云，才能同步到网易云我的喜欢', 'long')
      return
    }
    const ids = [...new Set(songs.map(music => String(music.meta.songId)))]
    let failed = 0
    let loginExpired = false
    // Sequential requests avoid flooding the service during batch additions.
    for (const id of ids) {
      if (loginExpired || !/^[1-9]\d*$/.test(id)) {
        failed++
        continue
      }
      const controller = new AbortController()
      const timeout = setTimeout(() => { controller.abort() }, 10000)
      try {
        const response = await fetch(`${host}/api/netease/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, like: true, cookie }),
          signal: controller.signal,
        })
        const result = await response.json() as { code?: number }
        if (!response.ok || result.code !== 200) {
          failed++
          if (response.status === 401 || result.code === 301 || result.code === 401) loginExpired = true
        }
      } catch {
        failed++
      } finally {
        clearTimeout(timeout)
      }
    }
    if (failed) {
      toast(loginExpired
        ? '已收藏到本地；网易云登录已失效，请重新登录后再添加以同步'
        : `已收藏到本地；${failed}首歌曲未能同步到网易云，请检查网络或服务后重试`, 'long')
    }
  } catch {
    toast('已收藏到本地；网易云同步失败，请检查登录和服务配置', 'long')
  }
}

export const scheduleNeteaseLikes = (listId: string, musicInfos: LX.Music.MusicInfo[]) => {
  if (listId !== LIST_IDS.LOVE) return
  const songs = [...musicInfos]
  // Let the caller show local success before any remote-sync warning.
  setTimeout(() => { void syncNeteaseLikes(listId, songs) }, 0)
}
