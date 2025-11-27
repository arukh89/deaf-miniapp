'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Mail, WifiOff } from 'lucide-react'

export type ErrorType = 'camera' | 'network' | 'auth' | 'general' | 'speech'

interface ErrorMessageProps {
  type?: ErrorType
  message?: string
  onRetry?: () => void
  onReport?: () => void
}

const ERROR_CONFIGS = {
  camera: {
    icon: AlertCircle,
    title: "Camera Access Issue",
    defaultMessage: "Oops! We couldn't access your camera.",
    tips: [
      "Check your browser permissions for camera access",
      "Make sure no other app is using the camera",
      "Try refreshing the page"
    ],
    support: "If the problem continues, your browser may not support camera access, or your device settings may need adjustment."
  },
  network: {
    icon: WifiOff,
    title: "Connection Problem",
    defaultMessage: "Oops! Something went wrong with the network.",
    tips: [
      "Check your internet connection",
      "Try refreshing the page",
      "Wait a moment and try again"
    ],
    support: "If you're still having trouble, the service may be temporarily unavailable. Please try again in a few minutes."
  },
  auth: {
    icon: AlertCircle,
    title: "Authentication Issue",
    defaultMessage: "We couldn't verify your Farcaster account.",
    tips: [
      "Make sure you're logged into Farcaster",
      "Try refreshing the page",
      "Check if you're using the latest version of Warpcast"
    ],
    support: "Your experience is important to us. If this continues, please contact support."
  },
  speech: {
    icon: AlertCircle,
    title: "Voice Output Issue",
    defaultMessage: "Oops! We couldn't play the voice output.",
    tips: [
      "Check your device's volume settings",
      "Make sure your browser supports text-to-speech",
      "Try selecting a different language"
    ],
    support: "Some browsers may not support all languages. Try using Chrome or Safari for the best experience."
  },
  general: {
    icon: AlertCircle,
    title: "Something Went Wrong",
    defaultMessage: "Oops! Something unexpected happened.",
    tips: [
      "Try refreshing the page",
      "Check your internet connection",
      "Clear your browser cache"
    ],
    support: "We're working to fix any issues. If this problem persists, please let us know so we can help you better."
  }
}

export function ErrorMessage({ 
  type = 'general', 
  message, 
  onRetry, 
  onReport 
}: ErrorMessageProps): JSX.Element {
  const config = ERROR_CONFIGS[type]
  const Icon = config.icon

  const handleReport = (): void => {
    if (onReport) {
      onReport()
    } else {
      // Default report action - open email
      const subject = encodeURIComponent(`Issue Report: ${config.title}`)
      const body = encodeURIComponent(
        `Issue Type: ${type}\nMessage: ${message || config.defaultMessage}\n\nPlease describe what you were doing when this happened:`
      )
      window.open(`mailto:support@example.com?subject=${subject}&body=${body}`, '_blank')
    }
  }

  return (
    <Alert variant="destructive" className="border-red-300 bg-red-50">
      <Icon className="h-5 w-5 text-red-600" />
      <AlertTitle className="text-red-900 font-semibold mb-2">
        {config.title}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-red-800">
          {message || config.defaultMessage}
        </p>
        
        <div className="space-y-2">
          <p className="font-medium text-red-900 text-sm">Try these steps:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
            {config.tips.map((tip: string, index: number) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-red-700 italic">
          {config.support}
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline" 
              size="sm"
              className="border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button 
            onClick={handleReport}
            variant="outline" 
            size="sm"
            className="border-red-300 hover:bg-red-100"
          >
            <Mail className="w-4 h-4 mr-2" />
            Report Issue
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
