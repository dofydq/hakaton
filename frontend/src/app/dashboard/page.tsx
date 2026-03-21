'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, LogOut, Share2, X, Edit3, Upload, Lock, Trash2 } from 'lucide-react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import { GlassButton } from '@/components/ui/GlassButton';
import { Edit2, Save, PlusCircle, Settings, ClipboardList } from 'lucide-react'; // Added new lucide-react icons
import toast from 'react-hot-toast'; // Added toast import

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [businessCard, setBusinessCard] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [resultCounts, setResultCounts] = useState<Record<string, number>>({});
  const [shareTest, setShareTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get('/users/me');
        setUser(userRes.data);

        // Fetch remaining data only if user is psychologist
        if (userRes.data?.role === 'psychologist') {
          const [cardRes, testsRes, countsRes] = await Promise.all([
            api.get('/users/me/business-card').catch(() => ({ data: null })),
            api.get('/tests/').catch(() => ({ data: [] })),
            api.get('/results/counts').catch(() => ({ data: {} })),
          ]);
          setBusinessCard(cardRes.data);
          setTests(testsRes.data);
          setResultCounts(countsRes.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const handleLogout = () => {
    Cookies.remove('access_token');
    router.push('/login');
  };

  const handleDeleteTest = async (testId: number, testTitle: string) => {
    const confirmed = window.confirm(`Удалить тест "${testTitle}"? Это действие нельзя отменить.`);
    if (!confirmed) return;

    try {
      await api.delete(`/tests/${testId}`);
      setTests(prev => prev.filter((test: any) => test.id !== testId));
      setResultCounts(prev => {
        const next = { ...prev };
        delete next[String(testId)];
        return next;
      });
      if (shareTest?.id === testId) {
        setShareTest(null);
      }
      toast.success('Тест удалён');
    } catch (err) {
      console.error(err);
      toast.error('Не удалось удалить тест');
    }
  };

  const openEditProfile = () => {
    setBio(user?.bio_markdown || '');
    setAvatarPreview(user?.avatar_url || '');
    setAvatarFile(null);
    setEditProfileModal(true);
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      let newAvatarUrl = user.avatar_url;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const res = await api.post('/users/upload-avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newAvatarUrl = res.data.avatar_url;
      }
      
      const updateRes = await api.put('/users/me', {
        bio_markdown: bio,
        avatar_url: newAvatarUrl
      });
      setUser(updateRes.data);
      setEditProfileModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при сохранении профиля');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      {/* Шапка */}
      <header className="flex justify-between items-center mb-12 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Личный кабинет</h1>
        <div className="flex gap-4">
          <GlassButton onClick={toggleTheme} className="!p-3 !rounded-full flex items-center justify-center">
             {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </GlassButton>
          <GlassButton onClick={handleLogout} className="!p-3 !rounded-full sm:!rounded-2xl sm:px-6 flex gap-2 items-center">
             <LogOut size={20} /> <span className="hidden sm:inline">Выйти</span>
          </GlassButton>
        </div>
      </header>

      {/* Контент: сетка */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Карточка профиля */}
        <div className="p-8 rounded-3xl backdrop-blur-xl bg-white/30 dark:bg-black/30 shadow-2xl border border-white/20">
          <div className="flex justify-between items-center mb-6 border-b border-black/10 dark:border-white/10 pb-4">
            <h2 className="text-xl font-semibold">Профиль</h2>
            <GlassButton onClick={openEditProfile} className="!p-2 !rounded-xl" title="Редактировать">
               <Edit3 size={18} />
            </GlassButton>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <div className="w-24 h-24 shrink-0 rounded-full border-4 border-white/30 shadow-lg overflow-hidden bg-white/10 flex items-center justify-center">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="opacity-50 text-2xl font-bold">{user?.full_name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="space-y-4 w-full">
              <div>
                <p className="text-sm opacity-60 uppercase tracking-widest font-semibold mb-1 flex items-center gap-2">ФИО <Lock size={12} /></p>
                <p className="text-xl font-medium">{user?.full_name || 'Не указано'}</p>
              </div>
              <div>
                <p className="text-sm opacity-60 uppercase tracking-widest font-semibold mb-1">О себе</p>
                <p className="text-sm font-medium line-clamp-3 opacity-80">{user?.bio_markdown || 'Не заполнено'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-black/5 dark:border-white/5 pt-4">
            <div>
              <p className="text-sm opacity-60 uppercase tracking-widest font-semibold mb-1 flex items-center gap-2">Email <Lock size={12} /></p>
              <p className="text-xl font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm opacity-60 uppercase tracking-widest font-semibold mb-1 flex items-center gap-2">Телефон <Lock size={12} /></p>
              <p className="text-xl font-medium">{user?.phone || 'Не указан'}</p>
            </div>
            <div>
              <p className="text-sm opacity-60 uppercase tracking-widest font-semibold mb-1">Роль</p>
              <p className="text-xl font-medium">{user?.role === 'admin' ? 'Администратор' : 'Психолог'}</p>
            </div>
            <div>
              <p className="text-sm opacity-60 uppercase tracking-widest font-semibold mb-1 flex items-center gap-2">Доступ до <Lock size={12} /></p>
              <p className="text-xl font-medium">
                {user?.access_until ? new Date(user.access_until).toLocaleDateString() : 'Бессрочный'}
              </p>
            </div>
          </div>
        </div>

        {/* Условный рендеринг по роли */}
        {user?.role === 'admin' ? (
          <div className="p-8 rounded-3xl backdrop-blur-xl bg-white/30 dark:bg-black/30 shadow-2xl border border-white/20">
            <h2 className="text-xl font-semibold mb-6 border-b border-black/10 dark:border-white/10 pb-4">Управление психологами</h2>
            <p className="opacity-80">Интерфейс управления психологами находится в разработке.</p>
          </div>
        ) : (
          <>
            {/* Карточка визитки (только для психолога) */}
            <div className="p-8 rounded-3xl backdrop-blur-xl bg-white/30 dark:bg-black/30 shadow-2xl border border-white/20 flex flex-col items-center justify-center">
              <h2 className="text-xl font-semibold mb-6 border-b border-black/10 dark:border-white/10 pb-4 w-full text-center">Визитка для клиента</h2>
              
              {businessCard?.qr_code_base64 ? (
                <div className="p-4 bg-white/50 dark:bg-white/10 rounded-3xl shadow-lg mb-6 backdrop-blur-md">
                  <img 
                    src={businessCard.qr_code_base64} 
                    alt="QR Code" 
                    className="w-56 h-56 object-contain rounded-xl mix-blend-multiply dark:mix-blend-normal bg-white"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-center opacity-70">
                  Визитка не загружена
                </div>
              )}
              
              {businessCard?.card_url ? (
                <a 
                  href={businessCard.card_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium break-all text-center transition-colors"
                >
                  Ссылка на начало тестирования
                </a>
              ) : null}
            </div>

            {/* Секция: Управление тестами */}
            <div className="md:col-span-2 p-8 rounded-3xl backdrop-blur-xl bg-white/30 dark:bg-black/30 shadow-2xl border border-white/20 mt-2">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b border-black/10 dark:border-white/10 pb-4 gap-4">
                <h2 className="text-xl font-semibold w-full sm:w-auto text-center sm:text-left">Управление тестами</h2>
                <GlassButton onClick={() => router.push('/dashboard/constructor/new')} className="!py-2 !px-4 text-sm font-medium w-full sm:w-auto">
                  ➕ Создать новый тест
                </GlassButton>
              </div>

              {tests.length === 0 ? (
                <div className="text-center opacity-60 my-10">
                  <p className="text-lg">У вас пока нет созданных тестов.</p>
                  <p className="text-sm mt-2">Нажмите «Создать новый тест», чтобы начать.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tests.map((test: any) => (
                    <div key={test.id} className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white/40 dark:bg-black/40 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md hover:bg-white/50 dark:hover:bg-black/50 transition-colors">
                      <div className="w-full sm:w-auto text-center sm:text-left mb-4 sm:mb-0">
                        <button
                          onClick={() => router.push(`/dashboard/tests/${test.id}`)}
                          className="font-bold text-lg hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-left"
                        >
                          {test.title}
                        </button>
                        <p className="text-sm opacity-70 mt-1">{test.description || 'Нет описания'}</p>
                        <p className="text-xs mt-2 font-semibold opacity-60">
                          Заполнили: <span className="text-violet-600 dark:text-violet-400 font-bold">{resultCounts[String(test.id)] ?? 0}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
                        <GlassButton
                          onClick={() => router.push(`/dashboard/tests/${test.id}`)}
                          className="!py-2 !px-5 text-sm font-medium flex-1 sm:flex-auto border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/25 text-violet-700 dark:text-violet-300"
                        >
                          Результаты
                        </GlassButton>
                        <GlassButton onClick={() => setShareTest(test)} className="!p-3 !rounded-xl" title="Поделиться">
                          <Share2 size={18} />
                        </GlassButton>
                        <GlassButton onClick={() => router.push(`/dashboard/constructor/${test.id}`)} className="!py-2 !px-5 text-sm font-medium flex-1 sm:flex-auto">
                          Редактировать
                        </GlassButton>
                        <GlassButton
                          onClick={() => handleDeleteTest(test.id, test.title)}
                          className="!p-3 !rounded-xl border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300"
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </GlassButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {shareTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-3xl rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 relative flex flex-col items-center">
            <button 
              onClick={() => setShareTest(null)} 
              className="absolute top-6 right-6 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors bg-black/5 dark:bg-white/5 p-2 rounded-full"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-8">Поделиться тестом</h3>
            <div className="bg-white p-4 rounded-2xl mb-6 flex items-center justify-center shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`http://localhost:3000/test/${shareTest.id}`)}`} 
                alt="Test QR Code" 
                className="w-48 h-48 mix-blend-multiply"
              />
            </div>
            <div className="w-full bg-slate-100 dark:bg-white/10 p-4 rounded-xl break-all text-sm font-medium text-center border border-slate-200 dark:border-white/10 select-all cursor-text shadow-inner">
              {`http://localhost:3000/test/${shareTest.id}`}
            </div>
            <p className="text-xs opacity-60 mt-6 text-center leading-relaxed">
              Отправьте эту ссылку или QR-код проверяемому для старта тестирования
            </p>
          </div>
        </div>
      )}

      {/* Модалка Редактирования Профиля */}
      {editProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-3xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 relative flex flex-col gap-6">
            <button 
              onClick={() => setEditProfileModal(false)} 
              className="absolute top-6 right-6 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors bg-black/5 dark:bg-white/5 p-2 rounded-full"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold">Редактировать профиль</h3>

            <div className="flex flex-col items-center gap-4">
               <div className="w-32 h-32 rounded-full border-4 border-white/50 shadow-lg overflow-hidden bg-white/10 flex items-center justify-center relative group">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="opacity-50 text-sm">Нет фото</span>
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                     <Upload size={24} />
                     <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={(e) => {
                         if (e.target.files && e.target.files[0]) {
                           const file = e.target.files[0];
                           setAvatarFile(file);
                           setAvatarPreview(URL.createObjectURL(file));
                         }
                       }} 
                     />
                  </label>
               </div>
               <p className="text-xs opacity-60">Нажмите на область, чтобы загрузить фото</p>
            </div>

            <div className="flex flex-col gap-2">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-semibold opacity-80">О себе (Markdown)</label>
                 <button
                   type="button"
                   onClick={() => setBio(prev =>
                     prev.includes('**жирный**')
                       ? prev.replace('\n\n---ПОДСКАЗКА---\n# Заголовок\n**жирный** _курсив_\n- Пункт списка\n> Цитата', '')
                       : prev + '\n\n---ПОДСКАЗКА---\n# Заголовок\n**жирный** _курсив_\n- Пункт списка\n> Цитата'
                   )}
                   className="text-xs text-blue-600 dark:text-blue-400 hover:underline opacity-70 hover:opacity-100 flex items-center gap-1"
                 >
                   <span>📝</span> Markdown-синтаксис
                 </button>
               </div>
               <div className="text-xs opacity-50 bg-white/30 dark:bg-white/5 rounded-xl p-3 border border-white/20 font-mono leading-relaxed">
                 <span className="font-bold"># Заголовок</span> &nbsp;|&nbsp; <span className="font-bold">**жирный**</span> &nbsp;|&nbsp; <span className="italic">_курсив_</span> &nbsp;|&nbsp; <span>- список</span> &nbsp;|&nbsp; <span>&gt; цитата</span>
               </div>
               <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={"# Обо мне\n\nРасскажите о себе, опыте и методах работы...\n\n- Подход 1\n- Подход 2"}
                  className="w-full bg-white/60 dark:bg-black/60 border border-white/30 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all min-h-[120px] resize-y font-mono text-sm"
               />
            </div>

            <GlassButton onClick={handleProfileSave} disabled={savingProfile} className="!w-full !py-3 font-semibold text-white bg-blue-500 hover:bg-blue-600">
               {savingProfile ? 'Сохранение...' : 'Сохранить изменения'}
            </GlassButton>
          </div>
        </div>
      )}

    </main>
  );
}
