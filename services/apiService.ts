import imageCompression from 'browser-image-compression';

/**
 * API 服务 - 前端调用服务端 API
 * 前端不再直接连接 Supabase，所有数据操作通过服务端 API 完成
 */

import { Cat, NewCatInput, CatStatus, AdoptionApplication, NewApplicationInput, ApplicationStatus, Comment, NewCommentInput, User } from '../types';

// API 基础路径（在 Vercel 部署时为空，本地开发时可能需要配置）
const API_BASE = process.env.NODE_ENV === 'development' ? '' : '';

/**
 * 通用请求封装
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/api${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `请求失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 猫咪相关 API
 */
export const catApi = {
  /**
   * 获取所有猫咪
   * @param forceRefresh 是否强制刷新（绕过 CDN 缓存）
   */
  getAll: async (forceRefresh = false): Promise<Cat[]> => {
    // 强制刷新时添加时间戳绕过 CDN 缓存
    const url = forceRefresh ? `/cats?t=${Date.now()}` : '/cats';
    const result = await request<{ data: Cat[] }>(url);
    return result.data;
  },

  /**
   * 获取单只猫咪
   */
  getById: async (id: string): Promise<Cat | undefined> => {
    try {
      const result = await request<{ data: Cat }>(`/cats/${id}`);
      return result.data;
    } catch (error) {
      console.error('获取猫咪详情失败:', error);
      return undefined;
    }
  },

  /**
   * 上传图片到服务端
   */
  uploadImage: async (file: File): Promise<string | null> => {
    try {
      // 压缩图片
      const compressedFile = await compressImage(file);

      // 将文件转换为 Base64
      const base64 = await fileToBase64(compressedFile);

      const result = await request<{ url: string }>('/upload', {
        method: 'POST',
        body: JSON.stringify({
          file: base64,
          fileName: compressedFile.name,
          contentType: compressedFile.type
        }),
      });
      return result.url;
    } catch (error) {
      console.error('上传图片失败:', error);
      return null;
    }
  },

  /**
   * 创建猫咪（支持图片上传）
   */
  create: async (cat: Omit<NewCatInput, 'imageFiles'> & { image_url?: string; imageFiles?: File[] | null }): Promise<Cat | null> => {
    try {
      let imageUrl = cat.image_url || '';

      // 如果有图片文件，先上传
      if (cat.imageFiles && cat.imageFiles.length > 0) {
        const uploadPromises = cat.imageFiles.map(file => catApi.uploadImage(file));
        const uploadedUrls = await Promise.all(uploadPromises);

        // 过滤掉上传失败的 null 值
        const validUrls = uploadedUrls.filter((url): url is string => url !== null);

        if (validUrls.length > 0) {
          imageUrl = validUrls.join(',');
        }
      }

      const result = await request<{ data: Cat }>('/cats', {
        method: 'POST',
        body: JSON.stringify({
          name: cat.name,
          age: cat.age,
          gender: cat.gender,
          breed: cat.breed,
          description: cat.description,
          tags: cat.tags,
          image_url: imageUrl,
          is_sterilized: cat.is_sterilized,
          is_dewormed: cat.is_dewormed,
          is_vaccinated: cat.is_vaccinated,
          is_stray: cat.is_stray
        }),
      });
      return result.data;
    } catch (error) {
      console.error('创建猫咪失败:', error);
      return null;
    }
  },

  /**
   * 更新猫咪状态
   */
  updateStatus: async (id: string, status: CatStatus): Promise<{ message?: string }> => {
    // PUT /api/cats/[id]
    const result = await request<{ data: Cat; message: string }>(`/cats/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return { message: result.message };
  },

  /**
   * 删除猫咪
   */
  delete: async (id: string): Promise<void> => {
    await request(`/cats/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * 将文件转换为 Base64 字符串
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * 领养申请相关 API
 */
export const adoptionApi = {
  /**
   * 提交领养申请
   */
  submitApplication: async (app: NewApplicationInput): Promise<AdoptionApplication> => {
    const result = await request<{ data: AdoptionApplication }>('/applications', {
      method: 'POST',
      body: JSON.stringify(app),
    });
    return result.data;
  },

  /**
   * 获取单个申请
   */
  getApplicationById: async (id: string): Promise<AdoptionApplication | null> => {
    try {
      const result = await request<{ data: AdoptionApplication }>(`/applications/${id}`);
      return result.data;
    } catch (error) {
      console.error('获取申请详情失败:', error);
      return null;
    }
  },

  /**
   * 获取所有申请（管理员用）
   */
  getAllApplications: async (): Promise<AdoptionApplication[]> => {
    const result = await request<{ data: AdoptionApplication[] }>('/applications');
    return result.data;
  },

  /**
   * 审核申请
   */
  reviewApplication: async (appId: string, status: ApplicationStatus, catId: string): Promise<void> => {
    // PUT /api/applications/[id]
    await request(`/applications/${appId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, catId }),
    });
  },
};

// 为了兼容性，导出与旧版相同的命名
export const catService = catApi;
export const adoptionService = adoptionApi;

/**
 * 压缩图片
 */
export async function compressImage(file: File): Promise<File> {
  // 如果不是图片，直接返回原文件
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB: 0.8, // 最大文件大小 0.8MB
    maxWidthOrHeight: 1280, // 最大宽高 1280px
    useWebWorker: true, // 使用 Web Worker 避免阻塞主线程
    fileType: 'image/jpeg' // 统一转换为 JPEG 格式以获得更好的压缩率
  };

  try {
    console.log(`压缩前: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    const compressedFile = await imageCompression(file, options);
    console.log(`压缩后: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

    // 确保返回的文件名有正确的扩展名
    const newFileName = file.name.replace(/\.[^/.]+$/, "") + '.jpg';
    return new File([compressedFile], newFileName, { type: 'image/jpeg' });
  } catch (error) {
    console.error('图片压缩失败:', error);
    return file; // 压缩失败则返回原文件
  }
}

/**
 * 评论相关 API
 */
export const commentApi = {
  /**
   * 获取猫咪的所有评论
   */
  getCommentsByCatId: async (catId: string): Promise<Comment[]> => {
    try {
      const result = await request<{ data: Comment[] }>(`/comments?catId=${catId}`);
      return result.data;
    } catch (error) {
      console.error('获取评论失败:', error);
      return [];
    }
  },

  /**
   * 提交评论
   */
  submitComment: async (comment: NewCommentInput): Promise<Comment | null> => {
    try {
      const result = await request<{ data: Comment }>('/comments', {
        method: 'POST',
        body: JSON.stringify(comment),
      });
      return result.data;
    } catch (error) {
      console.error('提交评论失败:', error);
      return null;
    }
  },

  /**
   * 点赞评论
   */
  likeComment: async (commentId: string): Promise<boolean> => {
    try {
      await request(`/comments/${commentId}/like`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('点赞失败:', error);
      return false;
    }
  },
};

// 导出评论服务
export const commentService = commentApi;

/**
 * 用户认证 API
 */
export const authApi = {
  /**
   * 用户注册
   */
  register: async (data: {
    phone?: string;
    email?: string;
    password: string;
    nickname: string;
  }): Promise<{ user: User | null; error: string | null }> => {
    try {
      const result = await request<{ data: User; message: string }>('/user?action=register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { user: result.data, error: null };
    } catch (error) {
      console.error('注册失败:', error);
      return { user: null, error: error instanceof Error ? error.message : '注册失败' };
    }
  },

  /**
   * 用户登录
   */
  login: async (data: {
    phone?: string;
    email?: string;
    password: string;
  }): Promise<{ user: User | null; error: string | null }> => {
    try {
      const result = await request<{ data: User; message: string }>('/user?action=login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { user: result.data, error: null };
    } catch (error) {
      console.error('登录失败:', error);
      return { user: null, error: error instanceof Error ? error.message : '登录失败' };
    }
  },
};

// 导出认证服务
export const authService = authApi;

/**
 * 用户数据 API
 */
export const userApi = {
  /**
   * 获取用户统计数据
   */
  getStats: async (userId: string): Promise<{
    favoriteCount: number;
    likeCount: number;
    commentCount: number;
    adoptionCount: number;
  }> => {
    try {
      const result = await request<{
        data: {
          favoriteCount: number;
          likeCount: number;
          commentCount: number;
          adoptionCount: number;
        }
      }>(`/user?action=stats&userId=${userId}`);
      return result.data;
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return {
        favoriteCount: 0,
        likeCount: 0,
        commentCount: 0,
        adoptionCount: 0,
      };
    }
  },

  /**
   * 获取用户评论
   */
  getUserComments: async (userId: string): Promise<Comment[]> => {
    try {
      const result = await request<{ data: Comment[] }>(`/user?action=comments&userId=${userId}`);
      return result.data;
    } catch (error) {
      console.error('获取用户评论失败:', error);
      return [];
    }
  },

  /**
   * 获取用户申请
   */
  getUserApplications: async (userId: string): Promise<AdoptionApplication[]> => {
    try {
      const result = await request<{ data: AdoptionApplication[] }>(`/user?action=applications&userId=${userId}`);
      return result.data;
    } catch (error) {
      console.error('获取用户申请失败:', error);
      return [];
    }
  },

  /**
   * 更新用户信息
   */
  updateProfile: async (userId: string, data: { nickname?: string; avatarUrl?: string }): Promise<User | null> => {
    try {
      const result = await request<{ data: User }>(`/user?action=update&userId=${userId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result.data;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return null;
    }
  },

  /**
   * 获取用户信息
   */
  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const result = await request<{ data: User }>(`/user?action=profile&userId=${userId}`);
      return result.data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },
};

// 导出用户服务
export const userService = userApi;

/**
 * 收藏相关 API
 */
export const favoriteApi = {
  /**
   * 获取用户收藏列表
   */
  getUserFavorites: async (userId: string): Promise<any[]> => {
    try {
      const result = await request<{ data: any[] }>(`/interactions?type=favorites&userId=${userId}`);
      return result.data;
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      return [];
    }
  },

  /**
   * 添加收藏
   */
  addFavorite: async (userId: string, catId: string): Promise<boolean> => {
    try {
      await request('/interactions?type=favorites', {
        method: 'POST',
        body: JSON.stringify({ userId, catId }),
      });
      return true;
    } catch (error) {
      console.error('添加收藏失败:', error);
      return false;
    }
  },

  /**
   * 删除收藏
   */
  removeFavorite: async (userId: string, catId: string): Promise<boolean> => {
    try {
      await request(`/interactions?type=favorites&userId=${userId}&catId=${catId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('删除收藏失败:', error);
      return false;
    }
  },

  /**
   * 检查是否已收藏
   */
  isFavorited: async (userId: string, catId: string): Promise<boolean> => {
    try {
      const favorites = await favoriteApi.getUserFavorites(userId);
      return favorites.some(fav => fav.catId === catId);
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      return false;
    }
  },
};

// 导出收藏服务
export const favoriteService = favoriteApi;

/**
 * 评论点赞相关 API
 */
export const commentLikeApi = {
  /**
   * 获取用户点赞列表
   */
  getUserLikes: async (userId: string): Promise<any[]> => {
    try {
      const result = await request<{ data: any[] }>(`/interactions?type=likes&userId=${userId}`);
      return result.data;
    } catch (error) {
      console.error('获取点赞列表失败:', error);
      return [];
    }
  },

  /**
   * 添加点赞
   */
  addLike: async (userId: string, commentId: string): Promise<boolean> => {
    try {
      await request('/interactions?type=likes', {
        method: 'POST',
        body: JSON.stringify({ userId, commentId }),
      });
      return true;
    } catch (error) {
      console.error('添加点赞失败:', error);
      return false;
    }
  },

  /**
   * 删除点赞
   */
  removeLike: async (userId: string, commentId: string): Promise<boolean> => {
    try {
      await request(`/interactions?type=likes&userId=${userId}&commentId=${commentId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('删除点赞失败:', error);
      return false;
    }
  },

  /**
   * 检查是否已点赞
   */
  isLiked: async (userId: string, commentId: string): Promise<boolean> => {
    try {
      const likes = await commentLikeApi.getUserLikes(userId);
      return likes.some(like => like.commentId === commentId);
    } catch (error) {
      console.error('检查点赞状态失败:', error);
      return false;
    }
  },
};

// 导出点赞服务
export const commentLikeService = commentLikeApi;

/**
 * 通知相关 API
 */
export const notificationApi = {
  /**
   * 获取通知列表
   */
  getNotifications: async (userId: string): Promise<any[]> => {
    try {
      const result = await request<{ data: any[] }>(`/user?action=notifications&userId=${userId}`);
      return result.data;
    } catch (error) {
      console.error('获取通知列表失败:', error);
      return [];
    }
  },

  /**
   * 获取未读通知数量
   */
  getUnreadCount: async (userId: string): Promise<number> => {
    try {
      const result = await request<{ data: { count: number } }>(`/user?action=unread_count&userId=${userId}`);
      return result.data.count;
    } catch (error) {
      console.error('获取未读数量失败:', error);
      return 0;
    }
  },

  /**
   * 标记单条已读
   */
  markRead: async (userId: string, notificationId: string): Promise<boolean> => {
    try {
      await request('/user?action=mark_read', {
        method: 'POST',
        body: JSON.stringify({ userId, notificationId }),
      });
      return true;
    } catch (error) {
      console.error('标记已读失败:', error);
      return false;
    }
  },

  /**
   * 标记全部已读
   */
  markAllRead: async (userId: string): Promise<boolean> => {
    try {
      await request('/user?action=mark_all_read', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      return true;
    } catch (error) {
      console.error('标记全部已读失败:', error);
      return false;
    }
  },
};

// 导出通知服务
export const notificationService = notificationApi;
