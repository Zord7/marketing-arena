import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 text-center">
      <div>
        <div className="text-8xl font-extrabold text-[#6c63ff] mb-4 leading-none">404</div>
        <h1 className="text-3xl font-bold mb-3">Page not found</h1>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-[#6c63ff] hover:bg-[#574fd6] font-semibold transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-colors border border-white/10"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
