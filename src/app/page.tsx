import { UploadZone } from '@/widgets/UploadZone/UploadZone'
import { UploadProgressList } from '@/widgets/UploadProgressList/UploadProgressList'
import { MediaGallery } from '@/widgets/MediaGallery/MediaGallery'

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Media Vault</h1>

      <UploadZone />

      <UploadProgressList />

      <MediaGallery />
    </main>
  )
}
