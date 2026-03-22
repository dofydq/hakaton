'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, GripVertical, Plus, Save, Trash2 } from 'lucide-react'
import { testsApi } from '@/lib/api/client'

const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Текст варианта обязателен'),
  value: z.number(),
})

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Текст вопроса обязателен'),
  type: z.enum(['single', 'multiple']),
  options: z.array(optionSchema).min(2, 'Нужно минимум 2 варианта ответа'),
})

const testSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  report_config: z.object({
    show_table: z.boolean(),
    show_chart: z.boolean(),
    show_interpretation: z.boolean(),
  }),
  questions: z.array(questionSchema).min(1, 'Добавьте хотя бы один вопрос'),
})

type TestForm = z.infer<typeof testSchema>

export default function EditTestPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.id as string
  const [isSaving, setIsSaving] = useState(false)

  const { data: test, isLoading } = useSWR(testId ? `test-${testId}` : null, () => testsApi.get(testId))

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<TestForm>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: '',
      description: '',
      report_config: {
        show_table: true,
        show_chart: false,
        show_interpretation: true,
      },
      questions: [],
    },
  })

  const { fields: questions, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
  })

  useEffect(() => {
    if (!test) return
    reset({
      title: test.title,
      description: test.description || '',
      report_config: test.report_config || {
        show_table: true,
        show_chart: false,
        show_interpretation: true,
      },
      questions: test.questions.map((question) => ({
        id: question.id,
        text: question.text,
        type: question.type,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          value: option.value,
        })),
      })),
    })
  }, [test, reset])

  const onSubmit = async (data: TestForm) => {
    setIsSaving(true)
    try {
      await testsApi.update(testId, {
        title: data.title,
        description: data.description,
        report_config: data.report_config,
        questions: data.questions.map((question, qIndex) => ({
          id: question.id || `q-${qIndex + 1}`,
          text: question.text,
          type: question.type,
          options: question.options.map((option, oIndex) => ({
            id: option.id || `q${qIndex + 1}-o${oIndex + 1}`,
            text: option.text,
            value: option.value,
          })),
        })),
      })
      toast.success('Тест обновлён')
      router.push('/dashboard/tests')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось обновить тест')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tests">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Назад к тестам</span>
          </Link>
        </Button>
        <div>
          <h1 className="font-outfit text-2xl font-bold text-foreground">Редактирование теста</h1>
          <p className="text-muted-foreground">Обновите психологический опросник</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>Укажите название и описание теста</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Название теста</FieldLabel>
                <Input id="title" placeholder="Название теста" {...register('title')} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Описание</FieldLabel>
                <Textarea id="description" rows={3} {...register('description')} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Настройки отчёта</CardTitle>
            <CardDescription>Выберите, какие элементы будут включены в результат для клиента</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
               <div className="flex items-center space-x-2 border rounded-lg p-4 bg-muted/20">
                  <input 
                    type="checkbox" 
                    id="show_table" 
                    {...register('report_config.show_table')} 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="show_table" className="text-sm font-medium leading-none cursor-pointer">
                    Таблица баллов
                  </label>
               </div>
               <div className="flex items-center space-x-2 border rounded-lg p-4 bg-muted/20">
                  <input 
                    type="checkbox" 
                    id="show_chart" 
                    {...register('report_config.show_chart')} 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="show_chart" className="text-sm font-medium leading-none cursor-pointer">
                    График шкал
                  </label>
               </div>
               <div className="flex items-center space-x-2 border rounded-lg p-4 bg-muted/20">
                  <input 
                    type="checkbox" 
                    id="show_interpretation" 
                    {...register('report_config.show_interpretation')} 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="show_interpretation" className="text-sm font-medium leading-none cursor-pointer">
                    Интерпретация
                  </label>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-outfit text-lg font-semibold text-foreground">Вопросы</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendQuestion({
                  text: '',
                  type: 'single',
                  options: [
                    { text: '', value: 0 },
                    { text: '', value: 1 },
                  ],
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить вопрос
            </Button>
          </div>

          {questions.map((question, qIndex) => (
            <QuestionCard
              key={question.id}
              index={qIndex}
              register={register}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              onRemove={() => removeQuestion(qIndex)}
              canRemove={questions.length > 1}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/tests">Отмена</Link>
          </Button>
          <Button type="submit" disabled={isSaving || !isDirty}>
            {isSaving ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить изменения
          </Button>
        </div>
      </form>
    </div>
  )
}

function QuestionCard({
  index,
  register,
  control,
  errors,
  watch,
  setValue,
  onRemove,
  canRemove,
}: {
  index: number
  register: any
  control: any
  errors: any
  watch: any
  setValue: any
  onRemove: () => void
  canRemove: boolean
}) {
  const { fields: options, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `questions.${index}.options`,
  })

  const questionType = watch(`questions.${index}.type`)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
            {index + 1}
          </div>
          <CardTitle className="text-base">Вопрос {index + 1}</CardTitle>
        </div>
        {canRemove && (
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel>Текст вопроса</FieldLabel>
            <Textarea rows={2} placeholder="Введите текст вопроса..." {...register(`questions.${index}.text`)} />
            {errors.questions?.[index]?.text && (
              <p className="text-sm text-destructive">{errors.questions[index].text.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>Тип вопроса</FieldLabel>
            <Select value={questionType} onValueChange={(value) => setValue(`questions.${index}.type`, value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Один вариант</SelectItem>
                <SelectItem value="multiple">Несколько вариантов</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FieldLabel>Варианты ответа</FieldLabel>
            <Button type="button" variant="ghost" size="sm" onClick={() => appendOption({ text: '', value: options.length })}>
              <Plus className="mr-1 h-3 w-3" />
              Добавить вариант
            </Button>
          </div>

          {options.map((option, oIndex) => (
            <div key={option.id} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Input className="flex-1" placeholder={`Вариант ${oIndex + 1}`} {...register(`questions.${index}.options.${oIndex}.text`)} />
              <Input
                type="number"
                className="w-20"
                placeholder="Баллы"
                {...register(`questions.${index}.options.${oIndex}.value`, { valueAsNumber: true })}
              />
              {options.length > 2 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(oIndex)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
