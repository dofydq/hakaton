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
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reportConfig, setReportConfig] = useState({
    show_table: true,
    show_chart: false,
    show_interpretation: true
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toolbarButtonClass = '!h-11 !px-5 !py-0 min-w-[132px] text-sm font-semibold flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-xl transition-all hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25';
  const primaryToolbarButtonClass = '!h-11 !px-6 !py-0 min-w-[132px] text-sm font-bold flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/20 text-white shadow-lg backdrop-blur-xl transition-all hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 disabled:opacity-70';

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
          if (data.report_config) {
            setReportConfig(data.report_config);
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
        calculation_rules_json: {},
        report_config: reportConfig
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

    if (question.type === 'scale') {
      return (
        <div className="mt-5 rounded-[1.5rem] border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {Array.from({ length: 10 }, (_, index) => (
              <div
                key={index}
                className="flex aspect-square items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sm font-semibold text-white/80 shadow-sm"
              >
                {index + 1}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs uppercase tracking-[0.18em] text-white/45">
            <span>Минимум</span>
            <span>Максимум</span>
          </div>
        </div>
      );
    }

    if (question.type === 'slider') {
      return (
        <div className="mt-5 rounded-[1.5rem] border border-white/15 bg-white/5 p-5 backdrop-blur-sm">
          <div className="relative mx-1 h-3 rounded-full bg-white/10">
            <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-blue-400/45" />
            <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-white/80 shadow-[0_6px_18px_rgba(0,0,0,0.22)]" />
          </div>
          <div className="mt-4 flex justify-between text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            <span>Мин</span>
            <span>Среднее</span>
            <span>Макс</span>
          </div>
        </div>
      );
    }

    const placeholders: Record<string, string> = {
      text: 'Поле для свободного ответа',
      number: 'Поле для ввода числа',
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#020617] via-[#111827] to-[#1f2937] text-white">
      <header className="flex-none border-b border-white/10 bg-black/20 backdrop-blur-2xl shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <GlassButton onClick={() => router.push('/dashboard')} className={toolbarButtonClass} title="На дашборд">
                <ArrowLeft size={18} /> <span className="font-medium text-sm">Назад</span>
              </GlassButton>

              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-2xl shadow-lg">
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold leading-tight tracking-tight text-white outline-none placeholder:text-white/35 md:text-xl"
                  placeholder="Заголовок теста"
                />
                </div>
                <button
                  type="button"
                  onClick={() => setIsDescriptionModalOpen(true)}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white shadow-lg backdrop-blur-xl transition-all hover:bg-white/15"
                >
                  {description ? 'Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РѕРїРёСЃР°РЅРёРµ' : 'РћРїРёСЃР°РЅРёРµ С‚РµСЃС‚Р°'}
                </button>
              </div>
            </div>

            <div className="ml-auto flex shrink-0 flex-wrap items-center gap-3 xl:justify-end">
              <input type="file" id="import-json" accept=".json" className="hidden" onChange={importJSON} />

              <GlassButton onClick={() => setIsPreview(prev => !prev)} className={toolbarButtonClass}>
                {isPreview ? <PencilLine size={18} /> : <Eye size={18} />}
                <span>{isPreview ? 'Редактирование' : 'Предпросмотр'}</span>
              </GlassButton>

              <GlassButton onClick={() => document.getElementById('import-json')?.click()} className={toolbarButtonClass}>
                <Upload size={18} /> <span>Импорт JSON</span>
              </GlassButton>

              <GlassButton onClick={exportJSON} className={toolbarButtonClass}>
                <Download size={18} /> <span>Экспорт JSON</span>
              </GlassButton>

              <GlassButton onClick={saveTest} disabled={saving} className={primaryToolbarButtonClass}>
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{saving ? 'Сохранение...' : 'Сохранить тест'}</span>
              </GlassButton>
            </div>
          </div>

          <div className="hidden xl:pl-[147px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-2xl">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent text-lg font-bold leading-tight tracking-tight text-white outline-none placeholder:text-white/35 md:text-xl"
                placeholder="Р—Р°РіРѕР»РѕРІРѕРє С‚РµСЃС‚Р°"
              />
              <div className="mt-3 border-t border-white/10 pt-3">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Кратко опишите тест для клиента"
                className="min-h-[54px] w-full resize-none bg-transparent text-sm leading-relaxed text-white/72 outline-none placeholder:text-white/30"
              />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/55 xl:pl-[147px]">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Разделов: {sections.length}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Вопросов: {totalQuestions}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{isPreview ? 'Режим просмотра клиента' : 'Режим редактирования'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-5xl pb-24">
          <div className="hidden mb-6 flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Р Р°Р·РґРµР»РѕРІ: {sections.length}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Р’РѕРїСЂРѕСЃРѕРІ: {totalQuestions}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{isPreview ? 'Р РµР¶РёРј РїСЂРѕСЃРјРѕС‚СЂР° РєР»РёРµРЅС‚Р°' : 'Р РµР¶РёРј СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ'}</span>
          </div>

          {isPreview ? (
            <div className="space-y-8">
              <section className="rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl md:p-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/60">Предпросмотр для клиента</p>
                <h1 className="text-3xl font-black md:text-4xl">{title || 'Без названия'}</h1>
                <p className="mt-4 max-w-3xl text-sm text-white/70 md:text-base">{description || 'Описание теста пока не заполнено.'}</p>
              </section>

              {sections.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center text-white/65 backdrop-blur-md">
                  Добавьте хотя бы один раздел, чтобы увидеть предпросмотр теста.
                </div>
              ) : (
                sections.map((section, sectionIndex) => (
                  <section key={section.id} className="rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-2xl md:p-8">
                    <div className="mb-6 border-b border-white/10 pb-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-white/50">Раздел {sectionIndex + 1}</p>
                      <h2 className="text-2xl font-bold">{section.title || 'Без названия раздела'}</h2>
                      {section.description ? <p className="mt-3 text-sm text-white/70 md:text-base">{section.description}</p> : null}
                    </div>

                    <div className="space-y-5">
                      {section.questions?.length ? (
                        section.questions.map((question, questionIndex) => (
                          <article key={question.id} className="rounded-[1.5rem] border border-white/15 bg-white/5 p-5 backdrop-blur-md">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                                Вопрос {questionIndex + 1}
                              </span>
                              {question.isRequired ? (
                                <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                                  Обязательный
                                </span>
                              ) : null}
                            </div>
                            <h3 className="mt-4 text-lg font-bold md:text-xl">{question.title || 'Без заголовка'}</h3>
                            {question.description ? <p className="mt-2 text-sm text-white/65">{question.description}</p> : null}
                            {renderPreviewQuestion(question)}
                          </article>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-white/60">
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
              <div className="hidden">
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

              <GlassButton onClick={addSection} className="w-full mt-10 min-h-[60px] border-2 border-dashed border-white/20 bg-white/5 text-white font-bold text-base md:text-lg flex items-center justify-center gap-3 shadow-lg transition-all hover:bg-white/10 hover:border-white/30">
                <Plus size={22} /> Добавить новый раздел
              </GlassButton>

              <div className="mt-12 rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-2xl md:p-8">
                <h3 className="text-xl font-bold mb-6">Настройки отчета (DOCX)</h3>
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-3 cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                      checked={reportConfig.show_table}
                      onChange={e => setReportConfig(prev => ({ ...prev, show_table: e.target.checked }))}
                    />
                    <span className="font-medium">Показывать таблицу баллов и ответов</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                      checked={reportConfig.show_chart}
                      onChange={e => setReportConfig(prev => ({ ...prev, show_chart: e.target.checked }))}
                    />
                    <span className="font-medium">Показывать графики (в разработке)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                      checked={reportConfig.show_interpretation}
                      onChange={e => setReportConfig(prev => ({ ...prev, show_interpretation: e.target.checked }))}
                    />
                    <span className="font-medium">Показывать краткое заключение (интерпретацию)</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isDescriptionModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/20 bg-slate-900 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">РћРїРёСЃР°РЅРёРµ С‚РµСЃС‚Р°</h2>
                <p className="mt-2 text-sm text-white/60">РћС‚СЂРµРґР°РєС‚РёСЂСѓР№С‚Рµ РєСЂР°С‚РєРѕРµ РѕРїРёСЃР°РЅРёРµ РґР»СЏ РєР»РёРµРЅС‚Р°.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDescriptionModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Р—Р°РєСЂС‹С‚СЊ"
              >
                ×
              </button>
            </div>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="РљСЂР°С‚РєРѕ РѕРїРёС€РёС‚Рµ С‚РµСЃС‚ РґР»СЏ РєР»РёРµРЅС‚Р°"
              className="mt-6 min-h-[180px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/30 focus:border-white/20"
            />

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDescriptionModalOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition-all hover:bg-white/15"
              >
                Р—Р°РєСЂС‹С‚СЊ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
