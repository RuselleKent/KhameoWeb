<?php

namespace App\Http\Requests\Onboarding;

use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteOnboardingRequest extends FormRequest
{
    public const PATHS = ['personal', 'member', 'coach', 'host'];

    public const GOALS = [
        'fewer_filler_words', 'steady_pace', 'confident_tone', 'clear_opening', 'strong_closing', 'stay_on_time',
    ];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Trim the text fields and collapse spaces in role and audience names.
     */
    protected function prepareForValidation(): void
    {
        $profile = $this->input('profile');

        if (! is_array($profile)) {
            return;
        }

        $clean = fn ($value) => is_string($value) ? trim(preg_replace('/\s+/u', ' ', $value)) : $value;

        foreach (['display_name', 'username', 'bio'] as $field) {
            if (array_key_exists($field, $profile)) {
                $profile[$field] = $clean($profile[$field]);
            }
        }

        if (isset($profile['roles']) && is_array($profile['roles'])) {
            $profile['roles'] = array_map(function ($role) use ($clean) {
                if (! is_array($role)) {
                    return $role;
                }
                $role['name'] = $clean($role['name'] ?? null);
                if (isset($role['audiences']) && is_array($role['audiences'])) {
                    $role['audiences'] = array_map($clean, $role['audiences']);
                }

                return $role;
            }, $profile['roles']);
        }

        $this->merge(['profile' => $profile]);
    }

    /**
     * docs/api-onboarding.md section 3.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'path' => ['required', Rule::in(self::PATHS)],
            'goals' => ['sometimes', 'array', 'max:3'],
            'goals.*' => ['string', Rule::in(self::GOALS)],
            'profile' => ['required', 'array'],
            'profile.display_name' => ['required', 'string', 'max:80'],
            'profile.username' => ['required', 'string', 'regex:'.CheckUsernameRequest::USERNAME_PATTERN, $this->usernameIsFree()],
            'profile.bio' => ['nullable', 'string', 'max:160'],
            'profile.roles' => ['sometimes', 'array', 'max:5'],
            'profile.roles.*' => ['array'],
            'profile.roles.*.name' => ['required', 'string', 'max:40', 'distinct:ignore_case'],
            'profile.roles.*.audiences' => ['present', 'array', 'max:20'],
            'profile.roles.*.audiences.*' => ['required', 'string', 'max:40'],
        ];
    }

    /**
     * Unique regardless of case; the user's own username counts as free.
     */
    private function usernameIsFree(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            $taken = User::query()
                ->whereRaw('lower(username) = ?', [strtolower((string) $value)])
                ->whereKeyNot($this->user()->id)
                ->exists();

            if ($taken) {
                $fail('That username is taken.');
            }
        };
    }

    /**
     * Messages the profile step shows word for word.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $audienceLength = 'Use 1–40 characters for an audience.';

        return [
            'path.required' => 'Choose how you want to use Khameo.',
            'path.in' => 'Choose how you want to use Khameo.',
            'goals.array' => 'Choose up to 3.',
            'goals.max' => 'Choose up to 3.',
            'goals.*.in' => 'Choose up to 3.',
            'goals.*.string' => 'Choose up to 3.',
            'profile.required' => 'Enter a display name.',
            'profile.display_name.required' => 'Enter a display name.',
            'profile.display_name.max' => 'Use up to 80 characters.',
            'profile.username.required' => CheckUsernameRequest::USERNAME_MESSAGE,
            'profile.username.regex' => CheckUsernameRequest::USERNAME_MESSAGE,
            'profile.bio.max' => 'Use up to 160 characters.',
            'profile.roles.array' => 'Add up to 5 roles.',
            'profile.roles.max' => 'Add up to 5 roles.',
            'profile.roles.*.name.required' => 'Use 1–40 characters for a role.',
            'profile.roles.*.name.string' => 'Use 1–40 characters for a role.',
            'profile.roles.*.name.max' => 'Use 1–40 characters for a role.',
            'profile.roles.*.name.distinct' => 'You already added this role.',
            'profile.roles.*.audiences.present' => 'Check up to 20 audiences per role.',
            'profile.roles.*.audiences.array' => 'Check up to 20 audiences per role.',
            'profile.roles.*.audiences.max' => 'Check up to 20 audiences per role.',
            'profile.roles.*.audiences.*.required' => $audienceLength,
            'profile.roles.*.audiences.*.string' => $audienceLength,
            'profile.roles.*.audiences.*.max' => $audienceLength,
        ];
    }
}
