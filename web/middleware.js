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

  // Parse credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(':');

  // Check against env vars (set in Vercel dashboard)
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
