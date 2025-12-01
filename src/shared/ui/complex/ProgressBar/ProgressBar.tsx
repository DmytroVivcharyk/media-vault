import { cn } from '@/shared/lib/utils'

export interface ProgressBarProps {
  progress: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  animated?: boolean
}

export function ProgressBar({
  progress,
  size = 'md',
  variant = 'primary',
  showLabel = true,
  animated = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div
        className={cn('w-full overflow-hidden rounded-full bg-gray-200', {
          'h-1': size === 'sm',
          'h-2': size === 'md',
          'h-3': size === 'lg',
        })}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            animated && 'transition-transform',
            {
              'bg-blue-500': variant === 'primary',
              'bg-green-500': variant === 'success',
              'bg-yellow-500': variant === 'warning',
              'bg-red-500': variant === 'error',
            },
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}
