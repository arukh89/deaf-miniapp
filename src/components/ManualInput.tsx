'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Keyboard } from 'lucide-react'

interface ManualInputProps {
  onSubmit: (text: string) => void
}

export function ManualInput({ onSubmit }: ManualInputProps): JSX.Element {
  const [text, setText] = useState<string>('')

  const handleSubmit = (): void => {
    if (text.trim()) {
      onSubmit(text.trim())
      setText('')
    }
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-indigo-900/60 backdrop-blur-xl border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-indigo-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
            <Keyboard className="w-5 h-5 text-white" />
          </div>
          Manual Input (English)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="manual-text" className="text-indigo-300">Enter text to translate</Label>
          <Textarea
            id="manual-text"
            placeholder="Type your message in English..."
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            rows={4}
            className="resize-none bg-slate-950/50 border-indigo-500/30 text-white placeholder:text-gray-500 focus:border-indigo-400 focus:ring-indigo-400/50"
          />
        </div>
        <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/50 border-0" disabled={!text.trim()}>
          Translate Text
        </Button>
      </CardContent>
    </Card>
  )
}
