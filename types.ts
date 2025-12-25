export type CatStatus = '可领养' | '已领养' | '待定';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Cat {
  id: string;
  userId?: string;           // 发布者用户ID
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
  commentCount?: number;  // 评论数，用于首页展示
}

export interface NewCatInput {
  userId?: string;           // 发布者用户ID
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
  updatedAt: string;
  id: string;
  catId: string;
  userId?: string;        // 申请者用户ID
  catName: string; // Denormalized for easier display
  catImage: string;
  applicantName: string;
  contactInfo: string;
  reason: string;
  status: ApplicationStatus;
  createdAt: string;
  cat?: Cat;
}

export interface NewApplicationInput {
  catId: string;
  userId?: string;        // 申请者用户ID
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
  userId?: string | null;       // 评论者用户ID
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
  userId?: string | null;       // 评论者用户ID
  parentId?: string | null;
  nickname: string;
  avatarUrl?: string | null;
  content: string;
}

// 用户相关类型
export type UserRole = 'user' | 'admin' | 'volunteer';
export type UserStatus = 'active' | 'banned' | 'deleted';

export interface User {
  id: string;
  phone?: string | null;
  email?: string | null;
  deviceId?: string | null;
  nickname: string;
  avatarUrl?: string | null;
  bio?: string | null;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  status: UserStatus;
  role: UserRole;
  favoriteCount: number;
  likeCount: number;      // 用户点赞评论数
  commentCount: number;
  adoptionCount: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface LoginInput {
  phone?: string;
  email?: string;
  password?: string;
  deviceId?: string;  // 游客登录
}

export interface RegisterInput {
  phone?: string;
  email?: string;
  password?: string;
  nickname: string;
  avatarUrl?: string;
}

// 通知类型
export type NotificationType =
  | 'application_submitted'   // 用户提交申请后收到的确认通知
  | 'application_approved'
  | 'application_rejected'
  | 'new_application'         // 管理员收到的新申请通知
  | 'comment_reply'
  | 'comment_like'
  | 'comment_liked'      // 评论被点赞
  | 'cat_favorited'      // 猫咪被收藏
  | 'adoption_cancelled' // 领养被取消(管理员更改已领养猫咪状态)
  | 'system';

// 通知
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: 'cat' | 'comment' | 'application';
  createdAt: string;
}