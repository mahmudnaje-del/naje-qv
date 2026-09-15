import { VIDEO_THUMBNAILS } from './videoThumbnails';
import { IMAGE_THUMBNAILS } from './imageThumbnails';
import { INFOGRAPHIC_THUMBNAILS } from './infographicThumbnails';

export const ALL_TEMPLATE_THUMBNAILS: Record<string, string> = {
  ...VIDEO_THUMBNAILS,
  ...IMAGE_THUMBNAILS,
  ...INFOGRAPHIC_THUMBNAILS,
};

export { INFOGRAPHIC_THUMBNAILS };

export function getTemplateThumbnail(pathOrKey: string): string {
  if (!pathOrKey) return '';
  if (pathOrKey.startsWith('data:') || pathOrKey.startsWith('http://') || pathOrKey.startsWith('https://')) {
    return pathOrKey;
  }
  const cleanKey = pathOrKey.replace(/^\/?templates\//, '').replace(/\.webp$/, '');
  return ALL_TEMPLATE_THUMBNAILS[cleanKey] || pathOrKey;
}
