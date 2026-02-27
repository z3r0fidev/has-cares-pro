import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // next-intl plugin uses the old experimental.turbo.resolveAlias API;
  // Next.js 16 renamed this to turbopack.resolveAlias.
  turbopack: {
    resolveAlias: {
      'next-intl/config': './src/i18n/request.ts',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'logo.clearbit.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
