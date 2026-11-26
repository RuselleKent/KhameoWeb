<x-mail::message>
# Reset your password

Hi {{ $user->name }},

We got a request to reset your Khameo password. The link works once and expires in {{ $expiresInMinutes }} minutes.

<x-mail::button :url="$url">
Set a new password
</x-mail::button>

If you didn't ask for this, you can ignore this email. Your password stays the same.

Thanks,<br>
The Khameo team
</x-mail::message>
