import { Link, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <main className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-gray-600">{error?.statusText || error?.message}</p>
        <Link to="/" className="text-teal-700 font-semibold">Back to Welcome</Link>
      </div>
    </main>
  );
}