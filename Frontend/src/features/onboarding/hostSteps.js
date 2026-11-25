const STEPS = {
  school: ['Host type', 'School email', 'Two-factor', 'Role proof', 'Submitted'],
  community: ['Host type', 'Two-factor', 'Community proof', 'Submitted'],
};

/** "Host verification · 2 of 5 · School email" (community hosts have fewer steps). */
export function hostStepNote(type, step) {
  const steps = STEPS[type];
  return `Host verification · ${steps.indexOf(step) + 1} of ${steps.length} · ${step}`;
}
