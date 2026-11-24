import { cn } from '../../lib/utils';

/** Centered max-width wrapper with responsive side padding (16 / 24 / 32px). */
export default function Container({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}
      {...props}
    >
      {children}
    </Component>
  );
}
