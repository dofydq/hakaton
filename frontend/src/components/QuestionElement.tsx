import React from 'react';
import { Question } from '@/types';

interface QuestionElementProps {
  question: Question;
  answer: any;
  onAnswerChange: (qId: string, val: any) => void;
}

export function QuestionElement({ question: q, answer: ans, onAnswerChange }: QuestionElementProps) {
  const type = q.type;

  switch (type) {
    case 'text':
      return (
        <textarea
           className="w-full bg-black/20 border border-white/20 rounded-xl p-4 text-white outline-none focus:border-blue-500/50 min-h-[100px]"
           placeholder="Ваш ответ..."
           value={ans || ''}
           onChange={e => onAnswerChange(q.id, e.target.value)}
        />
      );
    case 'number':
      return (
        <input 
          type="number"
          className="w-full bg-black/20 border border-white/20 rounded-xl p-4 text-white outline-none focus:border-blue-500/50"
          placeholder="0"
          value={ans || ''}
          onChange={e => onAnswerChange(q.id, parseFloat(e.target.value) || 0)}
        />
      );
    case 'single_choice':
    case 'yes_no':
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
                   onChange={() => onAnswerChange(q.id, opt.id)}
                   className="w-5 h-5 accent-blue-500"
                />
                <span className="font-medium text-lg">{opt.text}</span>
              </label>
            )
          })}
        </div>
      );
    case 'multiple_choice':
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
                      if (e.target.checked) onAnswerChange(q.id, [...arr, opt.id]);
                      else onAnswerChange(q.id, arr.filter((x: string) => x !== opt.id));
                    }}
                    className="w-5 h-5 rounded-md accent-blue-500"
                 />
                 <span className="font-medium text-lg">{opt.text}</span>
               </label>
            );
          })}
        </div>
      );
    case 'scale':
      return (
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <button
               key={num}
               onClick={() => onAnswerChange(q.id, num)}
               className={`w-12 h-12 rounded-xl text-lg font-bold border transition-colors ${ans === num ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-black/20 border-white/20 hover:border-white/40'}`}
            >
               {num}
            </button>
          ))}
        </div>
      );
    case 'slider':
      return (
        <div className="w-full flex items-center gap-4">
           <span className="font-bold text-xl opacity-50">0</span>
           <input 
              type="range"
              min="0" max="100"
              value={ans || 50}
              onChange={e => onAnswerChange(q.id, parseInt(e.target.value))}
              className="flex-1 w-full h-3 rounded-xl bg-black/30 appearance-none outline-none accent-blue-500"
           />
           <span className="font-bold text-xl">{ans || 50}</span>
        </div>
      );
    default:
      return <p className="italic opacity-50">Интерфейс для данного типа ({type}) пока не реализован.</p>;
  }
}
