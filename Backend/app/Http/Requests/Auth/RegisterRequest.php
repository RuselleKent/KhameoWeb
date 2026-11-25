<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Emails are stored lowercase, so "Jane@Mail.com" and "jane@mail.com" count as one account.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name')),
            'email' => strtolower(trim((string) $this->input('email'))),
        ]);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'password_confirmation' => ['required', 'same:password'],
            'confirmed_age' => ['accepted'],
            'accepted_terms' => ['accepted'],
        ];
    }

    /**
     * Messages the React form shows word for word (see docs/api-auth.md).
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Enter your full name.',
            'name.max' => 'That name is too long.',
            'email.required' => 'Enter your email.',
            'email.email' => 'Enter a valid email address.',
            'email.max' => 'Enter a valid email address.',
            'email.unique' => 'This email is already registered.',
            'password.required' => 'Enter a password.',
            'password.min' => 'Use at least 8 characters.',
            'password_confirmation.required' => 'Re-enter your password.',
            'password_confirmation.same' => 'Passwords don’t match.',
            'confirmed_age.accepted' => 'You must be 18 or older to use Khameo.',
            'accepted_terms.accepted' => 'Please accept the terms to continue.',
        ];
    }
}