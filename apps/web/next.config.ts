import type { NextConfig } from "next";

import { securityHeaders } from "./src/lib/security/headers.ts";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(process.env.NODE_ENV === "production"),
      },
    ];
  },
  async redirects() {
    return [
      { source: "/nutrition", destination: "/", permanent: false },
      { source: "/design", destination: "/browse", permanent: false },
      { source: "/donations/new/location", destination: "/donations/new/dates#pickup-location", permanent: false },
    ];
  },
};

export default nextConfig;
