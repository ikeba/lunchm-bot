let activeMsgId: number | undefined

export function getActiveMsgId(): number | undefined {
  return activeMsgId
}

export function setActiveMsgId(id: number | undefined): void {
  activeMsgId = id
}
