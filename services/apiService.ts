/**
 * API 服务 - 前端调用服务端 API
 * 前端不再直接连接 Supabase，所有数据操作通过服务端 API 完成
 */

import { Cat, NewCatInput, CatStatus, AdoptionApplication, NewApplicationInput, ApplicationStatus } from '../types';

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
   */
  getAll: async (): Promise<Cat[]> => {
    const result = await request<{ data: Cat[] }>('/cats');
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
      // 将文件转换为 Base64
      const base64 = await fileToBase64(file);

      const result = await request<{ url: string }>('/upload', {
        method: 'POST',
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          contentType: file.type
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
  updateStatus: async (id: string, status: CatStatus): Promise<void> => {
    // PUT /api/cats/[id]
    await request(`/cats/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
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
