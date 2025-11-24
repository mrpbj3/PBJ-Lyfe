// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-4 rounded-lg border bg-white shadow p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Did you forget to add the page to the router?
        </p>
      </div>
    </div>
  );
}
