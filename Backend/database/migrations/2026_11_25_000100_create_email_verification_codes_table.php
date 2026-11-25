<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_verification_codes', function (Blueprint $table) {
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
        Schema::dropIfExists('email_verification_codes');
    }
};