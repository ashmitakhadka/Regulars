<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class MerchantProductController extends Controller
{
    /**
     * Get all products belonging to the authenticated merchant.
     */
    public function getMerchantProducts(Request $request)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        if (!$merchant) {
            return response()->json([
                'message' => 'Active merchant account not found.',
            ], 403);
        }

        $products = Product::where('merchant_id', $merchant->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Create a product.
     */
    public function createProduct(Request $request)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        if (!$merchant) {
            return response()->json([
                'message' => 'Active merchant account not found.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
        ]);

        $product = Product::create([
            'merchant_id' => $merchant->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully.',
            'data' => $product,
        ], 201);
    }

    /**
     * Get one merchant product.
     */
    public function getProductDetails(Request $request, int $id)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        if (!$merchant) {
            return response()->json([
                'message' => 'Active merchant account not found.',
            ], 403);
        }

        $product = Product::where('merchant_id', $merchant->id)
            ->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Product not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Update a merchant product.
     */
    public function updateProduct(Request $request, int $id)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        if (!$merchant) {
            return response()->json([
                'message' => 'Active merchant account not found.',
            ], 403);
        }

        $product = Product::where('merchant_id', $merchant->id)
            ->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Product not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'required', 'in:active,inactive'],
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'data' => $product->fresh(),
        ]);
    }

    /**
     * Delete a merchant product.
     */
    public function deleteProduct(Request $request, int $id)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        if (!$merchant) {
            return response()->json([
                'message' => 'Active merchant account not found.',
            ], 403);
        }

        $product = Product::where('merchant_id', $merchant->id)
            ->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Product not found.',
            ], 404);
        }

        if ($product->earningRuleProducts()->exists()) {
            return response()->json([
                'message' => 'This product is used in a loyalty program and cannot be deleted.',
            ], 422);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.',
        ]);
    }

    /**
     * Get the authenticated merchant.
     */
    private function getAuthenticatedMerchant(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'merchant') {
            return null;
        }

        $merchant = $user->merchant()->first();

        if (!$merchant || $merchant->status !== 'active') {
            return null;
        }

        return $merchant;
    }
}