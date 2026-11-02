const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

// previa so em memoria por agora pq o arquivo original vai ser enviado pro back
export function readProfilePhoto(file) {
  if (!PHOTO_TYPES.includes(file.type)) {
    return Promise.reject(new Error('selecione uma imagem'));
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return Promise.reject(new Error('máximo de 5 MB.'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const fail = () => reject(new Error('não foi possível abrir a imagem'));
    reader.onerror = fail;
    reader.onabort = fail;
    reader.onload = () => {
      const image = new Image();
      image.onerror = fail;
      image.onload = () => resolve(reader.result);
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
