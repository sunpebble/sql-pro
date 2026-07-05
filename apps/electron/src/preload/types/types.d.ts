import type { ElectronAPI } from '@electron-toolkit/preload';
import type { QuarryAPI } from '../index';

declare global {
  interface Window {
    electron: ElectronAPI;
    quarry: QuarryAPI;
  }
}
