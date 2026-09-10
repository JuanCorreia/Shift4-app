const isDev = process.env.NODE_ENV !== "production";
// React Fast Refresh needs eval in development only
const scriptSrc = isDev ? "'self' 'unsafe-eval' 'unsafe-inline'" : "'self' 'unsafe-inline'";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.neon.tech; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
