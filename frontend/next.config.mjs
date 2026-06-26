/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@react-three/fiber", "@react-three/drei", "three"],
  experimental: {
    optimizePackageImports: ["@react-three/drei", "lucide-react"],
  },
};
export default nextConfig;
