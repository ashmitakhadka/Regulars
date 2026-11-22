<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class BulkJoinProgramsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'program_ids' => [
                'required',
                'array',
                'min:1',
                'max:10',
                function ($attribute, $value, $fail) {
                    if (is_array($value) && count($value) !== count(array_unique($value))) {
                        $fail('Duplicate program IDs are not allowed in a single request.');
                    }
                },
            ],
            'program_ids.*' => ['required', 'integer', 'distinct'],
        ];
    }

    public function messages(): array
    {
        return [
            'program_ids.required' => 'At least one program ID is required.',
            'program_ids.array' => 'Program IDs must be provided as an array.',
            'program_ids.min' => 'You must provide between 1 and 10 program IDs.',
            'program_ids.max' => 'You cannot join more than 10 programs at once.',
            'program_ids.distinct' => 'Duplicate program IDs are not allowed in a single request.',
            'program_ids.*.required' => 'Each program ID must be specified.',
            'program_ids.*.integer' => 'Each program ID must be an integer.',
        ];
    }
}
