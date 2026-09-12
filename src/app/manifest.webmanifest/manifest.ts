import type { MetadataRoute } from 'next';
import { APP } from '@/lib/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP.name,
    short_name: APP.shortName,
    description: APP.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0e13',
    theme_color: '#0b0e13',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
