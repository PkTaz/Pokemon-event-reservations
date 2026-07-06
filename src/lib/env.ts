/** Runtime env access — bracket notation avoids build-time inlining on Netlify/Vercel. */
export function getAdminPassword(): string | undefined {
  const value = process.env["ADMIN_PASSWORD"];
  return value?.trim() || undefined;
}
