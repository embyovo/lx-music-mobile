import { connectServer } from '@/plugins/sync'
import { updateSetting } from '@/core/common'
import { getSyncHost } from '@/plugins/sync/data'
import { finishServerSourceCheck } from '@/core/sourceSync'


export default async(setting: LX.AppSetting) => {
  if (!setting['sync.enable']) {
    finishServerSourceCheck()
    return
  }

  const host = await getSyncHost()
  // console.log(host)
  if (!host) {
    finishServerSourceCheck()
    updateSetting({ 'sync.enable': false })
    return
  }
  void connectServer(host).catch(finishServerSourceCheck)
}
