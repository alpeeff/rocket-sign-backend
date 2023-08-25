export type FilesContentType = 'image/webp' | 'video/mp4'

export interface FileDTO {
  buffer: Buffer
  contentType: FilesContentType
}
