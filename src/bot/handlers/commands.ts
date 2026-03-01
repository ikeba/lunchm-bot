import type { Api } from 'grammy'

export async function setupCommands(api: Api): Promise<void> {
  await api.setMyCommands([{ command: 'menu', description: 'Open menu' }])

  await api.setChatMenuButton({
    menu_button: { type: 'commands' },
  })
}
