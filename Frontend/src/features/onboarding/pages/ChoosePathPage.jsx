import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import PathCard from '../components/PathCard';
import { PATHS } from '../paths';
import { useOnboarding } from '../useOnboarding';

export default function ChoosePathPage() {
  const navigate = useNavigate();
  const { answers, updateAnswers } = useOnboarding();
  const selected = PATHS.find((path) => path.id === answers.path);

  function handleSubmit(e) {
    e.preventDefault();
    if (selected) navigate(`/onboarding/${selected.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <title>How do you want to use Khameo? · Khameo</title>

      <h1 id="path-heading" className="text-[28px] leading-tight text-ink sm:text-[36px]">
        How do you want to use Khameo?
      </h1>
      <p className="text-[15px] leading-5 text-muted">
        Pick one to personalize your start. You can change this later in Settings.
      </p>

      <div
        role="radiogroup"
        aria-labelledby="path-heading"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-6"
      >
        {PATHS.map((path) => (
          <PathCard
            key={path.id}
            name="path"
            value={path.id}
            title={path.title}
            description={path.description}
            next={path.next}
            checked={path.id === answers.path}
            onChange={() => updateAnswers({ path: path.id })}
          />
        ))}
      </div>

      <Button type="submit" size="blockLg" disabled={!selected}>
        Continue
      </Button>
    </form>
  );
}
