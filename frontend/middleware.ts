import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Определяем публичные маршруты, которые доступны без авторизации
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/test', // Публичные тесты (по ссылкам)
  '/static', // Статические файлы
  '/api/public', // Публичные API эндпоинты
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value

  // 1. Разрешаем доступ к статическим ресурсам и API
  if (
    pathname.startsWith('/_next') || 
    pathname.includes('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 2. Проверяем, является ли маршрут публичным
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // 3. Если маршрут НЕ публичный и токена нет — редирект на логин
  if (!isPublicRoute && !token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  // 4. Если пользователь авторизован и идет на страницу логина/регистрации — редирект в дашборд
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

// Настройка путей для middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
