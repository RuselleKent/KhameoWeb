<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChangeEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Emails are stored lowercase, like at sign-up.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->input('email'))),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::notIn([$this->user()->email]),
                Rule::unique('users', 'email')->ignore($this->user()->id),
            ],
        ];
    }

    /**
     * Messages the verify-email page shows word for word (docs/api-auth.md section 3a).
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Enter your new email.',
            'email.email' => 'Enter a valid email address.',
            'email.max' => 'Enter a valid email address.',
            'email.not_in' => 'That’s already your email.',
            'email.unique' => 'This email is already registered.',
        ];
    }
}
