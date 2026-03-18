/// <reference types="vite/client" />

declare global {
  interface Window {
    sqlPro: any;
    electronAPI: any;
  }
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}
