import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/config.ts');

export default withWorkflow(withNextIntl(nextConfig));
