// Vercel Edge Middleware for Basic Auth on /admin routes
export const config = {
  matcher: '/admin/:path*',
};

export default function middleware(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Resteeped Admin"',
      },
    });
  }

  // Parse credentials - handle both with and without 'Basic ' prefix
  const base64Part = authHeader.startsWith('Basic ') 
    ? authHeader.slice(6) 
    : authHeader.split(' ')[1];
  
  if (!base64Part) {
    return new Response('Invalid authorization header', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Resteeped Admin"',
      },
    });
  }

  // Decode base64 (Edge runtime compatible)
  let credentials;
  try {
    credentials = atob(base64Part);
  } catch (e) {
    return new Response('Invalid credentials encoding', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Resteeped Admin"',
      },
    });
  }

  // Split on first colon only (password might contain colons)
  const colonIndex = credentials.indexOf(':');
  if (colonIndex === -1) {
    return new Response('Invalid credentials format', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Resteeped Admin"',
      },
    });
  }
  
  const username = credentials.slice(0, colonIndex);
  const password = credentials.slice(colonIndex + 1);

  // Check against env vars (must be set in Vercel before deploy)
  const validUser = process.env.ADMIN_USERNAME || 'admin';
  const validPass = process.env.ADMIN_PASSWORD || 'resteeped2026';

  if (username !== validUser || password !== validPass) {
    return new Response('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Resteeped Admin"',
      },
    });
  }

  // Allow request to continue
  return;
}
