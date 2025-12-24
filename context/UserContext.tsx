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

const CUTE_NICKNAMES = [
  "正在晒太阳", "偷吃小鱼干", "追蝴蝶的猫", "趴在键盘上", "躲进纸箱里",
  "呼噜呼噜怪", "踩奶小能手", "贪睡的橘猫", "发呆的毛球", "摇尾巴的喵",
  "想要猫罐头", "软糯小肉垫", "傲娇喵星人", "粘人的小妖精", "暴躁小可爱",
  "优雅的猫步", "慵懒的午后", "好奇的猫猫", "粉嫩小鼻头", "圆滚滚的肚",
  "机灵小黑猫", "憨憨蓝胖子", "甜美布偶猫", "短腿小曼基", "凶萌小脑斧",
  "流浪旅行家", "等风来的喵", "遇见一只猫", "温暖铲屎官", "爱猫的少年",
  "吸猫重症患", "撸猫专业户", "猫咪守护者", "云养猫达人", "口袋里的猫",
  "想变成猫咪", "喵喵幼儿园", "猫尾巴草", "胡须长长", "耳朵尖尖",
  "爪爪肉嘟嘟", "背影圆滚滚", "睡不醒的猫", "森林里的猫", "屋顶的猫咪",
  "窗边的守候", "月光下的猫", "星空喵行者", "吃饱就困困", "梦里有小鱼"
];

// 生成随机昵称
const generateNickname = (): string => {
  return CUTE_NICKNAMES[Math.floor(Math.random() * CUTE_NICKNAMES.length)];
};

// 生成随机头像 - 使用 RoboHash 猫咪版生成唯一头像
const generateAvatar = (nickname: string): string => {
  // set=set4 是 RoboHash 的猫咪风格
  // 同一个昵称永远对应同一只猫咪头像
  return `https://robohash.org/${encodeURIComponent(nickname)}?set=set4&size=128x128`;
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

  // 自动登录（游客模式）- 使用AI生成可爱昵称
  const autoLogin = async () => {
    const deviceId = generateDeviceId();

    // 先使用静态昵称快速登录
    let nickname = generateNickname();
    const avatarUrl = generateAvatar(nickname);

    const newUser: User = {
      id: deviceId,
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

    // 异步尝试获取 AI 生成的昵称
    try {
      const response = await fetch('/api/ai?type=nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.nickname && data.nickname.length >= 4 && data.nickname.length <= 6) {
          const aiNickname = data.nickname;
          const aiAvatarUrl = generateAvatar(aiNickname);
          const updatedUser = { ...newUser, nickname: aiNickname, avatarUrl: aiAvatarUrl };
          setUser(updatedUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        }
      }
    } catch (e) {
      // AI 失败时使用已设置的静态昵称
      console.log('AI 昵称生成失败，使用静态昵称');
    }
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
