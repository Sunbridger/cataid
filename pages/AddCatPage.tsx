import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catService } from '../services/apiService';
import { generateCatBio, analyzeCatImage } from '../services/geminiService';
import { Sparkles, Upload, ArrowRight, Loader2, Camera, Info } from 'lucide-react';
import { CAT_CATEGORIES } from '../constants';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const AddCatPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  const [formData, setFormData] = useState({
    name: '',
    age: '',
    breed: '',
    gender: 'Male' as 'Male' | 'Female',
    tags: [] as string[],
    description: '',
    imageFiles: [] as File[],
    imagePreviews: [] as string[],
    is_sterilized: false,
    is_dewormed: false,
    is_vaccinated: false,
    is_stray: false
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = [...formData.imageFiles, ...newFiles].slice(0, 9);
      const newPreviews = totalFiles.map(file => URL.createObjectURL(file));

      setFormData(prev => ({
        ...prev,
        imageFiles: totalFiles,
        imagePreviews: newPreviews
      }));

      // Trigger AI Analysis if this is the first image upload (and we aren't already analyzing)
      // This enhances UX by auto-filling breed/tags.
      // We upload the image first to get a URL for analysis.
      if (newFiles.length > 0 && !formData.breed && !analyzingImage) {
        // Non-blocking async operation
        const analyze = async () => {
          setAnalyzingImage(true);
          try {
            // Immediately upload the first image to get a public URL
            const imageUrl = await catService.uploadImage(newFiles[0]);

            if (imageUrl) {
              const analysis = await analyzeCatImage(imageUrl);

              if (analysis) {
                setFormData(prev => {
                  const newTags = analysis.characteristics
                    ? Array.from(new Set([...prev.tags, ...analysis.characteristics.slice(0, 3)]))
                    : prev.tags;

                  return {
                    ...prev,
                    breed: analysis.breed || prev.breed,
                    tags: newTags
                  };
                });
                success(`AI 识别成功：这是一个 ${analysis.breed || '可爱猫咪'}`);
              }
            }
          } catch (err) {
            console.error("AI Analysis failed", err);
          } finally {
            setAnalyzingImage(false);
          }
        };

        analyze();
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.breed) return;
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
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

        imageFiles: formData.imageFiles, // 传入图片文件数组，API 会自动上传
        is_sterilized: formData.is_sterilized,
        is_dewormed: formData.is_dewormed,
        is_vaccinated: formData.is_vaccinated,
        is_stray: formData.is_stray
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
    <div className="max-w-2xl mx-auto" >
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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                <Camera size={18} className="text-brand-500" />
                猫咪照片
                <span className="text-slate-400 font-normal text-xs">(最多9张)</span>
              </label>
              {analyzingImage && (
                <div className="flex items-center gap-2 text-xs text-brand-600 font-medium bg-brand-50 px-3 py-1 rounded-full animate-pulse">
                  <Sparkles size={12} />
                  AI 正在识别品种...
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
              {formData.imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                  <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 bg-white/90 text-slate-700 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500 shadow-sm transform hover:scale-110"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-brand-500/80 text-white text-[10px] font-bold py-1 text-center backdrop-blur-sm">
                      封面
                    </div>
                  )}
                </div>
              ))}

              {formData.imageFiles.length < 9 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-brand-400 hover:shadow-md transition-all group overflow-hidden"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform text-brand-500">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-brand-500">上传照片</span>
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

            <div className="space-y-4 pt-2">
              <label className="block text-sm font-medium text-slate-700">健康状况与来源</label>

              <div className="grid grid-cols-2 gap-4">
                {/* is_stray */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-500">来源</span>
                  <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_stray: false }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!formData.is_stray ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      家养
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_stray: true }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${formData.is_stray ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      流浪
                    </button>
                  </div>
                </div>

                {/* is_sterilized */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-500">是否绝育</span>
                  <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_sterilized: true }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${formData.is_sterilized ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      已绝育
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_sterilized: false }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!formData.is_sterilized ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      未绝育
                    </button>
                  </div>
                </div>

                {/* is_dewormed */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-500">是否驱虫</span>
                  <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_dewormed: true }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${formData.is_dewormed ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      已驱虫
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_dewormed: false }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!formData.is_dewormed ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      未驱虫
                    </button>
                  </div>
                </div>

                {/* is_vaccinated */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-500">是否接种疫苗</span>
                  <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_vaccinated: true }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${formData.is_vaccinated ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      已接种
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_vaccinated: false }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!formData.is_vaccinated ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      未接种
                    </button>
                  </div>
                </div>
              </div>
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

      {/* Full Screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-slate-100">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-brand-50 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 mb-1">正在上传</h3>
              <p className="text-slate-500 text-sm">正在处理猫咪照片和信息，请稍候...</p>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        title="确认发布"
        message="确定要发布这条领养信息吗？请确保所有信息真实有效，每一条信息都代表着对一个小生命的责任。"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
        confirmText="确认发布"
        cancelText="我再想想"
        type="info"
      />
    </div>
  );
};

export default AddCatPage;