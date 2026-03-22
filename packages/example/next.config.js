/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Allow importing from parent directory (the package source)
  transpilePackages: ['@alexgorbatchev/agentation'],
};

module.exports = nextConfig;
