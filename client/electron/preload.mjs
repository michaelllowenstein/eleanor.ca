import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('eleanor', {
  platform: process.platform,
  isDesktop: true,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
