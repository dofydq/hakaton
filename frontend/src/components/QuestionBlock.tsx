import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { Trash2, GripVertical, Plus, X, Star, Info, Settings } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
  points: number;
}

export interface QuestionData {
  id: string;
  type: string;
  title: string;
  description?: string;
  options?: QuestionOption[];
  isRequired?: boolean;
  shuffleOptions?: boolean;
}

interface Props {
  question: QuestionData;
  updateQuestion: (qId: string, updates: Partial<QuestionData>) => void;
  deleteQuestion: (qId: string) => void;
}

// Вспомогательный компонент для инпута, обновляющего родительский стейт только по onBlur
function TitleInput({ title, updateTitle }: { title: string; updateTitle: (t: string) => void }) {
  const [localTitle, setLocalTitle] = useState(title);
  useEffect(() => { setLocalTitle(title); }, [title]);
  return (
    <input
      value={localTitle}
      onChange={e => setLocalTitle(e.target.value)}
      onBlur={() => updateTitle(localTitle)}
      placeholder="Введите ваш вопрос"
      className="text-lg font-semibold bg-transparent border-b-2 border-transparent hover:border-blue-500/30 focus:border-blue-500/50 outline-none w-full transition-colors pb-1"
    />
  );
}

function OptionRow({ 
  option, idx, update, remove 
}: { 
  option: QuestionOption; idx: number; 
  update: (idx: number, updates: Partial<QuestionOption>) => void; 
  remove: (idx: number) => void; 
}) {
  const [localText, setLocalText] = useState(option.text);
  const [localPoints, setLocalPoints] = useState(option.points.toString());

  useEffect(() => { setLocalText(option.text); }, [option.text]);
  useEffect(() => { setLocalPoints(option.points.toString()); }, [option.points]);

  const handleBlurPoints = () => {
    update(idx, { points: parseInt(localPoints, 10) || 0 });
  };

  return (
    <div className={`flex items-center gap-3 bg-white/10 dark:bg-black/10 p-2 pl-4 rounded-xl border transition-all ${option.points > 0 ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 dark:border-white/5'}`}>
      <input
        type="checkbox"
        checked={option.is_correct}
        onChange={(e) => update(idx, { is_correct: e.target.checked })}
        className="w-5 h-5 rounded-md accent-blue-500 cursor-pointer shrink-0"
      />
      <input
        value={localText}
        onChange={e => setLocalText(e.target.value)}
        onBlur={() => update(idx, { text: localText })}
        className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
        placeholder={`Вариант ${idx + 1}`}
      />
      
      <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg shrink-0">
        <span className="text-xs uppercase tracking-widest opacity-60 font-semibold flex items-center gap-1">
          {option.points > 0 && <Star size={12} className="text-green-500" />} Баллы
        </span>
        <input
          type="number"
          min="0"
          value={localPoints}
          onChange={e => setLocalPoints(e.target.value)}
          onBlur={handleBlurPoints}
          className="w-16 bg-white/20 dark:bg-black/20 text-center rounded-md border-none outline-none focus:ring-2 focus:ring-blue-500/50 text-sm py-1 font-bold"
        />
      </div>

      <button onClick={() => remove(idx)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

export const QuestionBlock = ({ question, updateQuestion, deleteQuestion }: Props) => {
  const [showSettings, setShowSettings] = useState(false);

  // Инициализация options при отсутствии (для обратной совместимости)
  useEffect(() => {
    if (['single_choice', 'multiple_choice', 'dropdown', 'yes_no'].includes(question.type) && !question.options) {
      updateQuestion(question.id, {
        options: [
          { id: `opt_${Date.now()}_1`, text: 'Вариант 1', is_correct: false, points: 0 },
          { id: `opt_${Date.now()}_2`, text: 'Вариант 2', is_correct: false, points: 0 }
        ]
      });
    }
  }, [question.type, question.options, question.id, updateQuestion]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
    data: { type: 'Question', question }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1, // Fixes stacking during drag
  };

  const addOption = () => {
    const opts = question.options || [];
    updateQuestion(question.id, {
      options: [...opts, { id: `opt_${Date.now()}_${Math.random()}`, text: `Вариант ${opts.length + 1}`, is_correct: false, points: 0 }]
    });
  };

  const updateOption = (idx: number, optUpdates: Partial<QuestionOption>) => {
    if (!question.options) return;
    const opts = [...question.options];
    opts[idx] = { ...opts[idx], ...optUpdates };
    updateQuestion(question.id, { options: opts });
  };

  const removeOption = (idx: number) => {
    if (!question.options) return;
    const opts = [...question.options];
    opts.splice(idx, 1);
    updateQuestion(question.id, { options: opts });
  };

  const hasOptions = ['single_choice', 'multiple_choice', 'dropdown', 'yes_no'].includes(question.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/30 dark:border-white/10 mb-4 shadow-lg flex flex-col md:flex-row gap-4 transition-all group relative"
    >
      {/* Ручка для Drag-and-drop */}
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab hover:bg-white/10 p-2 rounded-xl h-fit self-start shrink-0"
      >
        <GripVertical size={24} className="opacity-40 hover:opacity-100" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-4 mb-4">
          <div className="flex-1 w-full min-w-[200px]">
             <TitleInput title={question.title} updateTitle={(t) => updateQuestion(question.id, { title: t })} />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl transition-all ${showSettings ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-black/10 dark:hover:bg-white/10'} hover:rotate-90 origin-center duration-300`}
              title="Настройки вопроса"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={() => deleteQuestion(question.id)} 
              className="text-red-500/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 p-2.5 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Удалить карточку"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Выезжающие настройки вопроса */}
        {showSettings && (
          <div className="mb-6 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                 type="checkbox" 
                 checked={question.isRequired ?? false}
                 onChange={e => updateQuestion(question.id, { isRequired: e.target.checked })}
                 className="w-4 h-4 accent-blue-500 rounded"
              />
              <span className="text-sm font-medium">Обязательный вопрос</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                 type="checkbox" 
                 checked={question.shuffleOptions ?? false}
                 onChange={e => updateQuestion(question.id, { shuffleOptions: e.target.checked })}
                 className="w-4 h-4 accent-blue-500 rounded"
              />
              <span className="text-sm font-medium">Перемешивать ответы</span>
            </label>
            {/* Дополнительные глобальные настройки баллов могут быть тут */}
          </div>
        )}

        {/* Плейсхолдер для типов без явных пользовательских вариантов ответа */}
        {!hasOptions && (
          <div className="mt-2 p-5 rounded-2xl border border-dashed border-slate-400/40 bg-white/5 opacity-80 flex flex-col items-center justify-center text-center gap-3">
            <Info size={24} className="opacity-40" />
            <p className="text-sm max-w-sm"><i>Пользователю будет предложен системный интерфейс для этого типа (слайдер, шкала, ввод даты/числа).</i></p>
          </div>
        )}

        {/* Варианты ответов */}
        {hasOptions && (
          <div className="space-y-3 mt-2">
            {(question.options || []).map((opt, idx) => (
              <OptionRow 
                key={opt.id || idx} 
                option={opt} 
                idx={idx} 
                update={updateOption} 
                remove={removeOption} 
              />
            ))}

            <button
              onClick={addOption}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2.5 rounded-xl transition-all"
            >
              <Plus size={16} /> Добавить вариант
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
