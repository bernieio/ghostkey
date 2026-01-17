export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Only allow PUT method
  if (req.method !== 'PUT') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const walrusUrl = 'https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=5';

  try {
    const walrusRes = await fetch(walrusUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: await req.arrayBuffer(),
    });

    const body = await walrusRes.text();

    return new Response(body, {
      status: walrusRes.status,
      headers: {
        'Content-Type': walrusRes.headers.get('content-type') ?? 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Walrus proxy error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
