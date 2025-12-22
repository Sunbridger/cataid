import React, { useEffect, useState } from 'react';
import { catService } from '../services/supabaseClient';
import { Cat } from '../types';
import CatCard from '../components/CatCard';
import { Loader2, Search } from 'lucide-react';

const HomePage: React.FC = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCats();
  }, []);

  const fetchCats = async () => {
    try {
      setLoading(true);
      const data = await catService.getAll();
      
      // Sort: Available first, then Pending, then Adopted. Within status, sort by date (newest first)
      const statusPriority: Record<string, number> = {
        '可领养': 0,
        '待定': 1,
        '已领养': 2
      };

      const sortedData = data.sort((a, b) => {
        const statusA = a.status || '可领养';
        const statusB = b.status || '可领养';
        
        if (statusPriority[statusA] !== statusPriority[statusB]) {
          return statusPriority[statusA] - statusPriority[statusB];
        }
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setCats(sortedData);
    } catch (err) {
      setError('加载喵星人失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  const filteredCats = cats.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cat.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-brand-500 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            寻找你的喵星人伙伴
          </h1>
          <p className="text-brand-100 text-lg md:text-xl">
            成千上万只可爱的猫咪正在等待一个温暖的家。今天就开始你的缘分之旅吧。
          </p>
          
          <div className="relative max-w-md mx-auto mt-8">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="搜索品种、名字或性格..."
              className="w-full py-3.5 pl-10 pr-4 rounded-full text-slate-800 focus:outline-none focus:ring-4 focus:ring-brand-500/30 shadow-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-600/50 rounded-full blur-3xl"></div>
      </section>

      {/* Content Area */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">待领养猫咪</h2>
          <span className="text-slate-500 text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200">
            找到 {filteredCats.length} 只猫咪
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-500">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-slate-500">正在召唤喵星人...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100 text-red-600">
            {error}
          </div>
        ) : filteredCats.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400 text-lg">没有找到符合条件的猫咪。</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 text-brand-600 font-medium hover:underline"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCats.map(cat => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;