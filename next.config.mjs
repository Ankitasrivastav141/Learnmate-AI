/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['officeparser', 'pdf-parse', 'mammoth', 'yauzl'],
    outputFileTracingIncludes: {
      '/**': ['./prisma/dev.db'],
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
