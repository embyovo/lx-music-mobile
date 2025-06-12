import {forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { clearListDetail, getListDetail, setListDetail, setListDetailInfo, setDailyListDetail} from '@/core/songlist'
import songlistState from '@/store/songlist/state'
import { handlePlay } from './listAction'
import Header, { type HeaderType } from './Header'
import { useListInfo } from './state'
import React, { createContext, useContext } from 'react';
import MyContext from "@/store/TopContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
export interface MusicListProps {
  componentId: string
}

export interface MusicListType {
  loadList: (source: LX.OnlineSource, listId: string) => void
}


export default forwardRef<MusicListType, MusicListProps>(({ componentId }, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const headerRef = useRef<HeaderType>(null)
  const isUnmountedRef = useRef(false)
  const info = useListInfo()
  const [store, setStore] = useState({
    qrcode:'',
    cookie:'',
    isMe:false,
    showQR:false
  })


  /**
   * 判断MUSIC_U Cookie是否已过期
   *
   * @param cookieString - 完整的Cookie字符串
   * @returns 如果Cookie已过期或无法找到，返回true；否则返回false
   */
  function isMusicUCookieExpired(cookieString: string): boolean {
    if (cookieString == null)
      return true
    const musicURegex = /MUSIC_U=[^;]+;([^;]*)(Expires=([^;]+)|Max-Age=(\d+))/i;
    const match = cookieString.match(musicURegex);

    if (!match) {
      return true;
    }

    if (match[3]) {
      const expiresDate = new Date(match[3]);
      const now = new Date();
      return expiresDate < now;
    }

    if (match[4]) {
      const maxAgeSeconds = parseInt(match[4], 10);
      const creationTime = new Date();
      const expirationTime = new Date(creationTime.getTime() + maxAgeSeconds * 1000);


      return expirationTime < new Date();
    }

    return true;
  }
  function formatMilliseconds(ms: number): string {
    const date = new Date(0)
    date.setMilliseconds(ms)
    // 获取分钟和秒（忽略时区影响）
    const minutes = date.getUTCMinutes()
    const seconds = date.getUTCSeconds()
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  let inMY=false
  async function fetchMusic(cookie: string) {

    try {
      const queryString = {'cookie':cookie}
      const res = await fetch(`http://192.168.123.88:3000/recommend/songs?${new URLSearchParams(queryString)}`, {
        method: 'GET',
      })
      const data1 = await res.json() // 等待 JSON 解析完成
      const data = data1.data.dailySongs

      let list: any[] = []
      // console.log(data)
      data.forEach((item: any) => {
        list.push({
          id: 'wy_' + item.id,
          interval: formatMilliseconds(item.dt),
          name: item.name,
          singer: (item.ar ?? []).map((a: any): string => a.name ?? '').join(' ').trim(),
          source: 'wy',
          meta: {
            songId: item.id,
            albumName: item.al.name,
            picUrl: item.al.picUrl,
            qualitys: [{
              type: '128k',
              size: (item.l?.size ?? 1024 * 1024) / 1024 / 1024 + 'MB',
            }, {
              type: '320k',
              size: (item.h?.size ?? 1024 * 1024) / 1024 / 1024 + 'MB',
            }, {
              type: 'flac',
              size: (item.sq?.size ?? 1024 * 1024) / 1024 / 1024 + 'MB',
            }],
            _qualitys: [{
              '128k': (item.l?.size ?? 1024 * 1024) / 1024 / 1024 + 'MB',
            }, {
              '320k': (item.h?.size ?? 1024 * 1024) / 1024 / 1024 + 'MB',
            }, {
              flac: (item.sq?.size ?? 1024 * 1024) / 1024 / 1024 + 'MB',
            }],
            albumId: item.al.id,
          },
        })
      })

      const result={
        list,
        page:1,
        limit:30,
        total:30,
        source:'wy',
        info: {
          name: '亓的每日推荐',
          img: 'https://p2.music.126.net/6sAXHDiGgyAPbEMTIemVlw==/109951168110863128.jpg',
          desc: '亓的每日推荐',
          author: '亓',
        },
      }
      // console.log(result)
      return result
    } catch (err) {
      console.error('获取音乐失败:', err)
    }
  }
  useImperativeHandle(ref, () => ({
    async loadList(source, id) {
      clearListDetail()
      const listDetailInfo = songlistState.listDetailInfo
      listRef.current?.setList([])

      if (source=='wy'&&id=='-1'){
        // @ts-ignore

        store.cookie = await AsyncStorage.getItem('cookie')
        setListDetailInfo('wy', '-1')
        headerRef.current?.setInfo({
          name: '亓的每日推荐',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          desc: '亓的每日推荐',
          playCount: '',
          imgUrl: 'https://p2.music.126.net/6sAXHDiGgyAPbEMTIemVlw==/109951168110863128.jpg',
        })
        if (isMusicUCookieExpired(store.cookie)) {
          const res = (await fetch('http://192.168.123.88:3000/login/qr/key'))
          const temp = await res.json()
          const key= temp.data.unikey
          const res1 = await fetch(`http://192.168.123.88:3000/login/qr/create?key=${key}&qrimg=true`)
          const temp2 = await res1.json()
          setStore(prevState => ({...prevState,qrcode: temp2.data.qrimg,showQR: true}));
          let intervalCheck = setInterval(async () => {
            const res3 = await fetch(`http://192.168.123.88:3000/login/qr/check?key=${key}&&timestamp=${(Date.now()).toString()}`)
            const temp3 = await res3.json()
            setTimeout(()=>{
              clearInterval(intervalCheck)
            },45000)
            if(temp3.code == 803) {
              setStore(prev => ({ ...prev, cookie: decodeURIComponent(temp3.cookie)  }));
              await AsyncStorage.setItem('cookie', decodeURIComponent(temp3.cookie))
              const result = await fetchMusic(temp3.cookie)
              setDailyListDetail(result, '-1', 1)
              clearInterval(intervalCheck)
            }
          },3000)
        }
          const result = await fetchMusic(store.cookie)
         setDailyListDetail(result, '-1', 1)
        if (isUnmountedRef.current) return
        requestAnimationFrame(() => {
          headerRef.current?.setInfo({
            name: '亓的每日推荐',
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            desc: '亓的每日推荐',
            playCount: '',
            imgUrl: 'https://p2.music.126.net/6sAXHDiGgyAPbEMTIemVlw==/109951168110863128.jpg',
          })
          // @ts-ignore
          listRef.current?.setList(result.list)
          listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= 1 ? 'end' : 'idle')
        })

      }
      else{
        if (listDetailInfo.id == id && listDetailInfo.source == source && listDetailInfo.list.length) {
          requestAnimationFrame(() => {
            listRef.current?.setList(listDetailInfo.list)
            headerRef.current?.setInfo({
              name: (info.name || listDetailInfo.info.name) ?? '',
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              desc: listDetailInfo.info.desc || info.desc || '',
              playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
              imgUrl: info.img ?? listDetailInfo.info.img,
            })
          })
        } else {
          listRef.current?.setStatus('loading')
          const page = 1
          setListDetailInfo(info.source, info.id)
          headerRef.current?.setInfo({
            name: (info.name || listDetailInfo.info.name) ?? '',
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            desc: listDetailInfo.info.desc || info.desc || '',
            playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
            imgUrl: info.img ?? listDetailInfo.info.img,
          })
          return getListDetail(id, source, page).then((listDetail) => {
            const result = setListDetail(listDetail, id, page)
            if (isUnmountedRef.current) return
            requestAnimationFrame(() => {
              headerRef.current?.setInfo({
                name: (info.name || listDetailInfo.info.name) ?? '',
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                desc: listDetailInfo.info.desc || info.desc || '',
                playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
                imgUrl: info.img ?? listDetailInfo.info.img,
              })
              listRef.current?.setList(result.list)
              listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
            })
          }).catch(() => {
            if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
            listRef.current?.setStatus('error')
          })
        }
      }

    },
  }))

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])


  const handlePlayList: OnlineListProps['onPlayList'] = (index) => {
    const listDetailInfo = songlistState.listDetailInfo
    // console.log(songlistState.listDetailInfo)
    void handlePlay(listDetailInfo.id, listDetailInfo.source, listDetailInfo.list, index)
  }


  const handleRefresh: OnlineListProps['onRefresh'] = async () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
        getListDetail(songlistState.listDetailInfo.id, songlistState.listDetailInfo.source, page, true).then(async (listDetail) => {
          if (listDetail.list.length == 0) {
            const cookie = await AsyncStorage.getItem('cookie') as string
            const result = await fetchMusic(cookie)
            setDailyListDetail(result, '-1', 1)
            if (isUnmountedRef.current) return
            // @ts-ignore
            listRef.current?.setList(result.list)
            listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
          } else {
            const result = setListDetail(listDetail, songlistState.listDetailInfo.id, page)
            if (isUnmountedRef.current) return
            listRef.current?.setList(result.list)
            listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
          }
        }).catch(() => {
          if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
          listRef.current?.setStatus('error')
        })

    }


  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const page = songlistState.listDetailInfo.list.length ? songlistState.listDetailInfo.page + 1 : 1
    getListDetail(songlistState.listDetailInfo.id, songlistState.listDetailInfo.source, page).then((listDetail) => {
      const result = setListDetail(listDetail, songlistState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list, true)
      listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const header = useMemo(() => <Header ref={headerRef} componentId={componentId} />, [])


  return <MyContext.Provider value={store}>
    <OnlineList
      ref={listRef}
      onPlayList={handlePlayList}
      onRefresh={handleRefresh}
      onLoadMore={handleLoadMore}
      ListHeaderComponent={header}
      // progressViewOffset={}
    />
  </MyContext.Provider>

})

