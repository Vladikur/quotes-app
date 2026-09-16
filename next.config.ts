import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Сборка идёт в CI, а на прод едет только .next/standalone — минимальный
  // набор файлов плюс трассированные node_modules. Сервер (1 vCPU / 900MB)
  // сам собрать Next не может, и держать там полные node_modules незачем.
  output: 'standalone',
}

export default nextConfig
