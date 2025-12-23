/**
 * 键盘监听 Hook - 解决 iOS 键盘弹起时 fixed 元素失效问题
 * 通过监听 visualViewport 变化，动态调整容器高度
 */
import { useEffect, useCallback } from 'react';

// 检测是否为 iOS 设备
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export function useKeyboardFix(containerId: string = 'app-container') {
  const handleViewportResize = useCallback(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    // 判断键盘是否打开：visualViewport 高度明显小于 window.innerHeight
    const keyboardOpen = window.innerHeight - visualViewport.height > 150;

    if (keyboardOpen) {
      // 键盘打开：设置容器高度为可视区高度
      container.style.height = `${visualViewport.height}px`;
      container.style.overflow = 'auto';
      // 确保滚动到顶部，避免内容被键盘遮挡后的错位
      window.scrollTo(0, 0);
    } else {
      // 键盘关闭：恢复正常高度
      container.style.height = '100vh';
      container.style.height = '100dvh'; // 使用 dvh 单位更适合移动端
      container.style.overflow = '';
    }
  }, [containerId]);

  useEffect(() => {
    // 只在 iOS 设备上启用此修复
    if (!isIOS()) return;

    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    // 监听 visualViewport 的 resize 事件
    visualViewport.addEventListener('resize', handleViewportResize);
    visualViewport.addEventListener('scroll', handleViewportResize);

    // 初始化时执行一次
    handleViewportResize();

    return () => {
      visualViewport.removeEventListener('resize', handleViewportResize);
      visualViewport.removeEventListener('scroll', handleViewportResize);

      // 清理：恢复容器高度
      const container = document.getElementById(containerId);
      if (container) {
        container.style.height = '';
        container.style.overflow = '';
      }
    };
  }, [containerId, handleViewportResize]);
}
