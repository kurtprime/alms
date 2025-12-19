import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies"; // Import the helper

export async function middleware(request: NextRequest) {
  // Check for the existence of the session cookie
  const session = getSessionCookie(request);

  // If the user is not signed in and trying to access a protected route...
  if (!session) {
    // Redirect them to the sign-in page
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Otherwise, allow the request to continue
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/teacher/:path*"],
};
