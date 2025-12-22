import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catService } from '../services/apiService';
import { generateCatBio } from '../services/geminiService';
import { Sparkles, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { CAT_CATEGORIES } from '../constants';

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

  // 引用 hidden file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.breed) return;

    // 二次确认
    if (!window.confirm('确定要发布这条领养信息吗？\n请确保信息真实有效，关爱每一条小生命。')) {
      return;
    }

    setLoading(true);
    try {
      // 使用 catService.create 自动处理图片上传
      await catService.create({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        breed: formData.breed,
        description: formData.description,
        tags: formData.tags,
        imageFile: formData.imageFile // 传入图片文件，API 会自动上传
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
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 space-y-6">
        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">猫咪照片</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-36 h-36 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative cursor-pointer hover:bg-slate-100 transition-all group ${!imagePreview ? 'hover:border-brand-300' : 'border-solid'}`}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">更换图片</span>
                </div>
              </>
            ) : (
              <>
                <Upload className="text-slate-400 mb-2 group-hover:text-brand-400 transition-colors" size={24} />
                <span className="text-xs text-slate-400 group-hover:text-brand-500 transition-colors">点击上传</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="text-xs text-slate-400">推荐：正方形 JPG 或 PNG 图片，最大 2MB。</p>
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.tags.includes(tag)
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
            <button
              type="button"
              onClick={handleGenerateBio}
              disabled={generatingBio}
              className="text-xs flex items-center gap-1.5 text-brand-600 font-medium hover:text-brand-700 disabled:opacity-50"
            >
              {generatingBio ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
              {generatingBio ? '正在撰写...' : 'AI 自动生成'}
            </button>
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