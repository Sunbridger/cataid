export type CatStatus = '可领养' | '已领养' | '待定';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Cat {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  breed: string;
  description: string;
  image_url: string;
  tags: string[];
  status: CatStatus;
  created_at: string;
  is_sterilized: boolean;
  is_dewormed: boolean;
  is_vaccinated: boolean;
  is_stray: boolean;
}

export interface NewCatInput {
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  breed: string;
  description: string;
  tags: string[];
  status?: CatStatus;
  imageFiles?: File[] | null;
  is_sterilized: boolean;
  is_dewormed: boolean;
  is_vaccinated: boolean;
  is_stray: boolean;
}

export interface AdoptionApplication {
  id: string;
  catId: string;
  catName: string; // Denormalized for easier display
  catImage: string;
  applicantName: string;
  contactInfo: string;
  reason: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface NewApplicationInput {
  catId: string;
  catName: string;
  catImage: string;
  applicantName: string;
  contactInfo: string;
  reason: string;
}

export interface SupabaseBucketPath {
  path: string;
  fullPath: string;
}

// 评论相关类型
export interface Comment {
  id: string;
  catId: string;
  parentId: string | null;      // 父评论ID，顶级评论为null
  nickname: string;              // 评论者昵称
  avatarUrl: string | null;      // 评论者头像
  content: string;               // 评论内容
  isAiReply: boolean;            // 是否为AI回复
  likeCount: number;             // 点赞数
  createdAt: string;             // 创建时间
  replies?: Comment[];           // 子评论列表（前端组装）
}

export interface NewCommentInput {
  catId: string;
  parentId?: string | null;
  nickname: string;
  avatarUrl?: string | null;
  content: string;
}