<?php

namespace App\Http\Requests\Customer;

use App\Services\Customer\NepaliPhoneNormalizer;
use Closure;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UpdateCustomerProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare inputs for validation:
     * - Trim name and collapse repeated inner whitespace into a single space.
     * - Normalize phone number using NepaliPhoneNormalizer.
     */
    protected function prepareForValidation(): void
    {
        $merges = [];

        if ($this->has('name') && is_string($this->input('name'))) {
            $merges['name'] = preg_replace('/\s+/', ' ', trim($this->input('name')));
        }

        if ($this->has('phone') && is_string($this->input('phone'))) {
            $merges['phone'] = NepaliPhoneNormalizer::normalize($this->input('phone')) ?? $this->input('phone');
        }

        if (!empty($merges)) {
            $this->merge($merges);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'name' => ['required', 'string', 'max:100'],
            'phone' => [
                'required',
                'string',
                function (string $attribute, mixed $value, Closure $fail) {
                    if (! NepaliPhoneNormalizer::isValid($value)) {
                        $fail('The phone number must be a valid Nepal mobile number (10 digits starting with 96, 97, or 98).');
                    }
                },
                Rule::unique('users', 'phone')->ignore($userId),
            ],
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => $validator->errors()->first(),
            'errors' => $validator->errors(),
        ], 422));
    }
}
