import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../../../assets/logo.png';
import Button from '../../../components/ui/Button';
import Container from '../../../components/ui/Container';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For groups', href: '#for-groups' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // Close the mobile menu on Escape, or when the viewport grows past md (768px).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const mq = window.matchMedia('(min-width: 768px)');
    const onResize = (e) => e.matches && setOpen(false);
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-canvas/90 backdrop-blur-md">
      <Container as="nav" aria-label="Main" className="flex h-16 items-center justify-between gap-4">
        <Link to="/" onClick={close} className="flex shrink-0 items-center gap-2.5 rounded-lg">
          <img src={logo} alt="" width="36" height="36" className="size-9 rounded-full" />
          <span className="font-display text-xl text-brand">Khameo</span>
        </Link>

        {/* Desktop links (≥768px) */}
        <ul className="hidden items-center gap-1 md:flex lg:gap-2">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:text-ink lg:px-3"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden shrink-0 items-center gap-1 md:flex">
          <Button to="/login" variant="ghost" size="sm">
            Log in
          </Button>
          <Button to="/signup" size="sm">
            Get started
          </Button>
        </div>

        {/* Mobile toggle (<768px) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-accent md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </Container>

      {/* Mobile menu panel */}
      {open && (
        <div id="mobile-menu" className="border-t border-ink/5 bg-canvas md:hidden">
          <Container className="py-4">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={close}
                    className="block rounded-lg px-2 py-3 text-base font-medium text-ink hover:bg-ink/5"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2 border-t border-ink/5 pt-4">
              <Button to="/login" variant="secondary" className="w-full" onClick={close}>
                Log in
              </Button>
              <Button to="/signup" className="w-full" onClick={close}>
                Get started
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
