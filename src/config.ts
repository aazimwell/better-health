/**
 * Developer credits — edit these values freely.
 * To use your real photo: put it at src/assets/developer.jpg and set DEVELOPER.photo = require('./assets/developer.jpg').
 */
export const DEVELOPER = {
  name: 'Azim R.',
  role: 'App Developer',
  description: 'Designed and developed the Better Health appointment management app.',
  photo: require('./assets/developer.jpg') as any,
  links: [
    { label: 'Email', icon: 'mail', url: 'mailto:azim4web@gmail.com' },
  ] as { label: string; icon: string; url: string }[],
};
export const APP_VERSION = '1.0.0';
