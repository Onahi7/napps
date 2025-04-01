import { FileText, FileImage, FileVideo, FileAudio, FileArchive, File } from 'lucide-react'

interface FileIconProps {
  className?: string
  fileType?: string
}

export function FileIcon({ className, fileType }: FileIconProps) {
  const type = fileType?.toLowerCase() || '';

  if (type.includes('pdf') || type.includes('doc') || type.includes('txt')) {
    return <FileText className={className} />
  }
  if (type.includes('image') || type.includes('png') || type.includes('jpg')) {
    return <FileImage className={className} />
  }
  if (type.includes('video') || type.includes('mp4')) {
    return <FileVideo className={className} />
  }
  if (type.includes('audio') || type.includes('mp3')) {
    return <FileAudio className={className} />
  }
  if (type.includes('zip') || type.includes('rar')) {
    return <FileArchive className={className} />
  }
  
  return <File className={className} />
}