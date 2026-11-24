import Button from '../../../components/ui/Button';

/** Back + Continue row. Continue submits the form around it. */
export default function StepActions({
  backTo,
  continueLabel = 'Continue',
  continueDisabled = false,
  loading = false,
  loadingText,
}) {
  return (
    <div className="flex gap-3">
      <Button variant="secondary" size="lg" to={backTo} className="shrink-0">
        Back
      </Button>
      {/* Long labels ("Join ACLC Speech Center · BSIT 4-A") may wrap on phones. */}
      <Button
        type="submit"
        size="blockLgWrap"
        disabled={continueDisabled}
        loading={loading}
        loadingText={loadingText}
        className="min-w-0"
      >
        {continueLabel}
      </Button>
    </div>
  );
}
