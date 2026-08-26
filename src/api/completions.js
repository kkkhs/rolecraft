import {
  bashScript,
  fishScript,
  zshScript,
} from '../commands/completions.js'

export function completionApi(shell) {
  switch (shell) {
    case 'bash':
      return bashScript()
    case 'zsh':
      return zshScript()
    case 'fish':
      return fishScript()
    default:
      throw new Error(`Unknown shell: ${shell}`)
  }
}
