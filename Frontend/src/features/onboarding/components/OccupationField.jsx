import { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { OCCUPATIONS, OTHER_OCCUPATION } from '../occupations';
import { MAX_OCCUPATION } from '../profileRules';

/** Optional occupation: a list, plus a short text field for "Other". `value` is the stored string. */
export default function OccupationField({ value, onChange, error }) {
  const listed = OCCUPATIONS.includes(value);
  // "Other" can be chosen before anything is typed, so it can't be read from `value` alone.
  const [otherChosen, setOtherChosen] = useState(Boolean(value) && !listed);
  const choice = otherChosen ? OTHER_OCCUPATION : value;

  function handleChoice(e) {
    const next = e.target.value;
    setOtherChosen(next === OTHER_OCCUPATION);
    onChange(next === OTHER_OCCUPATION ? '' : next);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-field bg-[#FAF9F6] p-5">
      <Select
        label="Occupation (optional)"
        value={choice}
        onChange={handleChoice}
        error={otherChosen ? undefined : error}
        hint="Tells Khameo who you speak as, so feedback fits your goals."
      >
        <option value="">Choose one</option>
        {[...OCCUPATIONS, OTHER_OCCUPATION].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      {otherChosen && (
        <Input
          label="Your occupation"
          placeholder="Content creator"
          autoComplete="organization-title"
          maxLength={MAX_OCCUPATION}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      )}
    </div>
  );
}
