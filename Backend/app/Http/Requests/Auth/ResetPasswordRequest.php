<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->input('email'))),
        ]);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'min:8', 'regex:/[A-Za-z]/', 'regex:/\d/'],
            'password_confirmation' => ['required', 'same:password'],
        ];
    }

    /**
     * Messages the reset page shows word for word (docs/api-auth.md section 6).
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // A broken link: the page offers a new one
            'token.required' => 'This reset link has expired. Ask for a new one.',
            'email.required' => 'This reset link has expired. Ask for a new one.',
            'email.email' => 'This reset link has expired. Ask for a new one.',
            'password.required' => 'Enter a new password.',
            'password.min' => 'Use at least 8 characters.',
            'password.regex' => 'Use a mix of letters and numbers.',
            'password_confirmation.required' => 'Re-enter your password.',
            'password_confirmation.same' => 'Passwords don’t match.',
        ];
    }
}
