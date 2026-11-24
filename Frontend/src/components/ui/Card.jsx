import { cn } from '../../lib/utils';

/** White surface with the design-system radius. Pass `as` to change the element. */
export default function Card({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn('rounded-card bg-white p-6 shadow-sm ring-1 ring-ink/5', className)}
      {...props}
    >
      {children}
    </Component>
  );
}
