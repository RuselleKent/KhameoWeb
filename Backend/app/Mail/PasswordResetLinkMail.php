<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PasswordResetLinkMail extends Mailable
{
    public function __construct(
        public User $user,
        public string $url,
        public int $expiresInMinutes,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Reset your Khameo password');
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.password-reset-link');
    }
}
