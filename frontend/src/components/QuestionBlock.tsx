import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { Trash2, GripVertical, Plus, X, Star, Info, Settings } from 'lucide-react';

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

function TitleInput({ title, updateTitle }: { title: string; updateTitle: (t: string) => void }) {
  const [localTitle, setLocalTitle] = useState(title);
  useEffect(() => { setLocalTitle(title); }, [title]);

  return (
    <input
      value={localTitle}
      onChange={e => setLocalTitle(e.target.value)}
      onBlur={() => updateTitle(localTitle)}
      placeholder="Введите текст вопроса"
      className="w-full border-b-2 border-transparent bg-transparent pb-2 text-lg font-semibold outline-none transition-colors hover:border-blue-500/30 focus:border-blue-500/50 md:text-xl"
    />
  );
}

function DescriptionInput({
  description,
  updateDescription
}: {
  description?: string;
  updateDescription: (t: string) => void;
}) {
  const [localDescription, setLocalDescription] = useState(description || '');
  useEffect(() => { setLocalDescription(description || ''); }, [description]);

  return (
    <textarea
      value={localDescription}
      onChange={e => setLocalDescription(e.target.value)}
      onBlur={() => updateDescription(localDescription)}
      placeholder="Подсказка или описание для клиента"
      className="mt-3 min-h-[72px] w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors placeholder:opacity-50 focus:border-blue-500/40"
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
    <div className={`rounded-2xl border p-3 transition-all ${option.points > 0 ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 bg-white/5 dark:bg-black/10'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex items-center gap-3 md:min-w-[120px]">
          <input
            type="checkbox"
            checked={option.is_correct}
            onChange={(e) => update(idx, { is_correct: e.target.checked })}
            className="h-5 w-5 rounded-md accent-blue-500"
          />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">Засчитывать</span>
        </label>

        <input
          value={localText}
          onChange={e => setLocalText(e.target.value)}
          onBlur={() => update(idx, { text: localText })}
          className="min-w-0 flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium outline-none ring-1 ring-transparent transition focus:ring-blue-500/40"
          placeholder={`Вариант ${idx + 1}`}
        />

        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/5 px-3 py-2 dark:bg-white/5 md:justify-start">
          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-65">
            {option.points > 0 && <Star size={12} className="text-green-500" />}
            Баллы
          </span>
          <input
            type="number"
            min="0"
            value={localPoints}
            onChange={e => setLocalPoints(e.target.value)}
            onBlur={handleBlurPoints}
            className="w-20 rounded-lg bg-white/20 py-1 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-black/20"
          />
        </div>

        <button
          onClick={() => remove(idx)}
          className="self-end rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500 md:self-auto"
          title="Удалить вариант"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  text: 'Текстовый ответ',
  single_choice: 'Один выбор',
  multiple_choice: 'Множественный выбор',
  dropdown: 'Список вариантов',
  yes_no: 'Да / Нет',
  scale: 'Шкала',
  slider: 'Слайдер',
  date: 'Дата / Время',
  number: 'Числовой ответ',
};

export const QuestionBlock = ({ question, updateQuestion, deleteQuestion }: Props) => {
  const [showSettings, setShowSettings] = useState(false);

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
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 999 : 1,
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
      className="group relative rounded-[1.75rem] border border-white/20 bg-white/20 p-4 shadow-lg backdrop-blur-md transition-all dark:border-white/10 dark:bg-black/20 md:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:gap-5">
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-75 transition hover:bg-white/15"
        >
          <GripVertical size={18} className="opacity-70" />
          <span>Перетащить</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-75">
                  {QUESTION_TYPE_LABELS[question.type] || question.type}
                </span>
                {question.isRequired ? (
                  <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                    Обязательный
                  </span>
                ) : null}
              </div>
              <TitleInput title={question.title} updateTitle={(t) => updateQuestion(question.id, { title: t })} />
              <DescriptionInput
                description={question.description}
                updateDescription={(t) => updateQuestion(question.id, { description: t })}
              />
            </div>

            <div className="flex items-center gap-2 self-start">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`rounded-2xl px-3 py-2 text-sm font-medium transition-all ${showSettings ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/15 dark:bg-white/5'}`}
                title="Настройки вопроса"
              >
                <span className="flex items-center gap-2">
                  <Settings size={16} />
                  <span className="hidden sm:inline">Настройки</span>
                </span>
              </button>
              <button
                onClick={() => deleteQuestion(question.id)}
                className="rounded-2xl px-3 py-2 text-sm font-medium text-red-300 transition-all hover:bg-red-500/10 hover:text-red-200"
                title="Удалить вопрос"
              >
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Удалить</span>
                </span>
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-black/5 p-4 dark:bg-white/5 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                <input
                  type="checkbox"
                  checked={question.isRequired ?? false}
                  onChange={e => updateQuestion(question.id, { isRequired: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-500"
                />
                <span className="text-sm font-medium">Обязательный вопрос</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                <input
                  type="checkbox"
                  checked={question.shuffleOptions ?? false}
                  onChange={e => updateQuestion(question.id, { shuffleOptions: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-500"
                />
                <span className="text-sm font-medium">Перемешивать ответы</span>
              </label>
            </div>
          )}

          {!hasOptions && (
            <div className="mt-2 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-400/30 bg-white/5 p-5 text-center opacity-80">
              <Info size={24} className="opacity-40" />
              <p className="max-w-md text-sm">
                Для этого типа вопроса клиент увидит стандартный интерфейс ввода. Здесь достаточно настроить текст вопроса и общие параметры.
              </p>
            </div>
          )}

          {hasOptions && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">Варианты ответа</p>
                <button
                  onClick={addOption}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition-all hover:bg-blue-500/20"
                >
                  <Plus size={16} /> Добавить вариант
                </button>
              </div>

              {(question.options || []).map((opt, idx) => (
                <OptionRow
                  key={opt.id || idx}
                  option={opt}
                  idx={idx}
                  update={updateOption}
                  remove={removeOption}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
