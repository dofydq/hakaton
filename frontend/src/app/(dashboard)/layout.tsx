export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout min-h-screen relative">
      {/* 
        Специфичное меню или боковая панель для психолога может быть добавлена сюда. 
        На данный момент хедер выведен внутри самой страницы dashboard для красивой анимации.
      */}
      {children}
    </div>
  );
}
