<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // "Before you record": when the user agreed, and to which version of the text
            $table->timestamp('recording_consent_at')->nullable()->after('onboarded_at');
            $table->string('consent_version', 20)->nullable()->after('recording_consent_at');

            // Answers from the onboarding screens
            $table->string('onboarding_path', 20)->nullable()->after('consent_version');
            $table->json('goals')->nullable()->after('onboarding_path');

            // Profile step
            $table->string('display_name', 80)->nullable()->after('name');
            $table->string('username', 20)->nullable()->after('display_name');
            $table->string('bio', 160)->nullable()->after('username');
            $table->json('roles')->nullable()->after('bio'); // [{ name, audiences: [...] }]
            $table->string('avatar_path')->nullable()->after('roles');

            // Host path: when two-factor was turned on
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('password');
        });

        // Usernames are unique regardless of case ("Jane_C" and "jane_c" are the same)
        DB::statement('CREATE UNIQUE INDEX users_username_lower_unique ON users (lower(username))');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS users_username_lower_unique');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'recording_consent_at', 'consent_version', 'onboarding_path', 'goals',
                'display_name', 'username', 'bio', 'roles', 'avatar_path', 'two_factor_confirmed_at',
            ]);
        });
    }
};
