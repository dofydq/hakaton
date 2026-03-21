'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ResultScoresChartProps {
  scores: Record<string, number>
}

export function ResultScoresChart({ scores }: ResultScoresChartProps) {
  const data = Object.entries(scores).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
    value: value,
    fullMark: 100,
  }))

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Данные по шкалам отсутствуют
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="bar" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="bar">Столбцы</TabsTrigger>
        <TabsTrigger value="radar">Радар</TabsTrigger>
      </TabsList>

      <TabsContent value="bar">
        <Card>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} className="text-muted-foreground" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    className="text-muted-foreground"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="radar">
        <Card>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis 
                    dataKey="name" 
                    className="text-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    className="text-muted-foreground"
                  />
                  <Radar
                    name="Баллы"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
