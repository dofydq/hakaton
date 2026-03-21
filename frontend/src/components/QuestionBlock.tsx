import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { Trash2, GripVertical, Plus, X, Star, Info, Settings } from 'lucide-react';

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
  points: number;   // Балл за этот вариант
  weight?: number;  // Вес (множитель, float, может быть отрицательным)
  scale_tag?: string; // Тег шкалы, которой принадлежит этот вариант
}

export interface QuestionData {
  id: string;
  type: string;
  title: string;
  description?: string;
  options?: QuestionOption[];
  isRequired?: boolean;
  shuffleOptions?: boolean;
  scale_tag?: string; // Шкала, которой принадлежит весь вопрос (default: 'default')
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
      placeholder="Р’РІРµРґРёС‚Рµ С‚РµРєСЃС‚ РІРѕРїСЂРѕСЃР°"
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
      placeholder="РџРѕРґСЃРєР°Р·РєР° РёР»Рё РѕРїРёСЃР°РЅРёРµ РґР»СЏ РєР»РёРµРЅС‚Р°"
      className="min-h-[72px] w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors placeholder:opacity-50 focus:border-blue-500/40"
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
  const [localPoints, setLocalPoints] = useState(String(option.points ?? 0));
  const [localWeight, setLocalWeight] = useState(String(option.weight ?? 1));
  const [localScale, setLocalScale] = useState(option.scale_tag ?? '');

  useEffect(() => { setLocalText(option.text); }, [option.text]);
  useEffect(() => { setLocalPoints(String(option.points ?? 0)); }, [option.points]);
  useEffect(() => { setLocalWeight(String(option.weight ?? 1)); }, [option.weight]);
  useEffect(() => { setLocalScale(option.scale_tag ?? ''); }, [option.scale_tag]);

  return (
    <div className={`rounded-2xl border p-3 transition-all ${
      (option.points ?? 0) !== 0 ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 bg-white/5 dark:bg-black/10'
    }`}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={localText}
            onChange={e => setLocalText(e.target.value)}
            onBlur={() => update(idx, { text: localText })}
            className="min-w-0 flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium outline-none ring-1 ring-transparent transition focus:ring-blue-500/40"
            placeholder={`Вариант ${idx + 1}`}
          />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-black/5 px-2 py-2 dark:bg-white/5" title="Балл (может быть отрицательным или дробным)">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 whitespace-nowrap">Балл</span>
              <input
                type="number"
                step="0.1"
                value={localPoints}
                onChange={e => setLocalPoints(e.target.value)}
                onBlur={() => update(idx, { points: parseFloat(localPoints) || 0 })}
                className="w-16 rounded-lg bg-white/20 py-1 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-black/20"
              />
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-black/5 px-2 py-2 dark:bg-white/5" title="Вес (множитель, float)">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">×</span>
              <input
                type="number"
                step="0.1"
                value={localWeight}
                onChange={e => setLocalWeight(e.target.value)}
                onBlur={() => update(idx, { weight: parseFloat(localWeight) || 1 })}
                className="w-14 rounded-lg bg-white/20 py-1 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/50 dark:bg-black/20"
              />
            </div>
          </div>

          <button
            onClick={() => remove(idx)}
            className="self-end rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500 md:self-auto"
            title="Удалить вариант"
          >
            <X size={16} />
          </button>
        </div>

        {/* Шкала варианта */}
        <div className="flex items-center gap-2 pl-1">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 whitespace-nowrap">Шкала</span>
          <input
            value={localScale}
            onChange={e => setLocalScale(e.target.value)}
            onBlur={() => update(idx, { scale_tag: localScale || undefined })}
            placeholder="anxiety, logic, lie... (необязательно)"
            className="flex-1 rounded-lg bg-white/5 px-2 py-1 text-xs outline-none ring-1 ring-transparent focus:ring-violet-500/40 font-mono"
          />
        </div>
      </div>
    </div>
  );
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  text: 'РўРµРєСЃС‚РѕРІС‹Р№ РѕС‚РІРµС‚',
  single_choice: 'РћРґРёРЅ РІС‹Р±РѕСЂ',
  multiple_choice: 'РњРЅРѕР¶РµСЃС‚РІРµРЅРЅС‹Р№ РІС‹Р±РѕСЂ',
  dropdown: 'РЎРїРёСЃРѕРє РІР°СЂРёР°РЅС‚РѕРІ',
  yes_no: 'Р”Р° / РќРµС‚',
  scale: 'РЁРєР°Р»Р°',
  slider: 'РЎР»Р°Р№РґРµСЂ',
  date: 'Р”Р°С‚Р° / Р’СЂРµРјСЏ',
  number: 'Р§РёСЃР»РѕРІРѕР№ РѕС‚РІРµС‚',
};

