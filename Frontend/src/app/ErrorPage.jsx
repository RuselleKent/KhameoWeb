import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-6 text-center">
      <title>{notFound ? 'Page not found · Khameo' : 'Something went wrong · Khameo'}</title>
      <div className="flex max-w-[420px] flex-col items-center gap-3">
        <h1 className="text-[32px] leading-tight text-ink">{notFound ? 'Page not found' : 'Something went wrong'}</h1>
        <p className="text-sm leading-[21px] text-muted">
          {notFound
            ? 'This page doesn’t exist. Check the link, or start again from the home page.'
            : 'Reload the page to try again. If it keeps happening, start again from the home page.'}
        </p>
        <Link to="/" className="font-bold text-brand underline underline-offset-2 hover:text-brand-dark">
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
