'use client'

import Image from 'next/image'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { formatFileSize, formatDate } from '../lib/utils'
import { useMediaGalleryViewModel } from '../model/useMediaGalleryViewModel'

export function MediaGallery() {
  const vm = useMediaGalleryViewModel()
  const galleryState = vm.viewGalleryState()

  if (galleryState === 'loading') {
    return <LoadingView />
  }
  if (galleryState === 'error') {
    return <ErrorView errorMesage={vm.error!} onRetry={vm.refreshFiles} />
  }
  if (galleryState === 'empty') {
    return <EmptyView />
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900">Media Gallery</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{vm.fileStats.total} files</span>
            <span>•</span>
            <span>{vm.fileStats.images} images</span>
            <span>•</span>
            <span>{vm.fileStats.videos} videos</span>
            {vm.hasSelectedFiles && (
              <>
                <span>•</span>
                <span className="font-medium text-blue-600">{vm.fileStats.selected} selected</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => vm.setView('grid')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                vm.view === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              Grid
            </button>
            <button
              onClick={() => vm.setView('list')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                vm.view === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              List
            </button>
          </div>

          {/* Sort Controls */}
          <select
            value={`${vm.sortBy}-${vm.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [
                'name' | 'date' | 'size',
                'asc' | 'desc',
              ]
              vm.handleSortChange(sortBy)
              if (vm.sortOrder !== sortOrder) {
                vm.handleSortChange(sortBy) // This will toggle the order
              }
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="size-desc">Largest First</option>
            <option value="size-asc">Smallest First</option>
          </select>

          {/* Actions */}
          {vm.hasSelectedFiles && (
            <Button variant="destructive" size="sm" onClick={vm.handleDeleteSelected}>
              Delete Selected ({vm.fileStats.selected})
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={vm.refreshFiles}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Selection Controls */}
      {vm.hasFiles && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div className="flex items-center space-x-4">
            <label className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={vm.allFilesSelected}
                onChange={vm.toggleAllSelection}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {vm.allFilesSelected ? 'Deselect All' : 'Select All'}
              </span>
            </label>

            {vm.hasSelectedFiles && (
              <span className="text-sm text-gray-600">
                {vm.fileStats.selected} of {vm.fileStats.total} files selected
              </span>
            )}
          </div>

          {vm.hasSelectedFiles && (
            <Button variant="ghost" size="sm" onClick={() => vm.deselectAllFiles()}>
              Clear Selection
            </Button>
          )}
        </div>
      )}

      {/* Gallery */}
      {vm.view === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {vm.files.map((file) => (
            <div
              key={file.key}
              className={cn(
                'group relative cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md',
                vm.isFileSelected(file.key) && 'ring-2 ring-blue-500',
              )}
              onClick={() => vm.toggleFileSelection(file.key)}
            >
              {/* Selection checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={vm.isFileSelected(file.key)}
                  onChange={() => {}} // Handled by parent click
                  className="h-4 w-4 rounded border-white bg-white/90 text-blue-600 shadow-lg focus:ring-blue-500"
                />
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  vm.handleDeleteFile(file.key)
                }}
                className="absolute top-2 right-2 z-10 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Media preview */}
              <div className="aspect-square">
                {vm.isImage(file) ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={file.url}
                      alt={file.fileName || file.key}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : vm.isVideo(file) ? (
                  <video
                    src={file.url}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    controls
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <svg
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* File info overlay */}
              <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/70 to-transparent p-3">
                <p className="truncate text-xs font-medium text-white">
                  {file.fileName || file.key.split('/').pop()}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs text-white/80">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-xs font-medium',
                      vm.isImage(file) ? 'bg-green-500/80' : 'bg-blue-500/80',
                    )}
                  >
                    {vm.getFileType(file)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="divide-y divide-gray-200">
            {vm.files.map((file) => (
              <div
                key={file.key}
                className={cn(
                  'flex cursor-pointer items-center p-4 hover:bg-gray-50',
                  vm.isFileSelected(file.key) && 'bg-blue-50',
                )}
                onClick={() => vm.toggleFileSelection(file.key)}
              >
                {/* Selection checkbox */}
                <input
                  type="checkbox"
                  checked={vm.isFileSelected(file.key)}
                  onChange={() => {}} // Handled by parent click
                  className="mr-4 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                {/* Thumbnail */}
                <div className="mr-4 h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {vm.isImage(file) ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={file.url}
                        alt={file.fileName || file.key}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : vm.isVideo(file) ? (
                    <video
                      src={file.url}
                      className="h-full w-full object-cover"
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* File details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {file.fileName || file.key.split('/').pop()}
                    </p>
                    <div className="ml-4 flex items-center space-x-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-xs font-medium',
                          vm.isImage(file)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800',
                        )}
                      >
                        {vm.getFileType(file)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>{formatDate(file.lastModified)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex items-center space-x-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-gray-400 transition-colors hover:text-blue-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      vm.handleDeleteFile(file.key)
                    }}
                    className="p-2 text-gray-400 transition-colors hover:text-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingView() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">Loading media files...</span>
    </div>
  )
}

function ErrorView({ errorMesage, onRetry }: { errorMesage: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <div className="mb-4 text-red-600">
        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-red-800">Error Loading Files</h3>
      <p className="mb-4 text-red-600">{errorMesage}</p>
      <Button onClick={onRetry} variant="secondary">
        Try Again
      </Button>
    </div>
  )
}

function EmptyView() {
  return (
    <div className="py-12 text-center">
      <div className="mb-4 text-gray-400">
        <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">No media files found</h3>
      <p className="text-gray-500">Upload some files to get started!</p>
    </div>
  )
}
