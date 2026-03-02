import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  output: "standalone",

  // Add this images configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Recommended: Also add UploadThing domains if you are using it
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
    ],
  },
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

// Wrap with bundle analyzer (only enabled when ANALYZE=true)
const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Merge MDX config with Next.js config, then wrap with analyzer
export default withAnalyzer(withMDX(nextConfig));
