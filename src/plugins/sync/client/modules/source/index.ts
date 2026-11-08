import BackgroundTimer from 'react-native-background-timer'
import { importUserApi } from '@/core/userApi'
import { setApiSource } from '@/core/apiSource'
import { finishServerSourceCheck, holdServerSourceCheck } from '@/core/sourceSync'
import { getUserApiScript, getUserApiScriptInfo } from '@/utils/data'
import { state as userApiState } from '@/store/userApi'
import settingState from '@/store/setting/state'
import { toMD5 } from '@/utils/tools'
import { aesDecrypt } from '../../../utils'
import log from '../../../log'

const MAX_SCRIPT_LENGTH = 9_000_000
let updateQueue = Promise.resolve()

// The server may push before marking the connection ready. Request again after
// finished has returned, using the existing feature-change protocol.
export const requestSourceAfterSync = (socket: LX.Sync.Socket) => {
  if (!socket.sourceSyncEnabled) {
    finishServerSourceCheck()
    return
  }
  const timer = BackgroundTimer.setTimeout(() => {
    unsubscribe()
    if (socket.readyState != 1 || socket.moduleReadys.source) {
      finishServerSourceCheck()
      return
    }
    void socket.remote.onFeatureChanged({ source: {} }).catch(() => {
      log.r_warn('[source:sync] Failed to request server source')
    }).finally(finishServerSourceCheck)
  }, 500)
  const unsubscribe = socket.onClose(() => {
    BackgroundTimer.clearTimeout(timer)
  })
}

const resolveSourceUrl = (url: string, server: string) => {
  if (url.startsWith('/') && !url.startsWith('//')) {
    const origin = /^https?:\/\/[^/?#]+/i.exec(server)?.[0]
    if (!origin) throw new Error('Invalid sync server address')
    url = origin + url
  }
  if (!/^https?:\/\/[^\s/?#]+(?:[/?#]|$)/i.test(url) || /\s/.test(url)) {
    throw new Error('Invalid source download address')
  }
  return url
}

const updateSource = async(socket: LX.Sync.Socket, data: LX.Sync.Source.SourceUpdateData) => {
  if (!socket.sourceSyncEnabled || socket.readyState != 1) return
  if (!data || typeof data.url != 'string' || !data.url ||
      typeof data.md5 != 'string' || !/^[a-f\d]{32}$/i.test(data.md5) ||
      typeof data.encrypted != 'boolean' || !Number.isFinite(data.updateTime)) {
    throw new Error('Invalid server source information')
  }

  const server = socket.data.urlInfo.href.replace(/\/+$/, '')
  const defaultId = `user_api_server_${toMD5(server)}`
  const md5 = data.md5.toLowerCase()
  const previous = userApiState.list.find(api => api.syncSource?.server == server || api.id == defaultId)
  if (previous?.syncSource?.md5 == md5 && toMD5(await getUserApiScript(previous.id)) == md5) {
    socket.moduleReadys.source = true
    return
  }

  const url = resolveSourceUrl(data.encrypted ? aesDecrypt(data.url, socket.data.keyInfo.key) : data.url, server)
  const controller = new AbortController()
  const unsubscribe = socket.onClose(() => { controller.abort() })
  const timeout = BackgroundTimer.setTimeout(() => { controller.abort() }, 30_000)
  let script: string
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } })
    if (response.status != 200) throw new Error(`Source download failed (${response.status})`)
    const length = Number(response.headers.get('Content-Length'))
    if (length > MAX_SCRIPT_LENGTH) throw new Error('Source script is too large')
    script = await response.text()
    if (!script || script.length > MAX_SCRIPT_LENGTH) throw new Error('Invalid source script size')
    if (toMD5(script) != md5) throw new Error('Source script MD5 mismatch')
  } finally {
    BackgroundTimer.clearTimeout(timeout)
    unsubscribe()
  }
  if (socket.readyState != 1) return

  const scriptInfo = getUserApiScriptInfo(script)
  const normalizeName = (name: string) => name.trim().toLowerCase()
  const matching = userApiState.list.filter(api => normalizeName(api.name) == normalizeName(scriptInfo.name))
  const activeId = settingState.setting['common.apiSource']
  const target = matching.find(api => api.id == activeId) ?? matching[0] ?? previous
  const id = target?.id ?? defaultId
  const api = await importUserApi(script, { id, syncSource: { server, md5, updateTime: data.updateTime } })
  socket.moduleReadys.source = true
  const selectedId = settingState.setting['common.apiSource']
  if (!selectedId || selectedId == id) {
    // Queue the new script load before releasing any pending local startup load.
    setApiSource(api.id)
  }
  log.info('[source:sync] Source updated:', api.name, md5)
}

export const handler: LX.Sync.ClientSyncHandlerSourceActions<LX.Sync.Socket> = {
  async onSourceSyncAction(socket, action) {
    if (action?.action != 'source_update') return
    holdServerSourceCheck()
    const task = updateQueue.then(async() => { await updateSource(socket, action.data) })
    updateQueue = task.catch(() => {})
    try {
      await task
    } catch (error) {
      // Avoid logging signed URLs or decryption inputs.
      log.r_warn('[source:sync] Source update failed:', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      finishServerSourceCheck()
    }
  },
}
