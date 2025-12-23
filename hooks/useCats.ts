/**
 * SWR Hook - 猫咪数据缓存与自动刷新
 */
import useSWR, { mutate } from 'swr';
import { Cat } from '../types';

// 通用 fetcher
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('请求失败');
  return res.json();
});

// SWR 缓存 Key
const CATS_LIST_KEY = '/api/cats';
const getCatDetailKey = (id: string) => `/api/cats/${id}`;

/**
 * 全局刷新猫咪列表缓存（绕过缓存，强制重新获取）
 * 在发布、领养等更新操作后调用
 */
export async function revalidateCats() {
  // 使用 mutate 重新验证缓存，不传 data 表示重新 fetch
  await mutate(CATS_LIST_KEY);
}

/**
 * 全局刷新指定猫咪详情缓存
 * @param id 猫咪 ID
 */
export async function revalidateCat(id: string) {
  await mutate(getCatDetailKey(id));
}

/**
 * 获取所有猫咪列表
 * - 缓存 60 秒后自动刷新
 * - 页面重新获得焦点时后台刷新
 */
export function useCats() {
  const { data, error, isLoading, mutate: localMutate } = useSWR<{ data: Cat[] }>(CATS_LIST_KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000, // 60秒内相同请求去重
  });

  return {
    cats: data?.data || [],
    isLoading,
    isError: !!error,
    error,
    refresh: localMutate, // 手动刷新
  };
}

/**
 * 获取单只猫咪详情
 * @param id 猫咪 ID
 */
export function useCat(id: string | undefined) {
  const { data, error, isLoading, mutate: localMutate } = useSWR<{ data: Cat }>(
    id ? getCatDetailKey(id) : null, // id 不存在时不发请求
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000, // 30秒内相同请求去重
    }
  );

  return {
    cat: data?.data,
    isLoading,
    isError: !!error,
    error,
    refresh: localMutate,
  };
}

