import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { catService } from '../services/apiService';
import { generateCatBio, analyzeCatImage } from '../services/geminiService';
import { Sparkles, Upload, ArrowRight, Loader2, Camera, Info, Lock, ChevronLeft, ChevronRight, Check, Heart, Shield, X, Smile } from 'lucide-react';
import { CAT_CATEGORIES } from '../constants';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import ConfirmModal from '../components/ConfirmModal';

// 定义步骤
const STEPS = [
  { id: 1, title: '照片', desc: '美照' },
  { id: 2, title: '身份', desc: '基本' },
  { id: 3, title: '详情', desc: '特征' },
  { id: 4, title: '故事', desc: '简介' },
];

const AddCatPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const { user, isLoggedIn, isGuest } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 权限控制
  const canPost = isLoggedIn && !isGuest;

  // 状态管理
  const [currentStep, setCurrentStep] = useState(1);
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

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 处理标签选择
  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // 处理图片上传
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

      // 如果是第一张图片，触发 AI 识别
      if (newFiles.length > 0 && !formData.breed && !analyzingImage) {
        const analyze = async () => {
          setAnalyzingImage(true);
          try {
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
                    tags: newTags,
                    age: analysis.age ? String(analysis.age) : prev.age,
                    gender: analysis.gender || prev.gender
                  };
                });
                success(`AI 识别成功：看上去是 ${analysis.breed || '可爱猫咪'}`);
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
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setFormData(prev => ({ ...prev, imageFiles: newFiles, imagePreviews: newPreviews }));
  };

  const handleGenerateBio = async () => {
    if (!formData.name || !formData.breed || formData.tags.length === 0) {
      info("请先告诉我们它的名字、品种和性格哦~");
      return;
    }
    setGeneratingBio(true);
    const bio = await generateCatBio(formData.name, formData.breed, formData.tags);
    setFormData(prev => ({ ...prev, description: bio }));
    setGeneratingBio(false);
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (formData.imageFiles.length === 0) {
          info('请至少上传一张可爱的照片');
          return false;
        }
        return true;
      case 2:
        if (!formData.name) {
          info('请给猫咪起个名字');
          return false;
        }
        if (!formData.age) {
          info('请输入猫咪的年龄');
          return false;
        }
        return true;
      case 3:
        if (!formData.breed) {
          info('请输入猫咪的品种');
          return false;
        }
        // 品种和健康状况是选填或有默认值
        return true;
      case 4:
        if (!formData.description) {
          info('请填写猫咪的简介');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(c => c + 1);
        window.scrollTo(0, 0);
      } else {
        setShowConfirm(true);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(c => c - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    info('正在把猫咪送往云端...');
    navigate('/');

    const submitData = {
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      breed: formData.breed,
      description: formData.description,
      tags: formData.tags,
      imageFiles: formData.imageFiles,
      is_sterilized: formData.is_sterilized,
      is_dewormed: formData.is_dewormed,
      is_vaccinated: formData.is_vaccinated,
      is_stray: formData.is_stray
    };

    catService.create(submitData)
      .then(() => {
        success('发布成功！希望它能很快找到家。');
        window.dispatchEvent(new Event('cat-data-updated'));
      })
      .catch((err) => {
        console.error("Upload failed", err);
        error('发布出错了，请稍后再试');
      });
  };

  // 渲染进度条
  const renderProgressBar = () => (
    <div className="flex items-center justify-between mb-8 px-2">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex flex-col items-center relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step.id === currentStep
              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 scale-110'
              : step.id < currentStep
                ? 'bg-pink-100 text-pink-600'
                : 'bg-slate-100 text-slate-400'
              }`}
          >
            {step.id < currentStep ? <Check size={18} /> : step.id}
          </div>
          <span className={`text-[10px] mt-2 font-medium ${step.id === currentStep ? 'text-pink-600' : 'text-slate-400'}`}>
            {step.title}
          </span>
          {/* 连接线 */}
          {index < STEPS.length - 1 && (
            <div className={`absolute top-5 left-10 w-[calc(100%+2rem)] h-0.5 -z-10 ${step.id < currentStep ? 'bg-pink-200' : 'bg-slate-100'
              }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 px-4 py-3 flex items-center justify-center shadow-sm border-b border-slate-100 -mx-4">
        <h1 className="text-lg font-bold text-slate-800">发布猫咪</h1>
      </div>

      <div className="max-w-xl mx-auto py-6">

        {/* 权限提示 */}
        {!canPost ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center mt-10">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-pink-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">登录开启领养之旅</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed max-w-xs mx-auto">
              {!isLoggedIn
                ? '登录后即可发布猫咪信息，帮助它们找到温暖的家。'
                : '请先绑定手机号或邮箱，完善身份信息后即可发布。'}
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
            >
              {!isLoggedIn ? '去登录' : '去绑定账号'}
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            {renderProgressBar()}

            {/* 步骤内容容器 */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 min-h-[400px]">

              {/* Step 1: 照片 */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">这只小猫长什么样？</h2>
                    <p className="text-slate-500 text-sm">上传可爱的照片，AI 会自动帮你识别品种哦！</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {formData.imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                        <img src={preview} alt="Cat" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-white/90 text-red-500 rounded-full p-1.5 shadow-sm"
                        >
                          <X size={14} />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-0 inset-x-0 bg-pink-500/80 text-white text-[10px] text-center py-1">封面</div>
                        )}
                      </div>
                    ))}

                    {formData.imageFiles.length < 9 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 hover:border-pink-300 transition-all"
                      >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-pink-500">
                          <Camera size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400">添加照片</span>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {analyzingImage && (
                    <div className="flex items-center justify-center gap-2 text-sm text-pink-600 font-medium bg-pink-50 p-3 rounded-xl animate-pulse">
                      <Sparkles size={16} />
                      <span>AI 正在仔细观察这只猫咪...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: 身份 */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="text-center mb-2">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">它的基本信息</h2>
                    <p className="text-slate-500 text-sm">告诉我们它的名字和年龄吧</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">名字</label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="例如：咪咪"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all text-lg"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">年龄 (岁)</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        placeholder="0.5"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">性别</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setFormData(p => ({ ...p, gender: 'Male' }))}
                          className={`py-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.gender === 'Male'
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                            }`}
                        >
                          <span className="text-2xl">♂</span>
                          <span className="font-bold">帅气公猫</span>
                        </button>
                        <button
                          onClick={() => setFormData(p => ({ ...p, gender: 'Female' }))}
                          className={`py-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.gender === 'Female'
                            ? 'border-pink-500 bg-pink-50 text-pink-600'
                            : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                            }`}
                        >
                          <span className="text-2xl">♀</span>
                          <span className="font-bold">可爱母猫</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: 详情 */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center mb-2">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">更多细节</h2>
                    <p className="text-slate-500 text-sm">完善更多信息，让领养人更了解它</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">品种</label>
                    <input
                      name="breed"
                      value={formData.breed}
                      onChange={handleInputChange}
                      placeholder="例如：中华田园猫"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-pink-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">性格特点</label>
                    <div className="flex flex-wrap gap-2">
                      {CAT_CATEGORIES.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${formData.tags.includes(tag)
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-pink-300'
                            }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">健康状况</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setFormData(p => ({ ...p, is_vaccinated: !p.is_vaccinated }))}
                        className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${formData.is_vaccinated ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400'
                          }`}
                      >
                        <Shield size={16} /> 已接种疫苗
                      </button>
                      <button
                        onClick={() => setFormData(p => ({ ...p, is_sterilized: !p.is_sterilized }))}
                        className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${formData.is_sterilized ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400'
                          }`}
                      >
                        <Check size={16} /> 已绝育
                      </button>
                      <button
                        onClick={() => setFormData(p => ({ ...p, is_dewormed: !p.is_dewormed }))}
                        className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${formData.is_dewormed ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400'
                          }`}
                      >
                        <Check size={16} /> 已驱虫
                      </button>
                      <button
                        onClick={() => setFormData(p => ({ ...p, is_stray: !p.is_stray }))}
                        className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${formData.is_stray ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-400'
                          }`}
                      >
                        <Info size={16} /> 流浪猫
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: 故事简介 */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">最后一步！</h2>
                    <p className="text-slate-500 text-sm">写一段话介绍它，或者让 AI 来帮忙</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🐱</span>
                        <div>
                          <p className="font-bold text-slate-800">{formData.name || '猫咪名字'}</p>
                          <p className="text-xs text-slate-500">{formData.breed} · {formData.age}岁</p>
                        </div>
                      </div>
                      <button
                        onClick={handleGenerateBio}
                        disabled={generatingBio}
                        className="flex items-center gap-1 text-xs bg-pink-500 text-white px-3 py-1.5 rounded-full font-bold shadow-sm hover:bg-pink-600 transition-colors disabled:opacity-50"
                      >
                        {generatingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        AI 写故事
                      </button>
                    </div>
                    <textarea
                      value={formData.description}
                      onChange={handleInputChange}
                      name="description"
                      rows={6}
                      className="w-full bg-white rounded-xl border-0 p-4 text-sm leading-relaxed text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-pink-200"
                      placeholder="在这里写下它的故事..."
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
                    <Smile size={14} />
                    <span>真诚的故事更容易打动领养人哦</span>
                  </div>
                </div>
              )}

            </div>

            {/* 底部按钮栏 */}
            <div className="mt-8 flex gap-4">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={20} /> 上一步
                </button>
              )}

              <button
                onClick={nextStep}
                disabled={generatingBio || analyzingImage}
                className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {currentStep === 4 ? (
                  <>发布领养 <Check size={20} /></>
                ) : (
                  <>下一步 <ChevronRight size={20} /></>
                )}
              </button>
            </div>
          </>
        )}

      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="确认发布"
        message={`准备好为 ${formData.name} 寻找新家了吗？`}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
        confirmText="确认发布"
        cancelText="再检查下"
        type="info"
      />
    </div>
  );
};

export default AddCatPage;