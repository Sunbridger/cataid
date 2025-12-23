/**
 * SWR Hook - 猫咪数据缓存与自动刷新
 */
import useSWR from 'swr';
import { Cat } from '../types';

// 通用 fetcher
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('请求失败');
  return res.json();
});

/**
 * 获取所有猫咪列表
 * - 缓存 60 秒后自动刷新
 * - 页面重新获得焦点时后台刷新
 */
export function useCats() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Cat[] }>('/api/cats', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000, // 60秒内相同请求去重
  });

  return {
    cats: data?.data || [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate, // 手动刷新
  };
}

/**
 * 获取单只猫咪详情
 * @param id 猫咪 ID
 */
export function useCat(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{ data: Cat }>(
    id ? `/api/cats/${id}` : null, // id 不存在时不发请求
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
    refresh: mutate,
  };
}
