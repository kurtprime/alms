import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  output: "standalone",
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
