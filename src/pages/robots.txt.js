const site = (import.meta.env.SITE ?? 'https://nepal-macro.pages.dev').replace(/\/$/, '');

export async function GET() {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
