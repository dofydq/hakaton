import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { AppTest, Section } from '@/types';

export function useTestSubmit(id: string) {
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<AppTest | null>(null);
  
  const [step, setStep] = useState(0); // 0: Form, 1: Test, 2: Success
  const [fio, setFio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  // Вычисляем проценты
  const totalQuestions = test?.logic_tree_json?.reduce((sum: number, s: Section) => sum + (s.questions?.length || 0), 0) || 0;
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
      if (!window.confirm("Вы ответили не на все вопросы. Продолжить завершение?")) {
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
      
      const newResultId = res.data.result_id || res.data.id;
      console.log("Ответ сервера:", res.data);
      setResultId(newResultId);
      
      setStep(2);
      toast.success('Тест успешно завершен!');
    } catch (e: any) {
       console.error("FULL SAVE ERROR:", e);
       toast.error(e.response?.data?.detail || "Упс! Не удалось сохранить ответы");
    } finally {
       setSubmitting(false);
    }
  };

  const setAnswer = (qId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleDownloadReport = async () => {
    console.log("Скачивание для ID:", resultId);
    if (!resultId) {
      console.error("Result ID is not set. Download aborted.");
      return;
    }
    
    const downloadUrl = `/reports/results/${resultId}/report`;
    console.log("FINAL URL CHECK:", downloadUrl);
    
    const loadingToast = toast.loading('Загрузка отчета...');
    try {
      const response = await api.get(downloadUrl, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_client_${resultId}.docx`);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      toast.success('Отчет скачан!', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при скачивании отчета', { id: loadingToast });
    }
  };

  return {
    loading, test, step, setStep,
    fio, setFio, email, setEmail, phone, setPhone,
    answers, setAnswer, submitting, finalScore, resultId,
    totalQuestions, answeredCount, progressPercent,
    handleStart, handleFinish, handleDownloadReport
  };
}
