import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catService } from '../services/apiService';
import { generateCatBio } from '../services/geminiService';
import { Sparkles, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { CAT_CATEGORIES } from '../constants';
import { useToast } from '../context/ToastContext';

const AddCatPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);


  const [formData, setFormData] = useState({
    name: '',
    age: '',
    breed: '',
    gender: 'Male' as 'Male' | 'Female',
    tags: [] as string[],
    description: '',
    imageFiles: [] as File[],
    imagePreviews: [] as string[]
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
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = [...formData.imageFiles, ...newFiles].slice(0, 9);

      const newPreviews = totalFiles.map(file => URL.createObjectURL(file));

      setFormData(prev => ({
        ...prev,
        imageFiles: totalFiles,
        imagePreviews: newPreviews
      }));
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...formData.imageFiles];
    newFiles.splice(index, 1);

    const newPreviews = [...formData.imagePreviews];
    // Revoke the old URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);

    setFormData(prev => ({
      ...prev,
      imageFiles: newFiles,
      imagePreviews: newPreviews
    }));
  };

  const handleGenerateBio = async () => {
    if (!formData.name || !formData.breed || formData.tags.length === 0) {
      info("请先输入名字、品种，并至少选择一个性格标签。");
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
        imageFiles: formData.imageFiles // 传入图片文件数组，API 会自动上传
      });
      success('发布成功！');
      navigate('/');
    } catch (err) {
      console.error(err);
      error('发布失败，请查看控制台详情。');
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

      <form onSubmit={handleSubmit} className="bg-white px-6 py-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">

        {/* Section: 基本信息 */}
        <div className="space-y-6">
          <div className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-brand-500 rounded-full"></span>
            基本信息
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">猫咪照片 (最多9张) <span className="text-brand-500">*</span></label>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {formData.imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              ))}

              {formData.imageFiles.length < 9 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-brand-300 transition-all text-slate-400 hover:text-brand-500"
                >
                  <Upload size={20} className="mb-1" />
                  <span className="text-[10px] font-bold">上传照片</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400">支持 JPG/PNG，第一张将作为封面图</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">名字</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-300"
                placeholder="例如：咪咪"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">品种</label>
              <input
                required
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-300"
                placeholder="例如：中华田园猫"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">年龄 (岁)</label>
              <input
                required
                type="number"
                name="age"
                min="0"
                max="30"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">性别</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-all ${formData.gender === 'Male' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleInputChange} className="hidden" />
                  <span className="font-semibold text-sm">公猫</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-all ${formData.gender === 'Female' ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleInputChange} className="hidden" />
                  <span className="font-semibold text-sm">母猫</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section: 更多细节 */}
        <div className="space-y-6">
          <div className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-brand-500 rounded-full"></span>
            性格与故事
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">性格特点 (多选)</label>
            <div className="flex flex-wrap gap-2">
              {CAT_CATEGORIES.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${formData.tags.includes(tag)
                    ? 'bg-brand-500 text-white border-brand-600 shadow-md shadow-brand-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-700">猫咪简介</label>
              <button
                type="button"
                onClick={handleGenerateBio}
                disabled={generatingBio}
                className="text-xs flex items-center gap-1.5 text-brand-600 font-bold bg-brand-50 px-2 py-1 rounded-md hover:bg-brand-100 transition-colors disabled:opacity-50"
              >
                {generatingBio ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                {generatingBio ? '正在撰写...' : 'AI 生成故事'}
              </button>
            </div>
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none placeholder:text-slate-300 text-sm leading-relaxed"
              placeholder="请介绍一下猫咪的来历、性格习惯，以及对领养人的小期待..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              发布中...
            </>
          ) : (
            <>
              发布领养信息
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddCatPage;