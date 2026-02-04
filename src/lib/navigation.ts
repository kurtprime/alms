// src/lib/navigation.ts
import { usePathname } from "next/navigation";

/**
 * Checks if a navigation item is active based on current pathname
 * - Exact match: /calendar matches /calendar
 * - Prefix match: /settings matches /settings/profile (for nested routes)
 * - Root exception: / only matches exactly /, not /anything
 */
export function useIsActivePath(href: string): boolean {
  const pathname = usePathname();

  if (!pathname) return false;

  // Normalize paths (remove trailing slashes except for root)
  const normalizedHref = href === "/" ? "/" : href.replace(/\/$/, "");
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // Exact match
  if (normalizedPath === normalizedHref) return true;

  // For root, only exact match
  if (normalizedHref === "/") return false;

  // Check if current path starts with href (for nested routes)
  // Ensure we match /settings but not /settings-other
  return normalizedPath.startsWith(normalizedHref + "/");
}

/**
 * Utility for server components or static checks
 */
export function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;

  const normalizedHref = href === "/" ? "/" : href.replace(/\/$/, "");
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  if (normalizedPath === normalizedHref) return true;
  if (normalizedHref === "/") return false;

  return normalizedPath.startsWith(normalizedHref + "/");
}
