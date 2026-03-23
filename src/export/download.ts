export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function triggerUtf8Download(
  body: string,
  filename: string,
  mime: string,
): void {
  triggerBlobDownload(new Blob([body], { type: mime }), filename)
}
