<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;

class UploadAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * JPG, PNG or WEBP up to 5 MB (docs/api-onboarding.md section 2).
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'avatar' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $wrongFile = 'Upload a JPG, PNG or WEBP up to 5 MB.';

        return [
            'avatar.required' => 'Choose a photo.',
            'avatar.file' => $wrongFile,
            'avatar.uploaded' => $wrongFile,
            'avatar.mimes' => $wrongFile,
            'avatar.max' => $wrongFile,
        ];
    }
}
