import { useState } from 'react';
import { ChevronDown, ChevronLeft, X } from 'lucide-react';
import { Category } from '../lib/supabase';

type Props = {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
};

export default function CategoryFilterPanel({ categories, value, onChange }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div>
      <button
        onClick={() => onChange('')}
        className={`w-full text-right px-3 py-2 rounded-xl text-sm mb-1 transition-all font-medium ${
          !value
            ? 'bg-teal-600 text-white'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        جميع الأقسام
      </button>
      <FilterNodes
        nodes={categories}
        value={value}
        onChange={onChange}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        level={0}
      />
    </div>
  );
}

function FilterNodes({
  nodes, value, onChange, collapsed, setCollapsed, level,
}: {
  nodes: Category[];
  value: string;
  onChange: (id: string) => void;
  collapsed: Record<string, boolean>;
  setCollapsed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  level: number;
}) {
  return (
    <>
      {nodes.map(node => {
        const hasChildren = (node.children?.length ?? 0) > 0;
        const isCollapsed = collapsed[node.id] ?? false;
        const isSelected = value === node.id;

        return (
          <div key={node.id}>
            <div
              className={`flex items-center gap-1.5 rounded-xl my-0.5 transition-all ${
                isSelected ? 'bg-teal-50 dark:bg-teal-900/30' : ''
              }`}
              style={{ paddingRight: `${level * 14 + 6}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => setCollapsed(p => ({ ...p, [node.id]: !isCollapsed }))}
                  className="w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
                >
                  {isCollapsed ? <ChevronLeft size={13} /> : <ChevronDown size={13} />}
                </button>
              ) : (
                <span className="w-6 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
                </span>
              )}
              <button
                onClick={() => onChange(isSelected ? '' : node.id)}
                className={`flex-1 text-right py-2 pr-1 text-sm transition-colors ${
                  isSelected
                    ? 'text-teal-700 dark:text-teal-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium'
                }`}
              >
                {node.name}
              </button>
              {isSelected && (
                <button onClick={() => onChange('')} className="w-5 h-5 flex items-center justify-center text-teal-400 hover:text-teal-600 shrink-0">
                  <X size={11} />
                </button>
              )}
            </div>
            {hasChildren && !isCollapsed && (
              <div className="border-r-2 border-slate-100 dark:border-slate-700 mr-4">
                <FilterNodes
                  nodes={node.children!}
                  value={value}
                  onChange={onChange}
                  collapsed={collapsed}
                  setCollapsed={setCollapsed}
                  level={level + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
