import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

// 生成唯一设备ID
const generateDeviceId = (): string => {
  const existingId = localStorage.getItem('device_id');
  if (existingId) return existingId;

  const newId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('device_id', newId);
  return newId;
};

// 生成随机昵称
const generateNickname = (): string => {
  const adjectives = ['快乐的', '可爱的', '温柔的', '活泼的', '聪明的', '勇敢的', '善良的', '阳光的'];
  const nouns = ['猫咪控', '铲屎官', '喵星人', '猫奴', '撸猫人', '爱猫人', '吸猫达人', '猫咪爱好者'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
};

// 生成随机头像
const generateAvatar = (nickname: string): string => {
  const colors = ['f97316', 'ec4899', '8b5cf6', '06b6d4', '10b981', '3b82f6', 'ef4444', 'f59e0b'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=${color}&color=fff&rounded=true&bold=true&size=128`;
};

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  isGuest: boolean;      // 是否为游客模式（没有手机号或邮箱）
  isLoading: boolean;
  login: (userData?: Partial<User>) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  autoLogin: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'cat_adoption_user';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时尝试从 localStorage 恢复用户
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('解析用户数据失败:', e);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // 自动登录（游客模式）
  const autoLogin = () => {
    const deviceId = generateDeviceId();
    const nickname = generateNickname();
    const avatarUrl = generateAvatar(nickname);

    const newUser: User = {
      id: deviceId,  // 使用 deviceId 作为用户 ID
      deviceId,
      nickname,
      avatarUrl,
      status: 'active',
      role: 'user',
      favoriteCount: 0,
      commentCount: 0,
      adoptionCount: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

    // TODO: 可以在这里调用后端 API 同步用户数据
  };

  // 登录
  const login = (userData?: Partial<User>) => {
    if (userData) {
      const newUser: User = {
        id: userData.id || generateDeviceId(),
        nickname: userData.nickname || generateNickname(),
        avatarUrl: userData.avatarUrl || generateAvatar(userData.nickname || '用户'),
        status: 'active',
        role: userData.role || 'user',
        favoriteCount: userData.favoriteCount || 0,
        commentCount: userData.commentCount || 0,
        adoptionCount: userData.adoptionCount || 0,
        createdAt: userData.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        ...userData,
      };
      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    } else {
      autoLogin();
    }
  };

  // 登出
  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  // 更新用户信息
  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  };

  // 判断是否为游客（没有手机号和邮箱的用户）
  const isGuest = !!user && !user.phone && !user.email;

  return (
    <UserContext.Provider value={{
      user,
      isLoggedIn: !!user,
      isGuest,
      isLoading,
      login,
      logout,
      updateUser,
      autoLogin,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser 必须在 UserProvider 内部使用');
  }
  return context;
};
