'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ExternalLink, Share2 } from 'lucide-react'

interface SuccessMessageProps {
  title?: string
  message: string
  onShare?: () => void
  link?: {
    url: string
    label: string
  }
}

export function SuccessMessage({ 
  title = "Success!",
  message,
  onShare,
  link
}: SuccessMessageProps) {
  return (
    <Alert className="border-green-300 bg-green-50">
      <CheckCircle2 className="h-5 w-5 text-green-600" />
      <AlertTitle className="text-green-900 font-semibold">
        {title}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-green-800">
          {message}
        </p>

        {(onShare || link) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {onShare && (
              <Button 
                onClick={onShare}
                variant="outline" 
                size="sm"
                className="border-green-300 hover:bg-green-100"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
            {link && (
              <Button 
                onClick={() => window.open(link.url, '_blank')}
                variant="outline" 
                size="sm"
                className="border-green-300 hover:bg-green-100"
              >
                {link.label}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
