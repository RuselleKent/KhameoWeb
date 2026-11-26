<x-mail::message>
# Your log in code

Hi {{ $user->name }},

Use this code to finish logging in to Khameo:

<x-mail::panel>
{{ $code }}
</x-mail::panel>

This code expires in {{ $expiresInMinutes }} minutes. If you didn't try to log in, someone may know your password: reset it from the log in page.

Thanks,<br>
The Khameo team
</x-mail::message>
