import type { FlowContext, FlowData } from '../flowContext'
import { pickTextInput } from '../helpers/pickTextInput'

const PROMPT = 'Enter note (or /skip to clear):'

export async function pickNotes(
  flow: FlowContext,
  _data: FlowData
): Promise<void> {
  await pickTextInput(flow, PROMPT, 'notes')
}
