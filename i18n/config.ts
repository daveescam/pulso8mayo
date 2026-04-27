import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Siempre usar español
  const locale = 'es';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
