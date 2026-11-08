import { LIST_IDS } from '@/config/constant'
import { addListMusics, removeListMusics } from '@/core/list'
import { playListById, playNext } from '@/core/player/player'
import { addTempPlayList } from '@/core/player/tempPlayList'
import settingState from '@/store/setting/state'
import { getListMusics } from '@/utils/listManage'
import { confirmDialog, openUrl, shareMusic, toast } from '@/utils/tools'
import { addDislikeInfo, hasDislike } from '@/core/dislikeList'
import playerState from '@/store/player/state'
import musicSdk from '@/utils/musicSdk'
import { toOldMusicInfo } from '@/utils'
import { clearMusicUrlByMusic } from '@/utils/data'
import { log } from '@/utils/log'

let playRequestId = 0
export const handlePlay = async(musicInfo: LX.Music.MusicInfoOnline, dailyRecommendations?: LX.Music.MusicInfoOnline[]) => {
  const requestId = ++playRequestId
  try {
    // Only the daily-recommendation page may supply a batch. Other online lists
    // always queue the clicked song, regardless of the last opened playlist.
    const recommendations = dailyRecommendations?.some(song => song.id == musicInfo.id) ? dailyRecommendations : undefined
    const songs = recommendations ? [...recommendations] : [musicInfo]
    if (recommendations) {
      const list = await getListMusics(LIST_IDS.DEFAULT)
      if (requestId != playRequestId) return
      const selectedIds = new Set(songs.map(song => song.id))
      const deleteIds = list.filter((song, index) => selectedIds.has(song.id) || index >= 520).map(song => song.id)
      if (deleteIds.length) await removeListMusics(LIST_IDS.DEFAULT, deleteIds)
    }
    if (requestId != playRequestId) return
    await addListMusics(LIST_IDS.DEFAULT, songs, settingState.setting['list.addMusicLocationType'])
    if (requestId != playRequestId) return
    await playListById(LIST_IDS.DEFAULT, musicInfo.id)
  } catch (error) {
    log.error('[online-list:play] Failed to start playback:', error)
    if (requestId == playRequestId) toast(global.i18n.t('player__start_failed'), 'long')
  }
}
export const handlePlayLater = (musicInfo: LX.Music.MusicInfoOnline, selectedList: LX.Music.MusicInfoOnline[], onCancelSelect: () => void) => {
  if (selectedList.length) {
    addTempPlayList(selectedList.map(s => ({ listId: '', musicInfo: s })))
    onCancelSelect()
  } else {
    addTempPlayList([{ listId: '', musicInfo }])
  }
}


export const handleShare = (musicInfo: LX.Music.MusicInfoOnline) => {
  shareMusic(settingState.setting['common.shareType'], settingState.setting['download.fileName'], musicInfo)
}

export const handleShowMusicSourceDetail = async(minfo: LX.Music.MusicInfoOnline) => {
  const url = musicSdk[minfo.source as LX.OnlineSource]?.getMusicDetailPageUrl(toOldMusicInfo(minfo))
  if (!url) return
  void openUrl(url)
}

export const clearMusicUrl = async(musicInfo: LX.Music.MusicInfoOnline) => {
  try {
    await clearMusicUrlByMusic(musicInfo)
  } catch (error) {
    toast(global.i18n.t('list_remove_cache_fail_tip', { msg: (error as Error).message }))
    return
  }
  toast(global.i18n.t('list_remove_cache_success_tip'))
}

export const handleDislikeMusic = async(musicInfo: LX.Music.MusicInfoOnline) => {
  const confirm = await confirmDialog({
    message: musicInfo.singer ? global.i18n.t('lists_dislike_music_singer_tip', { name: musicInfo.name, singer: musicInfo.singer }) : global.i18n.t('lists_dislike_music_tip', { name: musicInfo.name }),
    cancelButtonText: global.i18n.t('cancel_button_text_2'),
    confirmButtonText: global.i18n.t('confirm_button_text'),
    bgClose: false,
  })
  if (!confirm) return
  await addDislikeInfo([{ name: musicInfo.name, singer: musicInfo.singer }])
  toast(global.i18n.t('lists_dislike_music_add_tip'))
  if (hasDislike(playerState.playMusicInfo.musicInfo)) {
    void playNext(true)
  }
}

