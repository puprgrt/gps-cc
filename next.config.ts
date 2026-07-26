import type {NextConfig} from 'next';


const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    'firebase-admin',
    'pino',
    'qrcode-terminal',
    '@google/genai'
  ],
  webpack: (config, { dev }) => {
    config.cache = false;
    if (config.resolve) {
      config.resolve.symlinks = false;
    }
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/server/data/**',
          '**/baileys_auth_garut/**'
        ],
      };
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.wisatagunung.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['motion'],
};

export default nextConfig;
