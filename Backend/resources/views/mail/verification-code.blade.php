<x-mail::message>
# Verify your email

Hi {{ $user->name }},

Your Khameo verification code is:

<x-mail::panel>
{{ $code }}
</x-mail::panel>

This code expires in {{ $expiresInMinutes }} minutes. If you didn't create a Khameo account, you can ignore this email.

Thanks,<br>
The Khameo team
</x-mail::message>