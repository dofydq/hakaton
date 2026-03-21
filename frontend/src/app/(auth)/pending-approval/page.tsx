import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl backdrop-blur-xl bg-white/30 dark:bg-black/30 shadow-2xl border border-white/20 text-center">
        <h1 className="text-3xl font-bold mb-4">Ваша заявка на модерации</h1>
        <p className="opacity-80 mb-8">
          Администратор проверит ваши данные и скоро предоставит доступ к личному кабинету психолога.
        </p>
        <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 transition-all font-medium border border-white/30">
          Вернуться ко входу
        </Link>
      </div>
    </main>
  );
}
