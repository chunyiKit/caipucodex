export async function compressImage(file: File): Promise<File> {
  if (file.size <= 1024 * 1024) return file;
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ratio = Math.min(1, 1600 / Math.max(imageBitmap.width, imageBitmap.height));
  canvas.width = Math.round(imageBitmap.width * ratio);
  canvas.height = Math.round(imageBitmap.height * ratio);
  const context = canvas.getContext('2d');
  if (!context) return file;
  context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
}
