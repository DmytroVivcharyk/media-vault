export function validateImageFile(file: File): string | null {
  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

  if (!file.type.startsWith('image/')) {
    return 'Only images are allowed.'
  }

  if (file.size > MAX_SIZE) {
    return 'Max file size is 10MB.'
  }

  return null
}
