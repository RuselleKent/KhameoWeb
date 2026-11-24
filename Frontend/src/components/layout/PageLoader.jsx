import { LoaderCircle } from 'lucide-react';

/** Full-screen spinner, e.g. while the app checks who is signed in. */
export default function PageLoader({ label = 'Loading' }) {
  return (
    <div role="status" className="grid min-h-dvh place-items-center bg-canvas">
      <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-brand" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
