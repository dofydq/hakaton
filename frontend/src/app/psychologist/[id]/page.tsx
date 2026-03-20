'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { GlassButton } from '@/components/ui/GlassButton';
import { User, Loader2, ArrowRight } from 'lucide-react';

export default function PsychologistPage() {
  const { id } = useParams();
  const router = useRouter();
  const [psychologist, setPsychologist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const res = await api.get(`/client/psychologist/${id}`);
        setPsychologist(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center"><Loader2 size={40} className="animate-spin opacity-50"/></div>;
  }

  if (!psychologist) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-8 text-center gap-6">
        <h1 className="text-4xl font-bold">Психолог не найден</h1>
        <p className="opacity-70">Возможно, ссылка устарела или профиль был скрыт.</p>
        <GlassButton onClick={() => router.push('/')} className="!py-3 !px-8">На главную</GlassButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto flex flex-col items-center">
       
       {/* Верхний блок: Информация */}
       <div className="w-full flex flex-col md:flex-row gap-10 items-center md:items-start p-10 rounded-[3rem] backdrop-blur-3xl bg-white/30 dark:bg-black/30 shadow-2xl border border-white/20 mt-12 mb-12">
          
          <div className="w-48 h-48 shrink-0 rounded-full border-8 border-white/40 dark:border-white/10 shadow-2xl overflow-hidden bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center">
             {psychologist.avatar_url ? (
               <img src={psychologist.avatar_url} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <User size={80} className="text-white opacity-80" />
             )}
          </div>
          
          <div className="flex-1 text-center md:text-left flex flex-col justify-center h-full pt-4">
             <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                {psychologist.full_name || 'Специалист'}
             </h1>
             
             <div className="text-lg opacity-80 leading-relaxed font-medium">
                {psychologist.bio_markdown ? (
                  psychologist.bio_markdown.split('\n').map((para: string, i: number) => (
                    <p key={i} className="mb-2">{para}</p>
                  ))
                ) : (
                  <p>Информация о специалисте не заполнена.</p>
                )}
             </div>
          </div>
       </div>

       {/* Нижний блок: Тесты */}
       <div className="w-full">
          <h2 className="text-2xl font-bold mb-8 pl-4 border-l-4 border-blue-500">Доступные тесты</h2>
          
          {psychologist.tests && psychologist.tests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {psychologist.tests.map((test: any) => (
                <div key={test.id} className="p-6 rounded-3xl backdrop-blur-xl bg-white/40 dark:bg-black/40 border border-white/20 shadow-xl flex flex-col h-full hover:-translate-y-2 transition-transform duration-300">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">{test.title}</h3>
                    <p className="opacity-70 text-sm line-clamp-3 mb-6 relative z-10">{test.description || 'Описание отсутствует'}</p>
                  </div>
                  <GlassButton 
                    onClick={() => router.push(`/test/${test.id}`)} 
                    className="!w-full !py-3 flex justify-center items-center gap-2 font-semibold bg-blue-500/80 hover:bg-blue-600/90 text-white shadow-lg"
                  >
                    Пройти тест <ArrowRight size={18} />
                  </GlassButton>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center rounded-3xl bg-white/10 border border-white/5 opacity-70">
              <p>У данного специалиста пока нет доступных тестов.</p>
            </div>
          )}
       </div>

    </div>
  );
}
