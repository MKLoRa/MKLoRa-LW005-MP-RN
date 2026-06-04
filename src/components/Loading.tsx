/**
 * 兼容旧调用；全局 HUD 已改为各页面内 ScreenLoadingOverlay，避免 Modal 残留挡触摸。
 */
const Loading = {
  show: (_message: string = '') => {},
  hidden: () => {},
};

export function LoadingProvider({children}: {children: React.ReactNode}) {
  return children;
}

export default Loading;
