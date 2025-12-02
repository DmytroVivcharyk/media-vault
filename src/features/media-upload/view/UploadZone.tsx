'use client'

import { cn } from '@/shared/lib/utils'
import { Button, ProgressBar } from '@/shared/ui'
import { useUploadViewModel } from '../model/useUploadViewModel'
import { useDragAndDrop } from '../hooks/useDragAndDrop'

export function UploadZone() {
  const vm = useUploadViewModel()
  const { isDragging, handleDrop, handleDragOver, handleDragLeave, handleFileSelect } =
    useDragAndDrop({
      onFileDrop: vm.handleFileDrop,
    })

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200',
          'hover:border-blue-400 hover:bg-blue-50/50',
          isDragging ? 'scale-[1.02] border-blue-500 bg-blue-50' : 'border-gray-300',
        )}
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          accept="image/*,video/*"
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="space-y-4">
            {/* Upload Icon */}
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                />
              </svg>
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragging ? 'Drop files here' : 'Drop files here or click to browse'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Support for images and videos up to 100MB
              </p>
            </div>

            {/* File type indicators */}
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center">
                <span className="mr-1 h-2 w-2 rounded-full bg-green-400"></span>
                Images
              </span>
              <span className="flex items-center">
                <span className="mr-1 h-2 w-2 rounded-full bg-blue-400"></span>
                Videos
              </span>
            </div>
          </div>
        </label>
      </div>

      {/* Upload Progress and Controls */}
      {vm.hasFiles && (
        <div className="space-y-4 rounded-lg bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-gray-900">Upload Progress</h3>
              <p className="text-sm text-gray-600">
                {vm.completedCount} of {vm.files.length} files completed
                {vm.errorCount > 0 && (
                  <span className="ml-2 text-red-600">({vm.errorCount} failed)</span>
                )}
              </p>
            </div>

            <div className="flex space-x-2">
              {vm.errorCount > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={vm.retryFailedUploads}
                  disabled={vm.isAnyUploading}
                >
                  Retry Failed
                </Button>
              )}

              <Button
                onClick={vm.startBatchUpload}
                disabled={vm.isAnyUploading || vm.pendingCount === 0}
                isLoading={vm.isAnyUploading}
                size="sm"
              >
                {vm.isAnyUploading ? 'Uploading...' : `Upload ${vm.pendingCount} Files`}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={vm.clearCompleted}
                disabled={vm.completedCount === 0 && vm.errorCount === 0}
              >
                Clear Completed
              </Button>
            </div>
          </div>

          {/* Overall Progress */}
          <ProgressBar
            progress={vm.totalProgress}
            variant={vm.errorCount > 0 ? 'error' : 'primary'}
            showLabel={true}
          />

          {/* File List */}
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {vm.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
              >
                <div className="flex min-w-0 flex-1 items-center space-x-3">
                  {/* File preview */}
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={file.previewUrl}
                      alt={file.file.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // Fallback to file type icon if image fails to load
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>

                  {/* File info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{file.file.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{(file.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                      <span>•</span>
                      <span
                        className={cn('capitalize', {
                          'text-yellow-600': file.status === 'pending',
                          'text-blue-600': file.status === 'uploading',
                          'text-green-600': file.status === 'success',
                          'text-red-600': file.status === 'error',
                        })}
                      >
                        {file.status}
                      </span>
                    </div>

                    {/* Individual progress */}
                    {(file.status === 'uploading' || file.status === 'success') && (
                      <ProgressBar
                        progress={vm.progress[file.id] ?? 0}
                        size="sm"
                        variant={file.status === 'success' ? 'success' : 'primary'}
                        showLabel={false}
                      />
                    )}

                    {/* Error message */}
                    {file.error && <p className="mt-1 text-xs text-red-600">{file.error}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {file.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => vm.uploadSingleFile(file.id)}
                      disabled={vm.isAnyUploading}
                    >
                      Upload
                    </Button>
                  )}

                  {file.status === 'error' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => vm.uploadSingleFile(file.id)}
                    >
                      Retry
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => vm.removeFile(file.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
