import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

export function createSiteServer() {
  return createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }

    const pathname = request.url.split('?')[0];
    if (pathname !== '/' && pathname !== '/index.html') {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : 'Not found');
      return;
    }

    try {
      const html = await readFile(new URL('../index.html', import.meta.url));
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : html);
    } catch (error) {
      console.error(error);
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : 'Unable to load the page');
    }
  });
}

if (import.meta.main) {
  const port = Number(process.env.PORT || 3000);
  const server = createSiteServer();
  server.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`Hello World is available at http://localhost:${server.address().port}`);
  });
}
