<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class MerchantRegistrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
{
    return [
        // Account details
        'name' => ['required', 'string', 'max:255'],

        'email' => ['required', 'email', 'max:255', 'unique:users,email'],

        'password' => ['required', 'string', 'min:8', 'confirmed'],

        // Business details
        'business_name' => ['required', 'string', 'max:255'],

        'phone' => ['required', 'string', 'max:20'],

        'address' => ['required', 'string'],

        'description' => ['nullable', 'string'],
    ];
}
public function messages(): array
{
    return [
        'email.unique' => 'This email is already registered.',
        'password.confirmed' => 'The password confirmation does not match.',
        'business_name.required' => 'Please enter your business name.',
        'phone.required' => 'Please enter your business phone number.',
        'address.required' => 'Please enter your business address.',
    ];
}
}
