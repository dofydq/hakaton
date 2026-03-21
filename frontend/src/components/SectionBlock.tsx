
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
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex flex-col gap-5 rounded-[2rem] border p-4 shadow-xl backdrop-blur-md transition-colors md:p-6 ${showTypeMenu ? 'z-[100] border-white/50 bg-indigo-500/10 dark:border-white/40 dark:bg-indigo-500/5' : 'z-10 border-indigo-400/40 bg-indigo-500/10 hover:border-indigo-400/50 dark:border-indigo-400/20 dark:bg-indigo-500/5'}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-75 transition hover:bg-white/15"
        >
          <GripVertical size={18} className="opacity-70" />
          <span>Раздел</span>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              Вопросов: {questions.length}
            </span>
            {!isExpanded ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs opacity-60">
                Свернуто
              </span>
            ) : null}
          </div>

          <input
            value={section.title}
            onChange={e => updateSection(section.id, { title: e.target.value })}
            className="w-full border-b-2 border-transparent bg-transparent text-xl font-bold outline-none transition-colors hover:border-indigo-500/30 focus:border-indigo-500/50"
            placeholder="Название раздела"
          />
          <textarea
            value={section.description}
            onChange={e => updateSection(section.id, { description: e.target.value })}
            placeholder="Краткое описание раздела..."
            className="min-h-[64px] w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm opacity-85 outline-none transition-colors focus:border-indigo-400/40"
          />
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/15"
            title={isExpanded ? 'Свернуть раздел' : 'Развернуть раздел'}
          >
            <span className="flex items-center gap-2">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              <span className="hidden sm:inline">{isExpanded ? 'Свернуть' : 'Развернуть'}</span>
            </span>
          </button>
          <button
            onClick={() => deleteSection(section.id)}
            className="rounded-2xl px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
            title="Удалить раздел"
          >
            <span className="flex items-center gap-2">
              <Trash2 size={18} />
              <span className="hidden sm:inline">Удалить</span>
            </span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 md:pl-12">
          <SortableContext items={questions.map(q => q.id || (q as any)._id)} strategy={verticalListSortingStrategy}>
            {questions.length === 0 ? (
              <div className="rounded-[1.5rem] border-2 border-dashed border-white/20 bg-white/5 p-8 text-center">
                <p className="text-base font-semibold">В разделе пока нет вопросов</p>
                <p className="mt-2 text-sm opacity-65">
                  Нажмите кнопку ниже и выберите подходящий тип вопроса для клиента.
                </p>
              </div>
            ) : (
              questions.map(q => (
                <QuestionBlock key={q.id} question={q} updateQuestion={updateQuestion} deleteQuestion={deleteQuestion} />
              ))
            )}
          </SortableContext>

          <div className="relative mt-2">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-400/40 bg-white/5 px-4 py-4 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-500/10 dark:text-indigo-300"
            >
              <Plus size={18} /> Добавить вопрос в этот раздел
            </button>

            {showTypeMenu && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="relative w-full max-w-2xl rounded-[2rem] border border-white/20 bg-slate-900 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:p-8">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Выберите тип вопроса</h3>
                      <p className="mt-2 text-sm text-white/60">
                        Новый вопрос сразу появится в текущем разделе и будет доступен для редактирования.
                      </p>
                    </div>
                    <button onClick={() => setShowTypeMenu(false)} className="rounded-xl p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {QUESTION_TYPES.map(qt => (
                      <button
                        key={qt.type}
                        onClick={() => { onAddQuestion(section.id, qt.type); setShowTypeMenu(false); }}
                        className="rounded-2xl border border-white/10 px-5 py-4 text-left text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10"
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
