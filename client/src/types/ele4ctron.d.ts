interface EleanorDesktopBridge {
  platform: 'win32' | 'darwin' | 'linux';
  isDesktop: true;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
}

interface Window {
  eleanor?: EleanorDesktopBridge;
}
