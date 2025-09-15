/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the experimental appDir flag as it's no longer needed in newer Next.js versions
  // and can cause hydration issues
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
}

module.exports = nextConfig

