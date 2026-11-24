import { useNavigate } from 'react-router-dom';
import StepActions from '../../components/StepActions';
import StepHeading from '../../components/StepHeading';
import { GOALS, MAX_GOALS } from '../../goals';
import { useOnboarding } from '../../useOnboarding';
import { cn } from '../../../../lib/utils';

export default function GoalsPage() {
  const navigate = useNavigate();
  const { answers, updateAnswers } = useOnboarding();
  const { goals } = answers;
  const full = goals.length >= MAX_GOALS;

  function toggle(goalId) {
    updateAnswers({ goals: goals.includes(goalId) ? goals.filter((g) => g !== goalId) : [...goals, goalId] });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (goals.length > 0) navigate('/onboarding/personal/profile');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <title>What do you want to improve? · Khameo</title>

      <StepHeading
        pathId="personal"
        title="What do you want to improve?"
        description={`Choose up to ${MAX_GOALS}. We’ll point you to the right practice first.`}
      />

      <div role="group" aria-labelledby="skills-label" className="flex flex-col gap-2.5">
        <p id="skills-label" className="text-[15px] leading-5 font-semibold text-ink">
          Skills
        </p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map(({ id, label }) => {
            const selected = goals.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                disabled={full && !selected}
                onClick={() => toggle(id)}
                className={cn(
                  'rounded-full border px-4 py-2.5 text-sm leading-[18px] font-semibold transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  selected
                    ? 'border-brand bg-brand text-white hover:bg-brand-dark'
                    : 'border-field bg-white text-ink hover:enabled:border-brand/50',
                )}
              >
                {selected && <span aria-hidden="true">✓ </span>}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <p aria-live="polite" className="text-[13.5px] leading-[18px] text-muted">
        {goals.length} of {MAX_GOALS} skills selected
      </p>

      <StepActions backTo="/onboarding" continueDisabled={goals.length === 0} />
    </form>
  );
}
