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