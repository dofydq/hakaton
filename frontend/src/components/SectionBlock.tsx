
import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Trash2, GripVertical, Plus, ChevronDown, ChevronUp, X } from 'lucide-react';
import { QuestionBlock, QuestionData } from './QuestionBlock';

export interface SectionData {
  id: string;
  title: string;
  description: string;
  questions: QuestionData[];
}

export const QUESTION_TYPES = [
  { type: 'text', label: '📝 Текстовое поле (свободный ответ)' },
  { type: 'single_choice', label: '🔘 Один выбор' },
  { type: 'multiple_choice', label: '✅ Множественный выбор' },
  { type: 'scale', label: '📊 Шкала (1-10)' },
  { type: 'slider', label: '🎚️ Слайдер (Диапазон)' },
  { type: 'date', label: '📅 Дата / Время' },
  { type: 'yes_no', label: '⚖️ Да / Нет' },
  { type: 'number', label: '🔢 Числовой ответ' },
];

interface Props {
  section: SectionData;
  updateSection: (id: string, updates: Partial<SectionData>) => void;
  deleteSection: (id: string) => void;
  updateQuestion: (qId: string, updates: Partial<QuestionData>) => void;
  deleteQuestion: (qId: string) => void;
  onAddQuestion: (sectionId: string, type: string) => void;
}

export const SectionBlock = ({ section, updateSection, deleteSection, updateQuestion, deleteQuestion, onAddQuestion }: Props) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: {
      type: 'Section',
      section
    }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const questions = section?.questions || [];

  return (
    <div ref={setNodeRef} style={style} className={`bg-indigo-500/10 dark:bg-indigo-500/5 backdrop-blur-md rounded-3xl p-6 border transition-colors shadow-xl flex flex-col gap-4 relative ${showTypeMenu ? 'border-white/50 dark:border-white/40 z-[100]' : 'border-indigo-400/40 dark:border-indigo-400/20 hover:border-indigo-400/50 z-10'}`}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div {...attributes} {...listeners} className="cursor-grab hover:bg-white/10 p-2 rounded-xl mt-1">
          <GripVertical size={24} className="opacity-50" />
        </div>
        <div className="flex-1 space-y-2">
          <input
            value={section.title}
            onChange={e => updateSection(section.id, { title: e.target.value })}
            className="text-xl font-bold bg-transparent border-b-2 border-transparent hover:border-indigo-500/30 focus:border-indigo-500/50 outline-none w-full transition-colors"
            placeholder="Название раздела"
          />
          <textarea
            value={section.description}
            onChange={e => updateSection(section.id, { description: e.target.value })}
            placeholder="Краткое описание раздела..."
            className="text-sm bg-transparent border-b-2 border-transparent hover:border-indigo-500/30 focus:border-indigo-500/50 outline-none w-full resize-y min-h-[40px] opacity-80 transition-colors"
          />
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </button>
        <button onClick={() => deleteSection(section.id)} className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors shrink-0">
          <Trash2 size={20} />
        </button>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="md:pl-12 pt-4 space-y-4">
          <SortableContext items={questions.map(q => q.id || (q as any)._id)} strategy={verticalListSortingStrategy}>
            {questions.length === 0 ? (
              <div className="p-8 text-center text-sm opacity-50 border-2 border-dashed border-white/20 rounded-2xl">
                В этом разделе пока нет вопросов. Выберите тип вопроса ниже.
              </div>
            ) : (
              questions.map(q => (
                <QuestionBlock key={q.id} question={q} updateQuestion={updateQuestion} deleteQuestion={deleteQuestion} />
              ))
            )}
          </SortableContext>

          <div className="relative mt-4">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="w-full py-4 rounded-xl border-2 border-dashed border-indigo-400/40 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2 font-bold text-sm text-indigo-700 dark:text-indigo-300"
            >
              <Plus size={18} /> Добавить вопрос в этот раздел
            </button>

            {showTypeMenu && (
              <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 md:p-8 w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Выберите тип вопроса</h3>
                    <button onClick={() => setShowTypeMenu(false)} className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {QUESTION_TYPES.map(qt => (
                      <button
                        key={qt.type}
                        onClick={() => { onAddQuestion(section.id, qt.type); setShowTypeMenu(false); }}
                        className="text-left px-5 py-4 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3 border border-white/5 hover:border-white/20"
                      >
                        {qt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};