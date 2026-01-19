'use client'

import { MediaFilesProvider } from '@/entities/media/model/mediaFilesStore'
import { MediaFilesGate } from '@/entities/media/ui/gates/MediaFilesGate'
import { UploadProvider, UploadZone } from '@/features/media-upload'
import { MediaGalleryProvider, MediaGallery } from '@/features/media-gallery'

export default function MediaVaultPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Media Vault</h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Upload, manage, and organize your media files with ease. Support for images and videos
            with drag-and-drop functionality.
          </p>
        </div>

        <div className="space-y-12">
          {/* Upload Section */}
          <section>
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Upload Files</h2>
              <p className="text-gray-600">
                Drop your files here or click to browse. Multiple files supported.
              </p>
            </div>

            <UploadProvider>
              <UploadZone />
            </UploadProvider>
          </section>

          {/* Gallery Section */}
          <section>
            <MediaFilesProvider>
              <MediaFilesGate autoRefreshInterval={5000} />

              <MediaGalleryProvider>
                <MediaGallery />
              </MediaGalleryProvider>
            </MediaFilesProvider>
          </section>
        </div>
      </div>
    </div>
  )
}
