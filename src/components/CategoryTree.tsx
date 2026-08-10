import { useState } from 'react';
import { ChevronLeft, ChevronDown, Plus, Pencil, Trash2, FolderOpen, Folder } from 'lucide-react';
import { Category } from '../lib/supabase';

type Props = {
  nodes: Category[];
  level?: number;
  productCounts: Record<string, number>;
  onAddChild: (parentId: string, parentName: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  loading?: boolean;
};

const DEPTH_COLORS = [
  'bg-teal-500',
  'bg-blue-400',
  'bg-violet-400',
  'bg-rose-400',
  'bg-amber-400',
];
const DEPTH_BG = [
  'hover:bg-teal-50/60 dark:hover:bg-teal-900/20',
  'hover:bg-blue-50/60 dark:hover:bg-blue-900/20',
  'hover:bg-violet-50/60 dark:hover:bg-violet-900/20',
  'hover:bg-rose-50/60 dark:hover:bg-rose-900/20',
  'hover:bg-amber-50/60 dark:hover:bg-amber-900/20',
];

export default function CategoryTree({ nodes, level = 0, productCounts, onAddChild, onEdit, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (nodes.length === 0 && level === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-600 text-sm">
        لا توجد أقسام. أضف قسمًا رئيسيًا للبدء.
      </div>
    );
  }

  const colorIdx = Math.min(level, DEPTH_COLORS.length - 1);

  return (
    <div className={level > 0 ? 'relative' : ''}>
      {level > 0 && (
        <div className="absolute top-0 bottom-0 right-0 w-px bg-slate-100 dark:bg-slate-700" style={{ right: '-1px' }} />
      )}
      {nodes.map((node, idx) => {
        const hasChildren = (node.children?.length ?? 0) > 0;
        const isCollapsed = collapsed[node.id];
        const count = productCounts[node.id] ?? 0;
        const isLast = idx === nodes.length - 1;

        return (
          <div key={node.id} className="relative">
            {level > 0 && (
              <div
                className="absolute border-r-2 border-b-2 border-slate-100 dark:border-slate-700 rounded-br-sm"
                style={{ right: '-1px', top: 0, width: '16px', height: '22px' }}
              />
            )}

            <div
              className={`
                group flex items-center gap-2 rounded-xl py-2 pr-3 pl-3 mx-1 my-0.5 transition-all duration-150
                ${DEPTH_BG[colorIdx]}
              `}
              style={{ paddingRight: `${level * 20 + 10}px` }}
            >
              {/* Expand toggle */}
              <button
                onClick={() => setCollapsed(p => ({ ...p, [node.id]: !isCollapsed }))}
                className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors shrink-0 ${
                  hasChildren ? 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700' : 'opacity-0 pointer-events-none'
                }`}
              >
                {hasChildren ? (
                  isCollapsed ? <ChevronLeft size={14} /> : <ChevronDown size={14} />
                ) : null}
              </button>

              {/* Folder icon */}
              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${DEPTH_COLORS[colorIdx]} bg-opacity-10`}>
                {hasChildren && !isCollapsed
                  ? <FolderOpen size={13} className={`text-${['teal','blue','violet','rose','amber'][colorIdx]}-600 dark:text-${['teal','blue','violet','rose','amber'][colorIdx]}-400`} />
                  : <Folder size={13} className={`text-${['teal','blue','violet','rose','amber'][colorIdx]}-600 dark:text-${['teal','blue','violet','rose','amber'][colorIdx]}-400`} />
                }
              </div>

              {/* Name */}
              <span className={`flex-1 text-sm leading-tight truncate ${
                level === 0
                  ? 'font-bold text-slate-800 dark:text-slate-100'
                  : 'font-medium text-slate-700 dark:text-slate-300'
              }`}>
                {node.name}
              </span>

              {/* Count badge */}
              {count > 0 && (
                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full px-2 py-0.5 font-semibold shrink-0">
                  {count}
                </span>
              )}

              {/* Actions (hover) */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => onAddChild(node.id, node.name)}
                  title="إضافة قسم فرعي"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all"
                >
                  <Plus size={13} />
                </button>
                <button
                  onClick={() => onEdit(node)}
                  title="تعديل"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => onDelete(node)}
                  title="حذف"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {hasChildren && !isCollapsed && (
              <div className="animate-fade-in relative pr-4">
                <CategoryTree
                  nodes={node.children!}
                  level={level + 1}
                  productCounts={productCounts}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
