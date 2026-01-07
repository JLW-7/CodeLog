import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*', '/timer/:path*', '/api/projects/:path*', '/api/sessions/:path*', '/api/records/:path*', '/api/files/:path*'],
};