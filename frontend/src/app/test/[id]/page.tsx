'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { GlassButton } from '@/components/ui/GlassButton';
import { Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicTestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  
  const [step, setStep] = useState(0); // 0: Form, 1: Test, 2: Success
  const [fio, setFio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // Вычисляем проценты
  const totalQuestions = test?.logic_tree_json?.reduce((sum: number, s: any) => sum + (s.questions?.length || 0), 0) || 0;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await api.get(`/client/tests/${id}`);
        setTest(res.data);
      } catch (e) {
        console.error("Test load error", e);
        toast.error("Произошла ошибка загрузки теста. Возможно, тест не найден.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTest();
  }, [id]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fio.trim()) {
      toast.error('Укажите ФИО');
      return;
    }
    setStep(1);
    window.scrollTo(0,0);
  };

  const handleFinish = async () => {
    if (answeredCount < totalQuestions) {
      if (!confirm("Вы ответили не на все вопросы. Продолжить завершение?")) {
        return;
      }
    }
    
    setSubmitting(true);
    try {
      const res = await api.post('/results', {
        test_id: Number(id),
        client_fio: fio,
        client_phone: phone,
        client_email: email,
        answers_json: answers
      });
      setFinalScore(res.data.total_points);
      setStep(2);
      toast.success('Тест успешно завершен!');
    } catch (e) {
       console.error("FULL SAVE ERROR:", e);
       toast.error("Упс! Не удалось сохранить ответы");
    } finally {
       setSubmitting(false);
    }
  };

  const setAnswer = (qId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const renderQuestionInput = (q: any) => {
    const type = q.type;
    const ans = answers[q.id];

    if (type === 'text') {
      return (
        <textarea
           className="w-full bg-black/20 border border-white/20 rounded-xl p-4 text-white outline-none focus:border-blue-500/50 min-h-[100px]"
           placeholder="Ваш ответ..."
           value={ans || ''}
           onChange={e => setAnswer(q.id, e.target.value)}
        />
      );
    }
    if (type === 'number') {
      return (
        <input 
          type="number"
          className="w-full bg-black/20 border border-white/20 rounded-xl p-4 text-white outline-none focus:border-blue-500/50"
          placeholder="0"
          value={ans || ''}
          onChange={e => setAnswer(q.id, parseFloat(e.target.value) || 0)}
        />
      );
    }
    if (type === 'single_choice' || type === 'yes_no') {
      return (
        <div className="flex flex-col gap-3">
          {(q.options || []).map((opt: any) => {
            const checked = ans === opt.id;
            return (
              <label key={opt.id} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${checked ? 'bg-blue-500/20 border-blue-500/50' : 'bg-black/10 border-white/10 hover:bg-black/20 hover:border-white/20'}`}>
                <input 
                   type="radio" 
                   name={`q_${q.id}`} 
                   value={opt.id} 
                   checked={checked} 
                   onChange={() => setAnswer(q.id, opt.id)}
                   className="w-5 h-5 accent-blue-500"
                />
                <span className="font-medium text-lg">{opt.text}</span>
              </label>
            )
          })}
        </div>
      );
    }
    if (type === 'multiple_choice') {
      const arr = Array.isArray(ans) ? ans : [];
      return (
        <div className="flex flex-col gap-3">
          {(q.options || []).map((opt: any) => {
            const checked = arr.includes(opt.id);
            return (
               <label key={opt.id} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${checked ? 'bg-blue-500/20 border-blue-500/50' : 'bg-black/10 border-white/10 hover:bg-black/20 hover:border-white/20'}`}>
                 <input 
                    type="checkbox" 
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) setAnswer(q.id, [...arr, opt.id]);
                      else setAnswer(q.id, arr.filter((x: string) => x !== opt.id));
                    }}
                    className="w-5 h-5 rounded-md accent-blue-500"
                 />
                 <span className="font-medium text-lg">{opt.text}</span>
               </label>
            );
          })}
        </div>
      );
    }
    if (type === 'scale') {
      return (
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <button
               key={num}
               onClick={() => setAnswer(q.id, num)}
               className={`w-12 h-12 rounded-xl text-lg font-bold border transition-colors ${ans === num ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-black/20 border-white/20 hover:border-white/40'}`}
            >
               {num}
            </button>
          ))}
        </div>
      );
    }
    if (type === 'slider') {
      return (
        <div className="w-full flex items-center gap-4">
           <span className="font-bold text-xl opacity-50">0</span>
           <input 
              type="range"
              min="0" max="100"
              value={ans || 50}
              onChange={e => setAnswer(q.id, parseInt(e.target.value))}
              className="flex-1 w-full h-3 rounded-xl bg-black/30 appearance-none outline-none accent-blue-500"
           />
           <span className="font-bold text-xl">{ans || 50}</span>
        </div>
      );
    }
    
    return <p className="italic opacity-50">Интерфейс для данного типа ({type}) пока не реализован.</p>;
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center"><Loader2 size={40} className="animate-spin opacity-50 text-white"/></div>;
  }

  if (!test) {
    return <div className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col items-center justify-center">Тест не найден.</div>;
  }

  // --- Step 0: Registration ---
  if (step === 0) {
    return (
      <div className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col justify-center animate-in fade-in zoom-in duration-500">
         <div className="p-8 md:p-12 rounded-[3rem] backdrop-blur-3xl bg-indigo-900/40 shadow-2xl border border-white/20 w-full relative overflow-hidden">
            {/* Декор */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2" />
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{test.title}</h1>
            <p className="text-lg opacity-80 mb-10 leading-relaxed font-medium">{test.description}</p>
            
            <form onSubmit={handleStart} className="space-y-6">
               <div>
                  <label className="block text-sm font-semibold opacity-70 mb-2 uppercase tracking-wider">ФИО (Обязательно)</label>
                  <input
                     type="text" required
                     placeholder="Иванов Иван Иванович"
                     className="w-full bg-black/20 border-b-2 border-white/20 p-4 text-xl outline-none focus:border-blue-500/80 transition-colors"
                     value={fio} onChange={e => setFio(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-semibold opacity-70 mb-2 uppercase tracking-wider">Email (Опционально)</label>
                  <input
                     type="email"
                     placeholder="example@mail.com"
                     className="w-full bg-black/20 border-b-2 border-white/20 p-4 text-xl outline-none focus:border-blue-500/80 transition-colors"
                     value={email} onChange={e => setEmail(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-semibold opacity-70 mb-2 uppercase tracking-wider">Телефон (Опционально)</label>
                  <input
                     type="tel"
                     placeholder="+7 999 000 00 00"
                     className="w-full bg-black/20 border-b-2 border-white/20 p-4 text-xl outline-none focus:border-blue-500/80 transition-colors"
                     value={phone} onChange={e => setPhone(e.target.value)}
                  />
               </div>
               
               <button type="submit" className="w-full py-5 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all transform hover:scale-[1.02]">
                 Начать тестирование
               </button>
            </form>
         </div>
      </div>
    );
  }

  // --- Step 2: Success ---
  if (step === 2) {
    return (
      <div className="min-h-screen p-8 max-w-3xl mx-auto flex flex-col items-center justify-center animate-in zoom-in slide-in-from-bottom-8 duration-500">
         <div className="p-12 rounded-[3rem] backdrop-blur-3xl bg-green-500/10 shadow-2xl border border-green-400/30 w-full text-center">
            <CheckCircle2 size={80} className="text-green-400 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]" />
            <h1 className="text-5xl font-black mb-6">Тест завершен!</h1>
            <p className="text-xl opacity-90 mb-8 font-medium">Спасибо за прохождение, ваши ответы сохранены.</p>
            {finalScore !== null && (
               <div className="inline-block px-8 py-4 bg-black/30 rounded-3xl border border-white/10 mb-8">
                  <p className="text-sm uppercase tracking-widest opacity-60 font-bold mb-1">Сумма набранных баллов</p>
                  <p className="text-5xl font-black text-blue-400">{finalScore}</p>
               </div>
            )}
            <br/>
            <GlassButton onClick={() => window.location.href = '/'} className="!py-4 !px-10 text-lg font-bold">
               Вернуться на главную
            </GlassButton>
         </div>
      </div>
    );
  }

  // --- Step 1: Taking Test ---
  return (
    <div className="min-h-screen pb-32 animate-in fade-in duration-500 bg-[#0B0F19]">
      {/* Sticky Progress Bar */}
      <div className="sticky top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 shadow-2xl px-6 py-4">
         <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
         </div>
         <div className="flex justify-between mt-2 text-sm font-bold opacity-70">
            <span>Прогресс</span>
            <span>{progressPercent}% ({answeredCount} / {totalQuestions})</span>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
         {/* Render Sections */}
         {(test.logic_tree_json || []).map((sec: any, sIdx: number) => {
            const questions = sec.questions || [];
            if (questions.length === 0) return null;
            
            return (
              <div key={sec.id || sIdx} className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 fade-in" style={{ animationDelay: `${sIdx * 100}ms`, animationFillMode: 'both' }}>
                 <div className="border-b border-white/20 pb-4">
                    <h2 className="text-3xl font-bold">{sec.title}</h2>
                    {sec.description && <p className="text-lg opacity-60 mt-2 font-medium">{sec.description}</p>}
                 </div>
                 
                 <div className="space-y-6">
                    {questions.map((q: any, qIdx: number) => (
                       <div key={q.id} className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 shadow-lg relative overflow-hidden transition-colors hover:bg-white-[0.07]">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/50 rounded-l-[2rem]" />
                          <h3 className="text-xl font-bold mb-2 pr-4">{qIdx + 1}. {q.title}</h3>
                          {q.description && <p className="opacity-60 text-sm mb-6 max-w-2xl">{q.description}</p>}
                          
                          <div className="mt-6">
                             {renderQuestionInput(q)}
                          </div>
                          
                          {/* Required indicator logic if needed */}
                          {q.isRequired && !answers[q.id] && (
                             <p className="text-red-400 font-medium text-xs mt-4 uppercase tracking-widest absolute top-8 right-8">
                                Обязательно
                             </p>
                          )}
                       </div>
                    ))}
                 </div>
              </div>
            );
         })}

         <div className="pt-12 text-center">
            <button 
               onClick={handleFinish}
               disabled={submitting}
               className="w-full md:w-auto px-16 py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-2xl uppercase tracking-wider rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.3)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-4"
            >
              {submitting ? <><Loader2 className="animate-spin" /> Обработка...</> : 'Завершить и Отправить'}
            </button>
         </div>
      </div>
    </div>
  );
}
