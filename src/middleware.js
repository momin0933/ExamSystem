import { NextResponse } from 'next/server';
export function middleware(request) {
  const token = request.cookies.get('authToken'); // Check for the token
  // Early return if no token found, redirecting to login.
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url)); // Redirect to login
  }
  // Continue to the requested route if the token is found.
  return NextResponse.next();
}
export const config = {
  matcher: [
    '/homepage/:path*',
    '/addCandidate/:path*', 
    '/addQuestion/:path*', 
    '/addSubject/:path*', 
    '/addSet/:path*', 
    '/addExam/:path*', 
    '/insertQuestion/:path*', 
    '/participantsList/:path*', 
    '/setEntry/:path*', 
    '/examStart/:path*', 
    '/examEnd/:path*', 
    '/examPage/:path*', 
    '/participate/:path*', 
  ],
};