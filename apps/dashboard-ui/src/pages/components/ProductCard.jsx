import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  CreditCard, 
  ChevronRight, 
  Zap, 
  Shield, 
  Star, 
  Plus, 
  MoreVertical, 
  Search, 
  Menu,
  CheckCircle2,
  Cpu,
  PhoneCall,
  Activity,
  Filter,
  Layers
} from 'lucide-react';



/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} description
 * @property {string} type
 * @property {boolean} active
 * @property {Object.<string, boolean>} [features]
 */

/**
 * ProductCard Component
 * Displays an individual service from the catalog with status and capabilities.
 * @component
 * @param {Object} props
 * @param {Product} props.product - The product object to render.
 *  * @param {Function} props.onClick - Callback triggered when the card is clicked.
 * @returns {React.JSX.Element | null}
 */
export const ProductCard = ({ product,onClick }) => {
    
  if (!product) return null;

  return (
    <div onClick={() => onClick?.(product)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          {product.type?.includes('AI') ? <Cpu size={24} /> : <PhoneCall size={24} />}
        </div>
        <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${product.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
          {product.active ? 'ACTIVE' : 'INACTIVE'}
        </div>
      </div>
      <h3 className="font-bold text-slate-900 mb-1">{product.name}</h3>
      <p className="text-xs text-slate-500 mb-4 h-8 line-clamp-2">{product.description || 'No description available'}</p>
      
      <div className="space-y-2 pt-4 border-t border-slate-50">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Capabilities</div>
        <div className="flex flex-wrap gap-2">
          {product.features && Object.entries(product.features).map(([key, val]) => val && (
            <div key={key} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span className="text-[10px] text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};