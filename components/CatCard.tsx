import React from 'react';
import { Link } from 'react-router-dom';
import { Cat } from '../types';
import { Heart } from 'lucide-react';

interface CatCardProps {
  cat: Cat;
  isFavorited?: boolean;
}

const CatCard: React.FC<CatCardProps> = ({ cat, isFavorited = false }) => {
  const status = cat.status || '可领养';
  const isAdopted = status === '已领养';

  return (
    <Link
      to={`/cat/${cat.id}`}
      className={`group block bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-100 ${isAdopted ? 'opacity-80 grayscale-[0.5]' : ''}`}
    >
      <div className="relative aspect-square md:aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={cat.image_url.split(',')[0]}
          alt={cat.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Badges Container */}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1.5 z-10 items-start">
          {status !== '可领养' && (
            <div className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm uppercase tracking-wide
             ${status === '已领养' ? 'bg-slate-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {status}
            </div>
          )}
          <div className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm uppercase tracking-wide text-white
             ${cat.is_stray ? 'bg-orange-500' : 'bg-brand-500'}`}>
            {cat.is_stray ? '流浪' : '家养'}
          </div>
        </div>

        {/* 收藏状态图标 */}
        <div className={`absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 rounded-full shadow-sm backdrop-blur-sm transition-colors
          ${isFavorited ? 'bg-red-50 text-red-500' : 'bg-white/90 text-slate-300'}`}>
          <Heart size={16} className="md:w-[18px] md:h-[18px]" fill={isFavorited ? "currentColor" : "none"} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3 pt-12 md:p-4 md:pt-16">

          <h3 className="text-white text-lg md:text-xl font-bold truncate drop-shadow-sm">{cat.name}</h3>
          <p className="text-gray-100 text-xs md:text-sm font-medium truncate opacity-90">{cat.breed} • {cat.age} 岁</p>
        </div>
      </div>

      <div className="p-3 md:p-4">
        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
          {cat.is_vaccinated && <span className="text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1 bg-green-50 text-green-700 rounded-md font-medium">疫苗</span>}
          {cat.is_sterilized && <span className="text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1 bg-blue-50 text-blue-700 rounded-md font-medium">绝育</span>}
          {cat.is_dewormed && <span className="text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1 bg-teal-50 text-teal-700 rounded-md font-medium">驱虫</span>}

          {cat.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1 bg-brand-50 text-brand-600 rounded-md font-medium truncate max-w-full">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-slate-500 text-xs md:text-sm line-clamp-2 leading-relaxed">
          {cat.description}
        </p>
        <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-slate-100 flex justify-between items-center text-xs md:text-sm font-medium">
          <span className="text-brand-600">{isAdopted ? '查看详情' : `看看 ${cat.name} \u2192`}</span>
          <div className="flex items-center gap-1 text-slate-400">
            <Heart size={14} className="text-red-400" fill="currentColor" />
            <span>{cat.commentCount || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CatCard;