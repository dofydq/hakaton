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
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link href="/login" passHref className="w-full sm:w-auto">
            <GlassButton className="w-full px-8 py-4 text-lg font-semibold bg-white/10 hover:bg-white/20 border-white/30 text-white">
              Войти
            </GlassButton>
          </Link>
          <Link href="/register" passHref className="w-full sm:w-auto">
            <GlassButton className="w-full px-8 py-4 text-lg font-semibold bg-blue-500/40 hover:bg-blue-500/60 border-blue-300/40 text-white">
              Начать работу
            </GlassButton>
          </Link>
        </div>
      </div>
    </main>
  );
}
