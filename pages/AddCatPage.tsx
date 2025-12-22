import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catService } from '../services/supabaseClient';
import { generateCatBio } from '../services/geminiService';
import { Sparkles, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { CAT_CATEGORIES, GEMINI_API_KEY, IS_DEMO_MODE } from '../constants';

const AddCatPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    breed: '',
    gender: 'Male' as 'Male' | 'Female',
    tags: [] as string[],
    description: '',
    imageFile: null as File | null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, imageFile: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerateBio = async () => {
    if (!formData.name || !formData.breed || formData.tags.length === 0) {
      alert("请先输入名字、品种，并至少选择一个性格标签。");
      return;
    }
    setGeneratingBio(true);
    const bio = await generateCatBio(formData.name, formData.breed, formData.tags);
    setFormData(prev => ({ ...prev, description: bio }));
    setGeneratingBio(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.breed) return;

    setLoading(true);
    try {
      await catService.create({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        breed: formData.breed,
        description: formData.description,
        tags: formData.tags,
        imageFile: formData.imageFile
      });
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('发布失败，请查看控制台详情。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">发布猫咪领养信息</h1>
        <p className="text-slate-500 mt-2">帮助毛孩子找到永远的家。</p>
        {IS_DEMO_MODE && (
           <div className="mt-4 p-3 bg-amber-50 text-amber-700 text-sm rounded-lg border border-amber-200 inline-block">
             模式：演示模式 (数据不会保存到数据库)
           </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 space-y-6">
        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">猫咪照片</label>
          <div className="flex items-center gap-6">
            <div className={`w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative ${!imagePreview ? 'hover:border-brand-300' : ''}`}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="text-slate-400" size={24} />
              )}
            </div>
            <div className="flex-1">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-2">推荐：正方形 JPG 或 PNG 图片，最大 2MB。</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">名字</label>
            <input 
              required
              name="name"
              value={formData.name} 
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              placeholder="例如：咪咪"
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">品种</label>
            <input 
              required
              name="breed"
              value={formData.breed} 
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              placeholder="例如：短毛猫"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">年龄 (岁)</label>
            <input 
              required
              type="number"
              name="age"
              min="0"
              max="25"
              value={formData.age} 
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">性别</label>
            <select 
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white"
            >
              <option value="Male">公</option>
              <option value="Female">母</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">性格特点</label>
          <div className="flex flex-wrap gap-2">
            {CAT_CATEGORIES.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  formData.tags.includes(tag) 
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Description & AI Generator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
             <label className="block text-sm font-semibold text-slate-700">简介</label>
             {GEMINI_API_KEY && (
               <button
                type="button"
                onClick={handleGenerateBio}
                disabled={generatingBio}
                className="text-xs flex items-center gap-1.5 text-brand-600 font-medium hover:text-brand-700 disabled:opacity-50"
               >
                 {generatingBio ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12} />}
                 {generatingBio ? '正在撰写...' : 'AI 自动生成'}
               </button>
             )}
          </div>
          <textarea 
            required
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
            placeholder="介绍一下这只猫猫..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              发布中...
            </>
          ) : (
            <>
              发布领养
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddCatPage;