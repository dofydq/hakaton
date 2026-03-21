'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Loader2, CheckCircle2, FileText } from 'lucide-react';
import { Section, Question } from '@/types';
import { useTestSubmit } from '@/hooks/useTestSubmit';
import { QuestionElement } from '@/components/QuestionElement';

export default function PublicTestPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    loading,
    test,
    step,
    fio,
    setFio,
    email,
    setEmail,
    phone,
    setPhone,
    answers,
    setAnswer,
    submitting,
    finalScore,
    totalQuestions,
    answeredCount,
    progressPercent,
    handleStart,
    handleFinish,
    handleDownloadReport,
  } = useTestSubmit(id);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 size={40} className="animate-spin opacity-50 text-white" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        Тест не найден.
      </div>
    );
  }

  // --- Step 0: Registration ---
  if (step === 0) {
    return (
      <div className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col justify-center animate-in fade-in zoom-in duration-500">
        <div className="p-8 md:p-12 rounded-[3rem] backdrop-blur-3xl bg-indigo-900/40 shadow-2xl border border-white/20 w-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2" />
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            {test.title}
          </h1>
          <p className="text-lg opacity-80 mb-10 leading-relaxed font-medium">
            {test.description}
          </p>

          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold opacity-70 mb-2 uppercase tracking-wider">
                ФИО (Обязательно)
              </label>
              <input
                type="text"
                required
                placeholder="Иванов Иван Иванович"
                className="w-full bg-black/20 border-b-2 border-white/20 p-4 text-xl outline-none focus:border-blue-500/80 transition-colors"
                value={fio}
                onChange={(e) => setFio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold opacity-70 mb-2 uppercase tracking-wider">
                Email (Опционально)
              </label>
              <input
                type="email"
                placeholder="example@mail.com"
                className="w-full bg-black/20 border-b-2 border-white/20 p-4 text-xl outline-none focus:border-blue-500/80 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold opacity-70 mb-2 uppercase tracking-wider">
                Телефон (Опционально)
              </label>
              <input
                type="tel"
                placeholder="+7 999 000 00 00"
                className="w-full bg-black/20 border-b-2 border-white/20 p-4 text-xl outline-none focus:border-blue-500/80 transition-colors"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-5 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all transform hover:scale-[1.02]"
            >
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
      <div className="min-h-screen p-8 max-w-3xl mx-auto flex flex-col items-center justify-center">
        <div className="p-10 md:p-14 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-full max-w-2xl text-center animate-in fade-in duration-700">
          <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6 drop-shadow-md" />
          <h1 className="text-3xl font-black mb-4 text-white">Тестирование завершено!</h1>
          <p className="text-lg opacity-80 mb-10 font-medium">
            Ваши результаты успешно сохранены и доступны для анализа.
          </p>

          {finalScore !== null && (
            <div className="mb-10 flex flex-col items-center">
              <div className="inline-flex flex-col items-center justify-center w-40 h-40 rounded-full bg-white/5 border border-white/10 shadow-inner mb-4">
                <span className="text-sm uppercase tracking-widest opacity-60 font-bold mb-1">
                  Балл
                </span>
                <span className="text-5xl font-black text-blue-400">{finalScore}</span>
              </div>
              {finalScore > 80 && (
                <p className="text-xl font-bold text-green-400 mt-2">Отличный результат!</p>
              )}
              {finalScore < 40 && (
                <p className="text-xl font-bold text-red-400 mt-2">
                  Рекомендуем углубленную консультацию
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={handleDownloadReport}
              className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <FileText size={20} />
              Скачать мой отчет
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              className="mt-6 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity decoration-white hover:underline uppercase tracking-wide"
            >
              Вернуться к списку тестов
            </button>
          </div>
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
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm font-bold opacity-70">
          <span>Прогресс</span>
          <span>
            {progressPercent}% ({answeredCount} / {totalQuestions})
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Render Sections */}
        {(test?.logic_tree_json || []).map((sec: Section, sIdx: number) => {
          const questions = sec.questions || [];
          if (questions.length === 0) return null;

          return (
            <div
              key={sec.id || sIdx}
              className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 fade-in"
              style={{ animationDelay: `${sIdx * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="border-b border-white/20 pb-4">
                <h2 className="text-3xl font-bold">{sec.title}</h2>
                {sec.description && (
                  <p className="text-lg opacity-60 mt-2 font-medium">{sec.description}</p>
                )}
              </div>

              <div className="space-y-6">
                {questions.map((q: Question, qIdx: number) => (
                  <div
                    key={q.id}
                    className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 shadow-lg relative overflow-hidden transition-colors hover:bg-white-[0.07]"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/50 rounded-l-[2rem]" />
                    <h3 className="text-xl font-bold mb-2 pr-4">
                      {qIdx + 1}. {q.title}
                    </h3>
                    {q.description && (
                      <p className="opacity-60 text-sm mb-6 max-w-2xl">{q.description}</p>
                    )}

                    <div className="mt-6">
                      <QuestionElement
                        question={q}
                        answer={answers[q.id]}
                        onAnswerChange={setAnswer}
                      />
                    </div>

                    {/* Required indicator logic */}
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
            {submitting ? (
              <>
                <Loader2 className="animate-spin" /> Обработка...
              </>
            ) : (
              'Завершить и Отправить'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
