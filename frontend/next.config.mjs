/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Toutes les requêtes vers /api/... sont transmises au backend Express.
  // Pour le navigateur, l'API est donc sur le même domaine que le site :
  // le cookie d'authentification est envoyé automatiquement.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL ?? 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
