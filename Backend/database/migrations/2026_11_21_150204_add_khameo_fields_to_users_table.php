<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // "I agree to the Terms and Privacy Policy" checkbox
            $table->timestamp('terms_accepted_at')->nullable()->after('password');

            // "Continue with Google Account"
            $table->string('google_id')->nullable()->unique()->after('email');

            // Host verification: none → pending → verified / rejected
            $table->string('host_status')->default('none')->after('terms_accepted_at');

            // Account status: active / suspended / deactivated
            $table->string('account_status')->default('active')->after('host_status');
            $table->text('suspension_reason')->nullable()->after('account_status');

            // The one System Administrator
            $table->boolean('is_admin')->default(false)->after('suspension_reason');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'terms_accepted_at', 'google_id', 'host_status',
                'account_status', 'suspension_reason', 'is_admin',
            ]);
        });
    }
};