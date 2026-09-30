import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leidžia atidaryti dev serverį iš kitų vietinio tinklo įrenginių (pvz. telefono per 192.168.1.x)
  allowedDevOrigins: ["192.168.1.*"],
};

export default nextConfig;
