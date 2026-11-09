import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import CheckBoxItem from '../../components/CheckBoxItem'
import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import Text from '@/components/common/Text'
import { createStyle, toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { getSyncHost } from '@/utils/data'
import {
  clearNeteaseSyncQueue,
  flushNeteaseSyncQueue,
  getNeteaseSyncSnapshot,
  type NeteaseSyncSnapshot,
} from '@/core/neteaseSync'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const enabled = useSettingValue('neteaseSync.enable')
  const [snapshot, setSnapshot] = useState<NeteaseSyncSnapshot | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [qrcode, setQrcode] = useState('')
  const [loginTip, setLoginTip] = useState('')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isUnmountedRef = useRef(false)

  const stopPolling = useCallback(() => {
    if (pollingRef.current == null) return
    clearInterval(pollingRef.current)
    pollingRef.current = null
  }, [])

  const refresh = useCallback(async() => {
    const data = await getNeteaseSyncSnapshot()
    if (isUnmountedRef.current) return
    setSnapshot(data)
  }, [])

  useEffect(() => {
    isUnmountedRef.current = false
    void refresh()
    return () => {
      isUnmountedRef.current = true
      stopPolling()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void refresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  const handleSetEnable = useCallback((enable: boolean) => {
    updateSetting({ 'neteaseSync.enable': enable })
    if (enable) void flushNeteaseSyncQueue(true).then(refresh)
    else void refresh()
  }, [refresh])

  const handleSyncNow = useCallback(async() => {
    setSyncing(true)
    const result = await flushNeteaseSyncQueue(true)
    setSyncing(false)
    await refresh()
    if (result.sent) toast(t('setting_netease_toast_synced', { count: result.sent }))
    else toast(result.error ?? t('setting_netease_toast_no_pending'))
  }, [refresh, t])

  const handleClearQueue = useCallback(async() => {
    await clearNeteaseSyncQueue()
    await refresh()
    toast(t('setting_netease_toast_cleared'))
  }, [refresh, t])

  const checkLogin = useCallback(async(host: string, key: string) => {
    const res = await fetch(`${host}/api/netease/login/qr/check?key=${encodeURIComponent(key)}&timestamp=${Date.now()}`)
    const data = await res.json()
    if (data?.code === 803) {
      const cookie = data?.cookie
      if (typeof cookie !== 'string') return
      await AsyncStorage.setItem('cookie', decodeURIComponent(cookie))
      stopPolling()
      if (isUnmountedRef.current) return
      setQrcode('')
      setLoginTip('')
      toast(t('setting_netease_login_success'))
      void refresh()
    } else if (data?.code === 800) {
      stopPolling()
      if (isUnmountedRef.current) return
      setQrcode('')
      setLoginTip(t('setting_netease_login_expired'))
    }
  }, [refresh, stopPolling, t])

  const handleLogin = useCallback(async() => {
    const configuredHost = snapshot?.host ?? ''
    const host = configuredHost || (await getSyncHost()).trim().replace(/\/+$/, '')
    if (!host) {
      toast(t('setting_netease_service_missing'), 'long')
      return
    }
    setLoginTip(t('setting_netease_login_waiting'))
    try {
      const keyRes = await fetch(`${host}/api/netease/login/qr/key`)
      const keyData = await keyRes.json()
      const key = keyData?.data?.unikey
      if (typeof key !== 'string' || !key) throw new Error('missing qr key')
      const qrRes = await fetch(`${host}/api/netease/login/qr/create?key=${encodeURIComponent(key)}&qrimg=true`)
      const qrData = await qrRes.json()
      const qrimg = qrData?.data?.qrimg
      if (typeof qrimg !== 'string' || !qrimg) throw new Error('missing qr image')
      if (isUnmountedRef.current) return
      setQrcode(qrimg)
      stopPolling()
      pollingRef.current = setInterval(() => {
        checkLogin(host, key).catch(err => { console.warn('[neteaseSync] login check failed', err) })
      }, 3000)
    } catch (err) {
      console.warn('[neteaseSync] login qr failed', err)
      if (isUnmountedRef.current) return
      setLoginTip('')
      toast(t('setting_netease_login_failed'), 'long')
    }
  }, [checkLogin, snapshot, stopPolling, t])

  const lastSyncText = (() => {
    if (!snapshot?.status.lastSuccessAt && !snapshot?.status.lastErrorAt) return t('setting_netease_last_none')
    if (snapshot.status.lastSuccessAt >= snapshot.status.lastErrorAt) {
      return t('setting_netease_last_success', { song: snapshot.status.lastSuccessSong })
    }
    return t('setting_netease_last_fail', { error: snapshot.status.lastError })
  })()

  const accountText = snapshot?.loggedIn
    ? t('setting_netease_logged_in')
    : t('setting_netease_not_logged_in')

  return (
    <View style={styles.container}>
      <SubTitle title={t('setting_netease_title')}>
        <CheckBoxItem check={enabled} label={t('setting_netease_enable')} onChange={handleSetEnable} />
        <Text style={styles.text} size={13}>{t('setting_netease_desc')}</Text>
        <Text style={styles.text} size={13}>{t('setting_netease_account', { status: accountText })}</Text>
        {!snapshot?.loggedIn
          ? <Text style={styles.text} size={13}>{t('setting_netease_login_tip')}</Text>
          : null}
        <Text style={styles.text} size={13}>
          {snapshot?.host
            ? t('setting_netease_service', { host: snapshot.host })
            : t('setting_netease_service_missing')}
        </Text>
        <Text style={styles.text} size={13}>
          {t('setting_netease_pending', { pending: snapshot?.pending ?? 0, matched: snapshot?.matched ?? 0 })}
        </Text>
        <Text style={styles.text} size={13}>{t('setting_netease_last', { result: lastSyncText })}</Text>
        {snapshot?.status.lastMatchFailedAt && snapshot.status.lastMatchFailedAt > snapshot.status.lastSuccessAt
          ? <Text style={styles.text} size={13}>
            {t('setting_netease_match_failed', { song: snapshot.status.lastMatchFailedSong })}
          </Text>
          : null}
        <View style={styles.btnRow}>
          <Button onPress={handleLogin}>
            {snapshot?.loggedIn ? t('setting_netease_relogin') : t('setting_netease_login')}
          </Button>
          <Button onPress={() => { void handleSyncNow() }} disabled={syncing}>
            {t('setting_netease_sync_now')}
          </Button>
          {(snapshot?.pending ?? 0) > 0
            ? <Button onPress={() => { void handleClearQueue() }}>{t('setting_netease_clear_queue')}</Button>
            : null}
        </View>
        {qrcode
          ? <View style={styles.qrContent}>
            <Image source={{ uri: qrcode }} style={styles.qrImage} resizeMode="contain" />
            <Text style={styles.qrTip} size={12} color={theme['c-font-label']}>{loginTip}</Text>
          </View>
          : loginTip
            ? <Text style={styles.qrTip} size={12} color={theme['c-font-label']}>{loginTip}</Text>
            : null}
        <TouchableOpacity onPress={() => { void refresh() }}>
          <Text style={styles.refresh} size={12} color={theme['c-primary']}>{t('setting_netease_refresh')}</Text>
        </TouchableOpacity>
      </SubTitle>
    </View>
  )
})

const styles = createStyle({
  container: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
    paddingTop: 15,
  },
  text: {
    marginLeft: 25,
    marginTop: 3,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 25,
    marginTop: 10,
  },
  qrContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  qrImage: {
    width: 160,
    height: 160,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  qrTip: {
    marginTop: 6,
  },
  refresh: {
    marginLeft: 25,
    marginTop: 8,
  },
})
