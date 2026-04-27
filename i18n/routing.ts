import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // Lista de locales soportados
  locales: ['es'],

  // Locale por defecto
  defaultLocale: 'es',

  // No usar prefijos de locale en las URLs ya que solo tenemos español
  localePrefix: 'never'
});
