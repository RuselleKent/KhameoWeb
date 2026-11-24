import Button from '../../../components/ui/Button';

/** Back + Continue row. Continue submits the form around it. */
export default function StepActions({ backTo, continueLabel = 'Continue', continueDisabled = false }) {
  return (
    <div className="flex gap-3">
      <Button variant="secondary" size="lg" to={backTo}>
        Back
      </Button>
      <Button type="submit" size="blockLg" disabled={continueDisabled}>
        {continueLabel}
      </Button>
    </div>
  );
}
