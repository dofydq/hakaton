'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Brain, ArrowRight, ArrowLeft, Send, AlertCircle } from 'lucide-react'
import { publicApi, Question } from '@/lib/api/client'
import { toast } from 'sonner'

export default function PublicTestPage() {
  const params = useParams()
  const router = useRouter()
  const linkId = params.linkId as string

  const [currentStep, setCurrentStep] = useState(0) // 0 = intro, 1+ = questions
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [clientInfo, setClientInfo] = useState({ name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: testData, error, isLoading } = useSWR(
    linkId ? `public-link-${linkId}` : null,
    () => publicApi.getLink(linkId)
  )

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-muted-foreground">Загрузка теста...</p>
        </div>
      </div>
    )
  }

  if (error || !testData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Тест не найден</CardTitle>
            <CardDescription>
              Эта ссылка недействительна или срок её действия истёк. Обратитесь к психологу за новой ссылкой.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const questions = testData.questions
  const totalQuestions = questions.length
  const currentQuestion = currentStep > 0 ? questions[currentStep - 1] : null
  const progress = currentStep === 0 ? 0 : (currentStep / (totalQuestions + 1)) * 100

  const handleAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentStep < totalQuestions) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await publicApi.submit({
        link_id: linkId,
        answers,
        client_name: clientInfo.name || undefined,
        client_email: clientInfo.email || undefined,
      })
      router.push(`/test/${linkId}/success`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось отправить тест')
      setIsSubmitting(false)
    }
  }

  const isCurrentAnswered = currentQuestion && answers[currentQuestion.id]
  const canSubmit = Object.keys(answers).length === totalQuestions

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
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

      {/* Progress */}
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Progress value={progress} className="h-2" />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {currentStep === 0 
            ? 'Введение'
            : `Вопрос ${currentStep} из ${totalQuestions}`
          }
        </p>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {currentStep === 0 ? (
          // Introduction
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-outfit text-2xl">{testData.test_title}</CardTitle>
              {testData.test_description && (
                <CardDescription className="text-base">
                  {testData.test_description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p>
                    В тесте <strong>{totalQuestions} вопросов</strong>.
                    Пожалуйста, отвечайте честно. Ваши ответы помогут специалисту лучше понять ситуацию.
                  </p>
                </div>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">Ваше имя</FieldLabel>
                    <Input
                      id="name"
                      placeholder="Введите имя"
                      value={clientInfo.name}
                      onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Ваш email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Введите email"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    />
                  </Field>
                </FieldGroup>
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <Button size="lg" onClick={handleNext} disabled={!clientInfo.name.trim() || !clientInfo.email.trim()}>
                Начать тест
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ) : currentQuestion ? (
          // Question
          <QuestionCard
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswer={(value) => handleAnswer(currentQuestion.id, value)}
            questionNumber={currentStep}
            totalQuestions={totalQuestions}
          />
        ) : null}

        {/* Navigation */}
        {currentStep > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>

            {currentStep < totalQuestions ? (
              <Button onClick={handleNext} disabled={!isCurrentAnswered}>
                Далее
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Spinner className="mr-2" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Отправить
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function QuestionCard({
  question,
  answer,
  onAnswer,
  questionNumber,
  totalQuestions,
}: {
  question: Question
  answer: string | string[] | undefined
  onAnswer: (value: string | string[]) => void
  questionNumber: number
  totalQuestions: number
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {questionNumber}
          </div>
          <CardTitle className="flex-1 text-lg leading-relaxed">
            {question.text}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
            {question.type === 'single' ? (
          <RadioGroup
            value={answer as string}
            onValueChange={onAnswer}
            className="space-y-3"
          >
            {question.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-3">
            {question.options.map((option) => {
              const selected = (answer as string[] || []).includes(option.id)
              return (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                    selected ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <Checkbox
                    id={option.id}
                    checked={selected}
                    onCheckedChange={(checked) => {
                      const currentAnswers = (answer as string[]) || []
                      if (checked) {
                        onAnswer([...currentAnswers, option.id])
                      } else {
                        onAnswer(currentAnswers.filter((a) => a !== option.id))
                      }
                    }}
                  />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