export const QuestionBlock = ({ question, updateQuestion, deleteQuestion }: Props) => {
  const [showSettings, setShowSettings] = useState(false);
  const controlButtonClass = 'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all';

  useEffect(() => {
    if (['single_choice', 'multiple_choice', 'dropdown', 'yes_no'].includes(question.type) && !question.options) {
      updateQuestion(question.id, {
        options: [
          { id: `opt_${Date.now()}_1`, text: 'Р’Р°СЂРёР°РЅС‚ 1', is_correct: false, points: 0 },
          { id: `opt_${Date.now()}_2`, text: 'Р’Р°СЂРёР°РЅС‚ 2', is_correct: false, points: 0 }
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
      options: [...opts, { id: `opt_${Date.now()}_${Math.random()}`, text: `Р’Р°СЂРёР°РЅС‚ ${opts.length + 1}`, is_correct: false, points: 0 }]
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
      className="group relative flex flex-col gap-5 rounded-[2rem] border border-white/20 bg-white/20 p-4 shadow-lg backdrop-blur-md transition-all dark:border-white/10 dark:bg-black/20 md:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-75 transition hover:bg-white/15"
        >
          <GripVertical size={18} className="opacity-70" />
          <span>РџРµСЂРµС‚Р°С‰РёС‚СЊ</span>
        </div>

        <div className="min-w-0 flex-[1.18] space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-75">
              {QUESTION_TYPE_LABELS[question.type] || question.type}
            </span>
            {question.isRequired ? (
              <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                РћР±СЏР·Р°С‚РµР»СЊРЅС‹Р№
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex h-10 items-center gap-2 self-start">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`${controlButtonClass} ${showSettings ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/15 dark:bg-white/5'}`}
            title="РќР°СЃС‚СЂРѕР№РєРё РІРѕРїСЂРѕСЃР°"
          >
            <span className="flex items-center justify-center gap-2">
              <Settings size={16} />
              <span className="hidden sm:inline">РќР°СЃС‚СЂРѕР№РєРё</span>
            </span>
          </button>
          <button
            onClick={() => deleteQuestion(question.id)}
            className={`${controlButtonClass} text-red-300 hover:bg-red-500/10 hover:text-red-200`}
            title="РЈРґР°Р»РёС‚СЊ РІРѕРїСЂРѕСЃ"
          >
            <span className="flex items-center justify-center gap-2">
              <Trash2 size={16} />
              <span className="hidden sm:inline">РЈРґР°Р»РёС‚СЊ</span>
            </span>
          </button>
        </div>
      </div>

      <div className="w-full space-y-4 md:pl-12">
        <TitleInput title={question.title} updateTitle={(t) => updateQuestion(question.id, { title: t })} />
        <DescriptionInput
          description={question.description}
          updateDescription={(t) => updateQuestion(question.id, { description: t })}
        />

        {showSettings && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/5 p-4 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
            {/* Шкала вопроса */}
            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
              <span className="text-sm font-medium whitespace-nowrap">Шкала вопроса</span>
              <input
                type="text"
                placeholder="default, anxiety, logic, lie..."
                value={question.scale_tag ?? ''}
                onChange={e => updateQuestion(question.id, { scale_tag: e.target.value || undefined })}
                className="flex-1 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-mono outline-none ring-1 ring-transparent focus:ring-violet-500/40 dark:bg-black/20"
              />
            </div>
            {question.scale_tag && (
              <p className="text-xs opacity-50 px-1">Вопрос будет засчитываться в шкалу <code className="font-mono">{question.scale_tag}</code>. Варианты ответа могут переопределять шкалу.</p>
            )}
          </div>
        )}

        {!hasOptions && (
          <div className="flex w-full flex-col items-stretch gap-3 rounded-2xl border border-dashed border-slate-400/30 bg-white/5 p-5 opacity-80">
            <Info size={24} className="self-center opacity-40" />
            <p className="w-full text-sm">
              Р”Р»СЏ СЌС‚РѕРіРѕ С‚РёРїР° РІРѕРїСЂРѕСЃР° РєР»РёРµРЅС‚ СѓРІРёРґРёС‚ СЃС‚Р°РЅРґР°СЂС‚РЅС‹Р№ РёРЅС‚РµСЂС„РµР№СЃ РІРІРѕРґР°. Р—РґРµСЃСЊ РґРѕСЃС‚Р°С‚РѕС‡РЅРѕ РЅР°СЃС‚СЂРѕРёС‚СЊ С‚РµРєСЃС‚ РІРѕРїСЂРѕСЃР° Рё РѕР±С‰РёРµ РїР°СЂР°РјРµС‚СЂС‹.
            </p>
          </div>
        )}

        {hasOptions && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">Р’Р°СЂРёР°РЅС‚С‹ РѕС‚РІРµС‚Р°</p>
              <button
                onClick={addOption}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition-all hover:bg-blue-500/20"
              >
                <Plus size={16} /> Р”РѕР±Р°РІРёС‚СЊ РІР°СЂРёР°РЅС‚
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
  );
};
