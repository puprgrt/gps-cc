import type {NextConfig} from 'next';
import fs from 'fs';

// --- MONKEY PATCH FOR NODE.JS WINDOWS EISDIR BUG ---
// On some Windows drives (exFAT, network), fs.readlink on a file throws EISDIR instead of EINVAL.
// Webpack expects EINVAL to know it's a file. This causes build failures on route.ts.
const originalReadlink = fs.readlink;
const originalReadlinkSync = fs.readlinkSync;

// @ts-ignore
fs.readlink = function (path, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'function' ? null : options;
  originalReadlink(path, opts, (err, linkString) => {
    if (err && err.code === 'EISDIR') {
      err.code = 'EINVAL';
    }
    cb(err, linkString);
  });
};

fs.readlinkSync = function (path, options) {
  try {
    return originalReadlinkSync(path, options);
  } catch (err: any) {
    if (err && err.code === 'EISDIR') {
      err.code = 'EINVAL';
    }
    throw err;
  }
};
const originalReadlinkPromise = fs.promises.readlink;
fs.promises.readlink = async function (path, options) {
  try {
    return await originalReadlinkPromise(path, options);
  } catch (err: any) {
    if (err && err.code === 'EISDIR') {
      err.code = 'EINVAL';
    }
    throw err;
  }
};

try {
  const gracefulFs = require('graceful-fs');
  const originalGracefulReadlink = gracefulFs.readlink;
  gracefulFs.readlink = function (path: any, options: any, callback: any) {
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'function' ? null : options;
    originalGracefulReadlink(path, opts, (err: any, linkString: any) => {
      if (err && err.code === 'EISDIR') {
        err.code = 'EINVAL';
      }
      cb(err, linkString);
    });
  };
} catch (e) {}
// ---------------------------------------------------

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
