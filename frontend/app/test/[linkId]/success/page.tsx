import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, CheckCircle, Home } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-center px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <span className="font-outfit font-semibold">ProfDNK</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="font-outfit text-2xl">Тест завершён</CardTitle>
            <CardDescription className="text-base">Спасибо за прохождение теста</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Ваши ответы успешно отправлены. Психолог сможет ознакомиться с результатами и связаться с вами при необходимости.
              </p>
              <div className="rounded-lg bg-muted/50 p-4 text-sm">Если у вас остались вопросы, свяжитесь со специалистом, который отправил вам ссылку на тест.</div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Вернуться на главную
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
