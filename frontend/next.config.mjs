import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Image Docker : sortie « standalone » (serveur autonome, dépendances de production tracées, sans npm).
  // Localement `npm run build` / `npm start` restent inchangés.
  output: process.env.NEXT_OUTPUT_STANDALONE === "1" ? "standalone" : undefined,
  outputFileTracingRoot: here,
  transpilePackages: ["@react-three/fiber", "@react-three/drei", "three"],
  experimental: {
    optimizePackageImports: ["@react-three/drei", "lucide-react"],
  },
};
export default nextConfig;
