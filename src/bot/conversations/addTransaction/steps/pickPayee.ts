import type { FlowContext, FlowData } from '../flowContext'
import { pickTextInput } from '../helpers/pickTextInput'

const PROMPT = 'Enter payee (or /skip to clear):'

export async function pickPayee(
  flow: FlowContext,
  _data: FlowData
): Promise<void> {
  await pickTextInput(flow, PROMPT, 'payee')
}
