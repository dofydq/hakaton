import Link from 'next/link';
import { GlassButton } from '@/components/ui/GlassButton';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-[pulse_10s_ease-in-out_infinite]">
      <div className="w-full max-w-4xl p-12 text-center rounded-3xl backdrop-blur-xl bg-white/10 dark:bg-black/20 shadow-2xl border border-white/20 text-white">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-md">
          ПрофДНК: Конструктор психологических тестов
        </h1>
        <p className="text-xl md:text-2xl mb-12 font-medium opacity-90 drop-shadow-sm max-w-2xl mx-auto">
          Создавайте сложные тесты с ветвлением и получайте отчеты в DOCX за секунды
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-4">Для клиентов</h2>
            <p className="opacity-80 mb-6">Регистрация не нужна. Просто перейдите по индивидуальной ссылке, которую вам отправил ваш психолог или профориентолог.</p>
          </div>
          
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-4">Для специалистов</h2>
            <p className="opacity-80 mb-6">Создавайте тесты и управляйте результатами клиентов в едином кабинете.</p>
            <div className="flex flex-col w-full gap-4">
              <Link href="/login" passHref className="w-full">
                <GlassButton className="w-full px-6 py-3 font-semibold bg-white/10 hover:bg-white/20 border-white/30 text-white">
                  Войти
                </GlassButton>
              </Link>
              <Link href="/register" passHref className="w-full">
                <GlassButton className="w-full px-6 py-3 font-semibold bg-blue-500/40 hover:bg-blue-500/60 border-blue-300/40 text-white">
                  Подать заявку
                </GlassButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
