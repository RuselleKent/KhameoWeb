<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The 6-digit code that finishes an email log in. Same shape as email_verification_codes,
        // kept apart so a log in never uses up a sign-up code (or the other way round).
        Schema::create('login_codes', function (Blueprint $table) {
            $table->id();

            // One active code per user; sending a new code replaces the row
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            // Only a hash of the 6-digit code is stored
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts_left');
            $table->timestamp('expires_at');
            $table->timestamp('resend_available_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_codes');
    }
};
