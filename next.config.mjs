/** @type {import('next').NextConfig} */
const nextConfig = {
  // السماح للـ preview proxy (e2b / surge) بالوصول لسيرفر التطوير
  allowedDevOrigins: [
    '*.e2b.app',
    '*.surge.sh',
    'localhost',
    '127.0.0.1',
  ],
};

export default nextConfig;
