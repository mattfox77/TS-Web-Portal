'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';

export default function Header() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Company Name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">TS</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg hidden sm:block">
                Tech Support Computer Services
              </span>
              <span className="font-semibold text-gray-900 text-lg sm:hidden">
                TSCS
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`${
                isActive('/') ? 'text-blue-600' : 'text-gray-700'
              } hover:text-blue-600 transition`}
            >
              Home
            </Link>
            <Link
              href="/services"
              className={`${
                isActive('/services') ? 'text-blue-600' : 'text-gray-700'
              } hover:text-blue-600 transition`}
            >
              Services
            </Link>
            <Link
              href="/about"
              className={`${
                isActive('/about') ? 'text-blue-600' : 'text-gray-700'
              } hover:text-blue-600 transition`}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={`${
                isActive('/contact') ? 'text-blue-600' : 'text-gray-700'
              } hover:text-blue-600 transition`}
            >
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:block px-4 py-2 text-blue-600 hover:text-blue-700 transition"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 space-y-2">
          <Link
            href="/"
            className={`block px-3 py-2 rounded ${
              isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
          >
            Home
          </Link>
          <Link
            href="/services"
            className={`block px-3 py-2 rounded ${
              isActive('/services') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
          >
            Services
          </Link>
          <Link
            href="/about"
            className={`block px-3 py-2 rounded ${
              isActive('/about') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`block px-3 py-2 rounded ${
              isActive('/contact') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
          >
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}
