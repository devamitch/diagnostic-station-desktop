// import { routing } from '@/i18n/routing';
// import { NextRequest, NextResponse } from 'next/server';

// export function middleware(request: NextRequest) {
// 	const { pathname } = request.nextUrl;
// 	const authToken = request.cookies.get('auth_token')?.value;

// 	// Check if the pathname is exactly "/"
// 	if (pathname === '/') {
// 		const defaultLocale = routing.defaultLocale;
// 		const url = request.nextUrl.clone();
// 		url.pathname = `/${defaultLocale}`;
// 		return NextResponse.redirect(url);
// 	}

// 	// Check if the pathname starts with a valid locale
// 	const pathnameHasLocale = routing.locales.some(
// 		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
// 	);

// 	if (!pathnameHasLocale) {
// 		// Redirect to default locale if no locale is present
// 		const defaultLocale = routing.defaultLocale;
// 		const url = request.nextUrl.clone();
// 		url.pathname = `/${defaultLocale}${pathname}`;
// 		return NextResponse.redirect(url);
// 	}

// 	// Auth protection logic
// 	const isAuthRoute = 
// 		pathname.includes('/signin') || 
// 		pathname.includes('/login') || 
// 		pathname.includes('/register') ||
// 		pathname.includes('/signup');

// 	const isProtectedRoute = 
// 		pathname.includes('/dashboard') || 
// 		pathname.includes('/profile') ||
// 		pathname.includes('/settings');

// 	// If user has auth token and tries to access auth routes, redirect to dashboard
// 	if (authToken && isAuthRoute) {
// 		const url = request.nextUrl.clone();
// 		// Get the current locale from pathname or use default
// 		const currentLocale = routing.locales.find(locale => 
// 			pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
// 		) || routing.defaultLocale;
// 		url.pathname = `/${currentLocale}/dashboard`;
// 		return NextResponse.redirect(url);
// 	}

// 	// If user doesn't have auth token and tries to access protected routes, redirect to signin
// 	if (!authToken && isProtectedRoute) {
// 		const url = request.nextUrl.clone();
// 		// Get the current locale from pathname or use default
// 		const currentLocale = routing.locales.find(locale => 
// 			pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
// 		) || routing.defaultLocale;
// 		url.pathname = `/${currentLocale}/signin`;
// 		return NextResponse.redirect(url);
// 	}

// 	return NextResponse.next();
// }

// export const config = {
// 	matcher: ['/', '/(ko|ja|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
// };


import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if the pathname is exactly "/"
	if (pathname === '/') {
		const defaultLocale = routing.defaultLocale;
		const url = request.nextUrl.clone();
		url.pathname = `/${defaultLocale}`;
		return NextResponse.redirect(url);
	}

	// Check if the pathname starts with a valid locale
	const pathnameHasLocale = routing.locales.some(
		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
	);

	if (!pathnameHasLocale) {
		// Redirect to default locale if no locale is present
		const defaultLocale = routing.defaultLocale;
		const url = request.nextUrl.clone();
		url.pathname = `/${defaultLocale}${pathname}`;
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/', '/(ko|ja|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
export const dynamic = 'force-static'
