<?php

namespace App\Http\Controllers;

class PingController extends Controller
{
    public function index()
    {
        return response()->json(['message' => 'Hello from Laravel']);
    }
}