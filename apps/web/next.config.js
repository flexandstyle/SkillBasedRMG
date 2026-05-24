/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turborepo: транспиляция пакетов монорепо
  transpilePackages: ['@rmg/shared-types'],
};

module.exports = nextConfig;
