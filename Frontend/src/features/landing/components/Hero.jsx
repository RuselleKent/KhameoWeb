import heroImage from '../../../assets/hero.png';
import Button from '../../../components/ui/Button';
import Container from '../../../components/ui/Container';

export default function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="py-12 sm:py-16 lg:py-24">
      <Container className="grid items-center gap-10 md:grid-cols-2 md:gap-8 lg:gap-16">
        <div>
          <h1
            id="hero-heading"
            className="font-display text-4xl leading-[1.1] text-ink sm:text-5xl lg:text-6xl"
          >
            Practice speaking. Get scored.{' '}
            <span className="text-brand">Get better.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted lg:text-xl">
            AI feedback on your Content, Delivery, Structure and Engagement, plus real-time
            rehearsals with your team.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to="/signup" size="lg" className="w-full sm:w-auto">
              Start practicing
            </Button>
            <Button href="#how-it-works" variant="secondary" size="lg" className="w-full sm:w-auto">
              See how it works
            </Button>
          </div>
        </div>

        <div className="flex justify-center rounded-card bg-white p-8 ring-1 ring-ink/5 sm:p-12">
          {/* Source image is 343×361; capped near native size so it stays sharp. */}
          <img
            src={heroImage}
            alt=""
            width="343"
            height="361"
            className="h-auto w-full max-w-[280px] lg:max-w-[343px]"
          />
        </div>
      </Container>
    </section>
  );
}
