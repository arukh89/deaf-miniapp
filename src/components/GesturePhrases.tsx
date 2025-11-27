'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GESTURE_PHRASES } from '@/lib/constants'
import { Hand, Heart, MessageCircle, AlertCircle, Navigation, Home as HomeIcon } from 'lucide-react'
import { useState } from 'react'

interface GesturePhrasesProps {
  onSelectPhrase: (phraseKey: string) => void
}

export function GesturePhrases({ onSelectPhrase }: GesturePhrasesProps): JSX.Element {
  const [expandedCategory, setExpandedCategory] = useState<string>('greetings')

  // Organize phrases by category
  const categories = {
    greetings: {
      title: 'Greetings & Social',
      icon: Hand,
      color: 'from-pink-500 to-rose-500',
      phrases: ['hello', 'goodbye', 'goodmorning', 'goodnight', 'howareyou', 'nice'],
    },
    polite: {
      title: 'Polite Expressions',
      icon: Heart,
      color: 'from-purple-500 to-pink-500',
      phrases: ['thankyou', 'thankyouverymuch', 'please', 'sorry', 'excuseme', 'youarewelcome'],
    },
    understanding: {
      title: 'Understanding & Agreement',
      icon: MessageCircle,
      color: 'from-blue-500 to-cyan-500',
      phrases: ['yes', 'no', 'understand', 'notunderstand', 'agree', 'maybe'],
    },
    requests: {
      title: 'Requests & Needs',
      icon: AlertCircle,
      color: 'from-orange-500 to-red-500',
      phrases: ['help', 'wait', 'repeat', 'slowly', 'water', 'bathroom'],
    },
    emotions: {
      title: 'Emotions & States',
      icon: Heart,
      color: 'from-emerald-500 to-teal-500',
      phrases: ['happy', 'sad', 'tired', 'sick', 'hungry'],
    },
    directions: {
      title: 'Places & Directions',
      icon: Navigation,
      color: 'from-indigo-500 to-purple-500',
      phrases: ['home', 'hospital', 'left', 'right', 'stop'],
    },
    emergency: {
      title: 'Emergency & Important',
      icon: AlertCircle,
      color: 'from-red-500 to-orange-500',
      phrases: ['emergency', 'danger', 'callpolice'],
    },
    daily: {
      title: 'Daily Life',
      icon: HomeIcon,
      color: 'from-yellow-500 to-amber-500',
      phrases: ['eat', 'drink', 'sleep', 'beautiful', 'love', 'friend'],
    },
  }

  const toggleCategory = (category: string): void => {
    setExpandedCategory(expandedCategory === category ? '' : category)
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-pink-900/60 backdrop-blur-xl border-pink-500/30 shadow-2xl shadow-pink-500/20">
      <CardHeader>
        <CardTitle className="text-lg text-pink-200 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
            <Hand className="w-5 h-5 text-white" />
          </div>
          Common Sign Language Phrases (42+)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-pink-300 mb-4">
          Select a phrase to translate, or use AI gesture detection above
        </p>
        
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(categories).map(([key, category]) => {
            const Icon = category.icon
            const isExpanded = expandedCategory === key
            
            return (
              <div key={key} className="space-y-2">
                <button
                  onClick={() => toggleCategory(key)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                    isExpanded
                      ? 'bg-gradient-to-r ' + category.color + ' border-white/30 shadow-xl'
                      : 'bg-slate-900/40 border-pink-500/20 hover:border-pink-500/40 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        isExpanded 
                          ? 'bg-white/20' 
                          : 'bg-gradient-to-br ' + category.color
                      }`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className={`font-medium ${
                        isExpanded ? 'text-white' : 'text-pink-200'
                      }`}>
                        {category.title}
                      </span>
                      <span className={`text-xs ${
                        isExpanded ? 'text-white/80' : 'text-pink-400'
                      }`}>
                        ({category.phrases.length})
                      </span>
                    </div>
                    <span className={`text-sm transition-transform ${
                      isExpanded ? 'rotate-180 text-white' : 'text-pink-300'
                    }`}>
                      ▼
                    </span>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-2 animate-in slide-in-from-top duration-200">
                    {category.phrases.map((phraseKey) => {
                      const phrase = GESTURE_PHRASES[phraseKey as keyof typeof GESTURE_PHRASES]
                      if (!phrase) return null
                      
                      return (
                        <Button
                          key={phraseKey}
                          onClick={() => onSelectPhrase(phraseKey)}
                          variant="outline"
                          size="sm"
                          className={`bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border-pink-500/30 text-pink-200 hover:bg-gradient-to-br hover:${category.color} hover:text-white hover:border-white/30 hover:shadow-lg transition-all duration-200 text-xs h-auto py-2 px-3`}
                        >
                          <span className="truncate">{phrase.en}</span>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(30, 30, 50, 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #ec4899, #f43f5e);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #db2777, #e11d48);
          }
        `}</style>
      </CardContent>
    </Card>
  )
}
