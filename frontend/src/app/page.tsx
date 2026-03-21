import Link from 'next/link';
import { GlassButton } from '@/components/ui/GlassButton';

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-[pulse_10s_ease-in-out_infinite] overflow-x-hidden">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-4xl p-12 text-center rounded-3xl backdrop-blur-xl bg-white/10 dark:bg-black/20 shadow-2xl border border-white/20 text-white">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-md">
            ПрофДНК: CRM для психологов
          </h1>
          <p className="text-xl md:text-2xl mb-12 font-medium opacity-90 drop-shadow-sm max-w-2xl mx-auto">
            Создавайте уникальные ссылки для клиентов и получайте готовые отчеты в DOCX автоматически.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold mb-4">Для клиентов</h2>
              <p className="opacity-80 mb-6 font-light">Регистрация не нужна. Просто перейдите по ссылке от вашего специалиста.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold mb-4">Для специалистов</h2>
              <p className="opacity-80 mb-6 font-light">Управляйте базой клиентов и результатами тестирований в одном месте.</p>
              <div className="flex flex-col w-full gap-4">
                <Link href="/login" passHref className="w-full">
                  <GlassButton className="w-full px-6 py-3 font-semibold bg-white/10 hover:bg-white/20 border-white/30 text-white">
                    Войти в кабинет
                  </GlassButton>
                </Link>
                <Link href="/register" passHref className="w-full">
                  <GlassButton className="w-full px-6 py-3 font-semibold bg-blue-500/40 hover:bg-blue-500/60 border-blue-300/40 text-white">
                    Стать партнером
                  </GlassButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-20 px-4">
        <h2 className="text-4xl font-bold text-center text-white mb-12">Тарифные планы</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Trial */}
          <div className="p-8 rounded-3xl backdrop-blur-md bg-white/5 border border-white/10 text-white flex flex-col hover:scale-105 transition-transform">
            <h3 className="text-xl font-bold mb-2">Начальный</h3>
            <div className="text-3xl font-bold mb-6">0 руб. <span className="text-sm font-normal opacity-60">/ всегда</span></div>
            <ul className="space-y-3 mb-8 opacity-80 font-light flex-1">
              <li>• До 3 активных тестов</li>
              <li>• 10 результатов в месяц</li>
              <li>• Линк-система (labels)</li>
            </ul>
            <GlassButton className="w-full bg-white/10 hover:bg-white/20 border-white/20">Выбрать</GlassButton>
          </div>

          {/* Pro */}
          <div className="p-8 rounded-3xl backdrop-blur-md bg-white/20 border-2 border-blue-400/50 text-white flex flex-col transform scale-105 shadow-xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Популярный</div>
            <h3 className="text-xl font-bold mb-2">Профессионал</h3>
            <div className="text-3xl font-bold mb-6">1 990 руб. <span className="text-sm font-normal opacity-60">/ мес</span></div>
            <ul className="space-y-3 mb-8 opacity-90 font-medium flex-1">
              <li>• Безлимит тестов</li>
              <li>• 100 результатов в месяц</li>
              <li>• Выгрузка отчетов в Word</li>
              <li>• Персональный брендинг</li>
            </ul>
            <GlassButton className="w-full bg-blue-500/40 hover:bg-blue-500/60 border-blue-300/40">Подключить Pro</GlassButton>
          </div>

          {/* Enterprise */}
          <div className="p-8 rounded-3xl backdrop-blur-md bg-white/5 border border-white/10 text-white flex flex-col hover:scale-105 transition-transform">
            <h3 className="text-xl font-bold mb-2">Корпорация</h3>
            <div className="text-3xl font-bold mb-6">Индивидуально</div>
            <ul className="space-y-3 mb-8 opacity-80 font-light flex-1">
              <li>• Полный безлимит</li>
              <li>• Кастомные шаблоны отчетов</li>
              <li>• API интеграция</li>
              <li>• Приоритетная поддержка</li>
            </ul>
            <GlassButton className="w-full bg-white/10 hover:bg-white/20 border-white/20">Связаться</GlassButton>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 text-white/50 text-center text-sm px-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <p>© 2024 ProDNK. Платформа для современной психодиагностики.</p>
          <p className="font-medium text-white/70 italic">Предложение не является публичной офертой.</p>
        </div>
      </footer>
    </main>
  );
}
