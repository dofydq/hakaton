'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Save, ArrowLeft, Loader2, Download, Upload, Plus, Eye, PencilLine } from 'lucide-react';
import toast from 'react-hot-toast';

import { SectionBlock, SectionData } from '@/components/SectionBlock';
import { QuestionData } from '@/components/QuestionBlock';
import { GlassButton } from '@/components/ui/GlassButton';
import { api } from '@/lib/api';

const OPTION_TYPES = ['single_choice', 'multiple_choice', 'dropdown', 'yes_no'];

export default function ConstructorPage() {
  const { id } = useParams();
  const router = useRouter();

  const [title, setTitle] = useState('Новый тест');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<SectionData[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (id && id !== 'new') {
      api.get(`/tests/${id}`)
        .then((res: any) => {
          const data = res.data;
          setTitle(data.title);
          setDescription(data.description || '');
          if (data.logic_tree_json && Array.isArray(data.logic_tree_json)) {
            const safeSections = data.logic_tree_json.map((s: any) => ({
              ...s,
              questions: Array.isArray(s.questions) ? s.questions : []
            }));
            setSections(safeSections);
          }
        })
        .catch((err: any) => {
          console.error(err);
          toast.error('Не удалось загрузить тест');
        })
        .finally(() => setLoading(false));
    } else {
      setSections([{
        id: `s_${Date.now()}`,
        title: 'Основной раздел',
        description: '',
        questions: []
      }]);
      setLoading(false);
    }
  }, [id]);

  const addSection = () => {
    setSections([...sections, {
      id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: `Новый раздел ${sections.length + 1}`,
      description: '',
      questions: []
    }]);
  };

  const updateSection = (secId: string, updates: Partial<SectionData>) => {
    setSections(prev => prev.map(s => s.id === secId ? { ...s, ...updates } : s));
  };

  const deleteSection = (secId: string) => {
    if (confirm('Удалить раздел и все вопросы в нем?')) {
      setSections(prev => prev.filter(s => s.id !== secId));
    }
  };

  const addQuestion = (sectionId: string, type: string) => {
    const now = Date.now();
    const newQ: QuestionData = {
      id: `q_${now}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      title: 'Новый вопрос',
      description: '',
      options: OPTION_TYPES.includes(type) ? [
        { id: `opt_${now}_1`, text: type === 'yes_no' ? 'Да' : 'Вариант 1', is_correct: false, points: 0 },
        { id: `opt_${now}_2`, text: type === 'yes_no' ? 'Нет' : 'Вариант 2', is_correct: false, points: 0 }
      ] : []
    };
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, questions: [...s.questions, newQ] } : s));
  };

  const updateQuestion = (qId: string, updates: Partial<QuestionData>) => {
    setSections(prev => prev.map(s => ({
      ...s,
      questions: s.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
    })));
  };

  const deleteQuestion = (qId: string) => {
    setSections(prev => prev.map(s => ({
      ...s,
      questions: s.questions.filter(q => q.id !== qId)
    })));
  };

  const findSectionOfQuestion = (qId: string) => {
    return sections.find(s => s.questions.some(q => q.id === qId))?.id;
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    const overId = over?.id;
    if (!overId) return;

    const activeSectionId = findSectionOfQuestion(active.id as string);
    const overSectionId = findSectionOfQuestion(overId as string) || (sections.some(s => s.id === overId) ? overId as string : null);

    if (!activeSectionId || !overSectionId || activeSectionId === overSectionId) {
      return;
    }

    setSections(prev => {
      const activeSectionIndex = prev.findIndex(s => s.id === activeSectionId);
      const overSectionIndex = prev.findIndex(s => s.id === overSectionId);
      const activeItems = [...prev[activeSectionIndex].questions];
      const overItems = [...prev[overSectionIndex].questions];
      const activeIndex = activeItems.findIndex(q => q.id === active.id);
      let overIndex = overItems.findIndex(q => q.id === overId);

      if (overId === overSectionId) {
        overIndex = overItems.length;
      }

      const [moved] = activeItems.splice(activeIndex, 1);
      const isBelow = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
      const modifier = isBelow ? 1 : 0;
      const insertIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      overItems.splice(insertIndex, 0, moved);

      const newSections = [...prev];
      newSections[activeSectionIndex] = { ...newSections[activeSectionIndex], questions: activeItems };
      newSections[overSectionIndex] = { ...newSections[overSectionIndex], questions: overItems };
      return newSections;
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    if (sections.some(s => s.id === activeId)) {
      if (activeId !== overId) {
        setSections(prev => {
          const oldI = prev.findIndex(s => s.id === activeId);
          const newI = prev.findIndex(s => s.id === overId);
          return arrayMove(prev, oldI, newI);
        });
      }
      return;
    }

    const activeSectionId = findSectionOfQuestion(activeId);
    if (activeSectionId && activeSectionId === findSectionOfQuestion(overId)) {
      setSections(prev => {
        const secI = prev.findIndex(s => s.id === activeSectionId);
        const questions = [...prev[secI].questions];
        const oldI = questions.findIndex(q => q.id === activeId);
        const newI = questions.findIndex(q => q.id === overId);
        const newSecs = [...prev];
        newSecs[secI] = { ...newSecs[secI], questions: arrayMove(questions, oldI, newI) };
        return newSecs;
      });
    }
  };

  const saveTest = async () => {
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        access_settings_json: {},
        logic_tree_json: sections,
        calculation_rules_json: {}
      };

      if (id === 'new') {
        const res = await api.post('/tests/', payload);
        toast.success('Тест успешно создан');
        router.push(`/dashboard/constructor/${res.data.id}`);
      } else {
        await api.put(`/tests/${id}`, payload);
        toast.success('Тест успешно сохранен');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при сохранении теста');
    } finally {
      setSaving(false);
    }
  };

  const exportJSON = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sections, null, 2))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${title}_config.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setSections(json);
          toast.success('JSON успешно загружен');
        } else {
          toast.error('Неверный формат JSON');
        }
      } catch (err) {
        toast.error('Ошибка при чтении JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalQuestions = sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0);

  const renderPreviewQuestion = (question: QuestionData) => {
    if (OPTION_TYPES.includes(question.type)) {
      return (
        <div className="mt-5 space-y-3">
          {(question.options || []).map((option) => (
            <div key={option.id} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium">
              {option.text || 'Без текста'}
            </div>
          ))}
        </div>
      );
    }

    const placeholders: Record<string, string> = {
      text: 'Поле для свободного ответа',
      number: 'Поле для ввода числа',
      scale: 'Шкала оценки от 1 до 10',
      slider: 'Слайдер диапазона',
      date: 'Выбор даты и времени',
    };

    return (
      <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm opacity-75">
        {placeholders[question.type] || 'Интерфейс ответа для этого типа вопроса'}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white/5">
      <header className="flex-none border-b-2 border-white/10 dark:border-black/20 bg-white/10 dark:bg-black/10 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
              <GlassButton onClick={() => router.push('/dashboard')} className="!p-3 !px-4 !rounded-2xl shrink-0 flex items-center gap-2" title="На дашборд">
                <ArrowLeft size={20} /> <span className="hidden sm:inline font-medium text-sm">Назад</span>
              </GlassButton>

              <div className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-transparent text-xl font-bold outline-none md:text-2xl"
                  placeholder="Заголовок теста"
                />
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Кратко опишите тест для клиента"
                  className="mt-2 min-h-[52px] w-full resize-none bg-transparent text-sm opacity-80 outline-none md:text-base"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <input type="file" id="import-json" accept=".json" className="hidden" onChange={importJSON} />

              <GlassButton onClick={() => setIsPreview(prev => !prev)} className="!p-2 !px-4 text-sm font-medium flex items-center gap-2 bg-white/15 hover:bg-white/25">
                {isPreview ? <PencilLine size={18} /> : <Eye size={18} />}
                <span>{isPreview ? 'Вернуться к редактированию' : 'Предпросмотр'}</span>
              </GlassButton>

              <GlassButton onClick={() => document.getElementById('import-json')?.click()} className="!p-2 !px-4 text-sm font-medium flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-white">
                <Upload size={18} /> <span className="hidden md:inline">Импорт JSON</span>
              </GlassButton>

              <GlassButton onClick={exportJSON} className="!p-2 !px-4 text-sm font-medium flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-white">
                <Download size={18} /> <span className="hidden md:inline">Экспорт JSON</span>
              </GlassButton>

              <GlassButton onClick={saveTest} disabled={saving} className="flex gap-2 items-center bg-blue-500/80 hover:bg-blue-600/90 text-white font-semibold shadow-blue-500/30 py-2 px-5">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span className="hidden sm:inline">{saving ? 'Сохранение...' : 'Сохранить тест'}</span>
              </GlassButton>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] opacity-60">
            <span>Разделов: {sections.length}</span>
            <span>Вопросов: {totalQuestions}</span>
            <span>{isPreview ? 'Режим просмотра клиента' : 'Режим редактирования'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-5xl pb-24">
          {isPreview ? (
            <div className="space-y-8">
              <section className="rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl md:p-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] opacity-60">Предпросмотр для клиента</p>
                <h1 className="text-3xl font-black md:text-4xl">{title || 'Без названия'}</h1>
                <p className="mt-4 max-w-3xl text-sm opacity-75 md:text-base">{description || 'Описание теста пока не заполнено.'}</p>
              </section>

              {sections.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center opacity-70 backdrop-blur-md">
                  Добавьте хотя бы один раздел, чтобы увидеть предпросмотр теста.
                </div>
              ) : (
                sections.map((section, sectionIndex) => (
                  <section key={section.id} className="rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-2xl md:p-8">
                    <div className="mb-6 border-b border-white/10 pb-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] opacity-50">Раздел {sectionIndex + 1}</p>
                      <h2 className="text-2xl font-bold">{section.title || 'Без названия раздела'}</h2>
                      {section.description ? <p className="mt-3 text-sm opacity-75 md:text-base">{section.description}</p> : null}
                    </div>

                    <div className="space-y-5">
                      {section.questions?.length ? (
                        section.questions.map((question, questionIndex) => (
                          <article key={question.id} className="rounded-[1.5rem] border border-white/15 bg-white/5 p-5 backdrop-blur-md">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                                Вопрос {questionIndex + 1}
                              </span>
                              {question.isRequired ? (
                                <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                                  Обязательный
                                </span>
                              ) : null}
                            </div>
                            <h3 className="mt-4 text-lg font-bold md:text-xl">{question.title || 'Без заголовка'}</h3>
                            {question.description ? <p className="mt-2 text-sm opacity-70">{question.description}</p> : null}
                            {renderPreviewQuestion(question)}
                          </article>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm opacity-65">
                          В этом разделе пока нет вопросов.
                        </div>
                      )}
                    </div>
                  </section>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 text-sm opacity-75 backdrop-blur-md">
                Перетаскивайте разделы и вопросы, редактируйте текст прямо в карточках и используйте предпросмотр, чтобы быстро проверить клиентский вид.
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-8">
                  <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {sections.map(section => (
                      <SectionBlock
                        key={section.id}
                        section={section}
                        updateSection={updateSection}
                        deleteSection={deleteSection}
                        updateQuestion={updateQuestion}
                        deleteQuestion={deleteQuestion}
                        onAddQuestion={addQuestion}
                      />
                    ))}
                  </SortableContext>
                </div>
              </DndContext>

              <GlassButton onClick={addSection} className="w-full mt-10 py-5 border-2 border-dashed border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-colors">
                <Plus size={22} /> Добавить новый раздел
              </GlassButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
