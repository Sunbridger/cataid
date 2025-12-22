import React from 'react';
import { Link } from 'react-router-dom';
import { Cat } from '../types';
import { Heart } from 'lucide-react';

interface CatCardProps {
  cat: Cat;
}

const CatCard: React.FC<CatCardProps> = ({ cat }) => {
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

        {/* Status Badge */}
        {status !== '可领养' && (
          <div className={`absolute top-2 left-2 md:top-3 md:left-3 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm uppercase tracking-wide z-10
             ${status === '已领养' ? 'bg-slate-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
            {status}
          </div>
        )}

        <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/90 backdrop-blur-sm p-1.5 md:p-2 rounded-full shadow-sm text-brand-500">
          <Heart size={16} className="md:w-[18px] md:h-[18px]" fill="currentColor" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10 md:p-4 md:pt-12">
          <h3 className="text-white text-lg md:text-xl font-bold truncate">{cat.name}</h3>
          <p className="text-white/90 text-xs md:text-sm font-medium truncate">{cat.breed} • {cat.age} 岁</p>
        </div>
      </div>

      <div className="p-3 md:p-4">
        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
          {cat.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1 bg-brand-50 text-brand-600 rounded-md font-medium truncate max-w-full">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-slate-500 text-xs md:text-sm line-clamp-2 leading-relaxed">
          {cat.description}
        </p>
        <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-slate-100 flex justify-between items-center text-xs md:text-sm font-medium text-brand-600">
          <span>{isAdopted ? '查看详情' : `看看 ${cat.name} \u2192`}</span>
        </div>
      </div>
    </Link>
  );
};

export default CatCard;