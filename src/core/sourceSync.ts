import BackgroundTimer from 'react-native-background-timer'

let serverCheck = Promise.resolve()
let finishCheck: (() => void) | undefined
let timeout: number | undefined

export const finishServerSourceCheck = () => {
  if (timeout != null) BackgroundTimer.clearTimeout(timeout)
  timeout = undefined
  finishCheck?.()
  finishCheck = undefined
}

export const beginServerSourceCheck = () => {
  finishServerSourceCheck()
  serverCheck = new Promise<void>(resolve => { finishCheck = resolve })
  // Fall back to the saved source when the sync service cannot be reached.
  timeout = BackgroundTimer.setTimeout(finishServerSourceCheck, 10_000)
}

export const holdServerSourceCheck = () => {
  if (timeout != null) BackgroundTimer.clearTimeout(timeout)
  timeout = undefined
}

export const waitForServerSourceCheck = async() => serverCheck
