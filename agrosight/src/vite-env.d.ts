/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_GOV_API_KEY?: string
  /** Ollama model tag, e.g. llama3.2:3b */
  readonly VITE_OLLAMA_MODEL?: string
  /** Optional full chat URL; default uses Vite proxy /ollama/api/chat */
  readonly VITE_OLLAMA_URL?: string
  readonly VITE_SUPABASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'split-type' {
  export default class SplitType {
    constructor(element: HTMLElement | string, options?: { types?: string })
    words: HTMLElement[] | null
    revert(): void
  }
}
