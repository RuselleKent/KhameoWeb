/** "Step 1 of 3" dots under the Email verified and Google welcome screens (verify, consent, onboarding). */
export default function StepDots() {
  return (
    <div className="flex justify-center gap-1.5">
      <span aria-hidden="true" className="h-1.5 w-6 rounded-full bg-brand" />
      <span aria-hidden="true" className="size-1.5 rounded-full bg-field" />
      <span aria-hidden="true" className="size-1.5 rounded-full bg-field" />
      <span className="sr-only">Step 1 of 3</span>
    </div>
  );
}
