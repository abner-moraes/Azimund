import { LIMITS } from '../../config/limits.js';
import { megabytes } from '../../api/projectContract.js';

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// previa so em memoria por agora pq o arquivo original vai ser enviado pro back
export function readProfilePhoto(file) {
  if (!PHOTO_TYPES.includes(file.type)) {
    return Promise.reject(new Error('Selecione uma imagem'));
  }
  if (file.size > LIMITS.fileBytes) {
    return Promise.reject(new Error(`Máximo de ${megabytes(LIMITS.fileBytes)} MB.`));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const fail = () => reject(new Error('Não foi possível abrir a imagem'));
    reader.onerror = fail;
    reader.onabort = fail;
    reader.onload = () => {
      const image = new Image();
      image.onerror = fail;
      image.onload = () => resolve(reader.result); // so aceita se o navegador conseguiu abrir como imagem
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
