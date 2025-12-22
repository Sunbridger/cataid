import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_DEMO_MODE, MOCK_CATS } from '../constants';
import { Cat, NewCatInput, CatStatus, AdoptionApplication, NewApplicationInput, ApplicationStatus } from '../types';

// Initialize Supabase client if keys exist
const supabase = !IS_DEMO_MODE 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Mock storage for applications in Demo Mode (in-memory)
let MOCK_APPLICATIONS: AdoptionApplication[] = [
  {
    id: 'app-1',
    catId: '2',
    catName: '黑夜 (Midnight)',
    catImage: 'https://picsum.photos/id/40/600/600',
    applicantName: '张三',
    contactInfo: '13800138000',
    reason: '家里有一只猫了，想找个伴。',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

export const catService = {
  // Fetch all cats
  getAll: async (): Promise<Cat[]> => {
    if (IS_DEMO_MODE || !supabase) {
      console.warn("Using Mock Data (Supabase keys missing)");
      await new Promise(resolve => setTimeout(resolve, 800));
      return MOCK_CATS as unknown as Cat[];
    }

    const { data, error } = await supabase
      .from('cats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cats:', error);
      throw error;
    }
    return data as Cat[];
  },

  // Get single cat
  getById: async (id: string): Promise<Cat | undefined> => {
    if (IS_DEMO_MODE || !supabase) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_CATS.find(c => c.id === id) as unknown as Cat;
    }

    const { data, error } = await supabase
      .from('cats')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Cat;
  },

  // Upload image and create cat record
  create: async (cat: NewCatInput): Promise<Cat | null> => {
    if (IS_DEMO_MODE || !supabase) {
      alert("演示模式：无法写入数据库。请查看控制台输出。");
      console.log("Would save:", cat);
      return null;
    }

    let imageUrl = '';

    // 1. Upload Image if exists
    if (cat.imageFile) {
      const fileExt = cat.imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `cat-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, cat.imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
        
      imageUrl = data.publicUrl;
    } else {
      // Fallback random image
      imageUrl = `https://picsum.photos/seed/${cat.name}/600/600`;
    }

    // 2. Insert Record
    const { data, error } = await supabase
      .from('cats')
      .insert([
        {
          name: cat.name,
          age: cat.age,
          gender: cat.gender,
          breed: cat.breed,
          description: cat.description,
          image_url: imageUrl,
          tags: cat.tags,
          status: '可领养' // Default status
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Cat;
  },

  // Update cat status
  updateStatus: async (id: string, status: CatStatus): Promise<void> => {
    if (IS_DEMO_MODE || !supabase) {
      console.log(`Demo Mode: Updating cat ${id} to status ${status}`);
      const cat = MOCK_CATS.find(c => c.id === id);
      if (cat) cat.status = status;
      return;
    }

    const { error } = await supabase
      .from('cats')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }
};

export const adoptionService = {
  // Submit new application
  submitApplication: async (app: NewApplicationInput): Promise<AdoptionApplication> => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (IS_DEMO_MODE || !supabase) {
      const newApp: AdoptionApplication = {
        id: `app-${Date.now()}`,
        ...app,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      MOCK_APPLICATIONS.push(newApp);
      
      // Also update cat status to "Pending" automatically in demo mode for better UX
      const cat = MOCK_CATS.find(c => c.id === app.catId);
      if (cat) cat.status = '待定';

      return newApp;
    }

    const { data, error } = await supabase
      .from('adoption_applications')
      .insert([{ ...app, status: 'pending' }])
      .select()
      .single();

    if (error) throw error;
    
    // Auto set cat to pending
    await catService.updateStatus(app.catId, '待定');
    
    return data as AdoptionApplication;
  },

  // Get single application by ID (for status checking)
  getApplicationById: async (id: string): Promise<AdoptionApplication | null> => {
    if (IS_DEMO_MODE || !supabase) {
      // Simulate network
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_APPLICATIONS.find(a => a.id === id) || null;
    }

    const { data, error } = await supabase
      .from('adoption_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      return null;
    }
    return data as AdoptionApplication;
  },

  // Get applications (for admin)
  getAllApplications: async (): Promise<AdoptionApplication[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (IS_DEMO_MODE || !supabase) {
      return [...MOCK_APPLICATIONS].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const { data, error } = await supabase
      .from('adoption_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AdoptionApplication[];
  },

  // Update application status
  reviewApplication: async (appId: string, status: ApplicationStatus, catId: string): Promise<void> => {
    if (IS_DEMO_MODE || !supabase) {
      const app = MOCK_APPLICATIONS.find(a => a.id === appId);
      if (app) app.status = status;

      // Business Logic: If approved, Cat -> '已领养'. If rejected, Cat -> '可领养'
      if (status === 'approved') {
        const cat = MOCK_CATS.find(c => c.id === catId);
        if (cat) cat.status = '已领养';
      } else if (status === 'rejected') {
        // Only reset to available if it was pending
        const cat = MOCK_CATS.find(c => c.id === catId);
        if (cat && cat.status === '待定') cat.status = '可领养';
      }
      return;
    }

    const { error } = await supabase
      .from('adoption_applications')
      .update({ status })
      .eq('id', appId);

    if (error) throw error;

    if (status === 'approved') {
      await catService.updateStatus(catId, '已领养');
    } else if (status === 'rejected') {
      await catService.updateStatus(catId, '可领养');
    }
  }
};