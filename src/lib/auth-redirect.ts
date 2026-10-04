// Use the page's actual origin: production builds can also run on localhost.
// Both local and deployed callback URLs must be allowed in Supabase Auth.
export function authRedirectUrl(origin: string): string {
  return new URL("/auth", origin).href;
}
