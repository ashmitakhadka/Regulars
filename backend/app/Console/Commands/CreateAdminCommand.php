<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CreateAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create {email} {--name=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new superadmin account';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = Str::lower(trim((string) $this->argument('email')));

        $validator = Validator::make(['email' => $email], [
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ], [
            'email.unique' => "The email '{$email}' already exists in the system.",
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return Command::FAILURE;
        }

        $name = $this->option('name') ? trim((string) $this->option('name')) : null;
        if (! $name) {
            $name = $this->ask('Enter the admin full name', 'Superadmin');
        }

        // Ask for password twice with hidden input
        $password = $this->secret('Enter admin password (min 12 characters)');
        $passwordConfirmation = $this->secret('Confirm admin password');

        $passwordValidator = Validator::make([
            'password' => $password,
            'password_confirmation' => $passwordConfirmation,
        ], [
            'password' => ['required', 'string', 'min:12', 'same:password_confirmation'],
        ], [
            'password.min' => 'The password must be at least 12 characters.',
            'password.same' => 'The password confirmation does not match.',
        ]);

        if ($passwordValidator->fails()) {
            foreach ($passwordValidator->errors()->all() as $error) {
                $this->error($error);
            }
            return Command::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => 'superadmin',
        ]);

        $this->info("Superadmin account created successfully for: {$user->email} (ID: {$user->id})");

        return Command::SUCCESS;
    }
}
