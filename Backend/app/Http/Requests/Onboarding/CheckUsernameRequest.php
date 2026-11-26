<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;

class CheckUsernameRequest extends FormRequest
{
    public const USERNAME_PATTERN = '/^[A-Za-z0-9_]{3,20}$/';

    public const USERNAME_MESSAGE = 'Use 3–20 letters, numbers or underscores.';

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'regex:'.self::USERNAME_PATTERN],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.required' => self::USERNAME_MESSAGE,
            'username.regex' => self::USERNAME_MESSAGE,
        ];
    }
}
