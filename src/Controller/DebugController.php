<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class DebugController extends AbstractController
{
    #[Route('/api/debug-system', name: 'api_debug_system')]
    public function debug(Connection $connection): JsonResponse
    {
        // ... (existing code)
    }

    #[Route('/debug-test', name: 'api_debug_test')]
    public function debugTest(): JsonResponse
    {
        return $this->json(['message' => 'Routing is working!', 'path' => '/debug-test']);
    }
}
