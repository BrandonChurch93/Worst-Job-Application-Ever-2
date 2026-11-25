/// <reference types="vite/client" />

declare module 'virtual:build-info' {
  const info: {
    engineHash: string
    pageHashes: Record<string, string>
    assets: { web: Record<string, { file: string; bytes: number }[]>; full: Record<string, { file: string; bytes: number }[]> }
    approved: string[] | null
    versions: Record<string, string>
    modules: Record<string, string[]>
  }
  export default info
}
