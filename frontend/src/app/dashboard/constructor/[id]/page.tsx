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
import { Save, ArrowLeft, Loader2, Download, Upload, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import { SectionBlock, SectionData } from '@/components/SectionBlock';
import { QuestionData } from '@/components/QuestionBlock';
import { GlassButton } from '@/components/ui/GlassButton';
import { api } from '@/lib/api';

export default function ConstructorPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [title, setTitle] = useState('Новый тест');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<SectionData[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (id && id !== 'new') {
      api.get(`/tests/${id}`)
        .then((res: any) => {
          let data = res.data;
          if (data && !data.sections) data.sections = []; // Forced by user Napalm request
          
          setTitle(data.title);
          setDescription(data.description || '');
          if (data.logic_tree_json && Array.isArray(data.logic_tree_json)) {
             const safeSections = data.logic_tree_json.map((s: any) => ({
               ...s,
               questions: s.questions || []
             }));
             setSections(safeSections);
          }
        })
        .catch((err: any) => {
          console.error(err);
          toast.error("Не удалось загрузить тест");
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
      id: `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Новый раздел ${sections.length + 1}`,
      description: '',
      questions: []
    }]);
  };

  const updateSection = (secId: string, updates: Partial<SectionData>) => {
    setSections(prev => prev.map(s => s.id === secId ? { ...s, ...updates } : s));
  };

  const deleteSection = (secId: string) => {
    if (confirm("Удалить раздел и все вопросы в нем?")) {
      setSections(prev => prev.filter(s => s.id !== secId));
    }
  };

  const addQuestion = (sectionId: string, type: string) => {
    const newQ: QuestionData = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: 'Новый вопрос',
      options: ['single_choice', 'multiple_choice', 'dropdown', 'yes_no'].includes(type) ? [
        { id: `opt_${Date.now()}_1`, text: type === 'yes_no' ? 'Да' : 'Вариант 1', is_correct: false, points: 0 },
        { id: `opt_${Date.now()}_2`, text: type === 'yes_no' ? 'Нет' : 'Вариант 2', is_correct: false, points: 0 }
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
        toast.success('Тест успешно создан!');
        router.push(`/dashboard/constructor/${res.data.id}`);
      } else {
        await api.put(`/tests/${id}`, payload);
        toast.success('Тест успешно сохранен!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при сохранении теста.');
    } finally {
      setSaving(false);
    }
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sections, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", title + "_config.json");
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
          toast.success("JSON успешно загружен");
        } else {
          toast.error('Неверный формат JSON.');
        }
      } catch (err) {
        toast.error('Ошибка при чтении JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  console.log("Current sections data:", sections);

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden bg-white/5">
      <header className="flex-none p-4 md:px-8 border-b-2 border-white/10 dark:border-black/20 bg-white/10 dark:bg-black/10 backdrop-blur-xl flex justify-between items-center z-20 shadow-sm flex-wrap gap-4">
        <div className="flex items-center gap-6 flex-1 min-w-[300px]">
           <GlassButton 
              onClick={() => router.push('/dashboard')} 
              className="!p-3 !px-4 !rounded-2xl shrink-0 flex items-center gap-2"
              title="На дашборд"
           >
              <ArrowLeft size={20} /> <span className="hidden sm:inline font-medium text-sm">Назад</span>
           </GlassButton>
           
           <div className="flex flex-col w-full max-w-xl gap-1">
             <input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="text-2xl font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-blue-500/50 transition-colors placeholder-gray-400"
                placeholder="Заголовок Теста"
             />
           </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <input type="file" id="import-json" accept=".json" className="hidden" onChange={importJSON} />
          <GlassButton 
            onClick={() => document.getElementById('import-json')?.click()} 
            className="!p-2 !px-4 text-sm font-medium flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-white"
          >
            <Upload size={18} /> <span className="hidden md:inline">Импорт JSON</span>
          </GlassButton>
          <GlassButton 
            onClick={exportJSON} 
            className="!p-2 !px-4 text-sm font-medium flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-white"
          >
            <Download size={18} /> <span className="hidden md:inline">Экспорт JSON</span>
          </GlassButton>

          <GlassButton 
            onClick={saveTest} 
            disabled={saving} 
            className="flex gap-2 items-center bg-blue-500/80 hover:bg-blue-600/90 text-white font-semibold shadow-blue-500/30 ml-2 py-2 px-6"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            <span className="hidden sm:inline">{saving ? 'Сохранение...' : 'Сохранить тест'}</span>
          </GlassButton>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-transparent relative scroll-smooth p-6 md:p-12">
        <div className="max-w-4xl mx-auto pb-48">
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

          <GlassButton 
            onClick={addSection}
            className="w-full mt-12 py-6 border-2 border-dashed border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white font-bold text-lg flex items-center justify-center gap-3 transition-colors"
          >
            <Plus size={24} /> Добавить новый раздел
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
