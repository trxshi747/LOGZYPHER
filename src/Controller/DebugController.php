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
        $status = [
            'database' => 'Unknown',
            'jwt_private_file' => file_exists('/tmp/private.pem') ? 'Exists' : 'Missing',
            'jwt_public_file' => file_exists('/tmp/public.pem') ? 'Exists' : 'Missing',
            'php_version' => PHP_VERSION,
            'env' => $_ENV['APP_ENV'] ?? 'not set',
        ];

        try {
            $connection->connect();
            $status['database'] = 'Connected Successfully';
        } catch (\Exception $e) {
            $status['database'] = 'Error: ' . $e->getMessage();
        }

        return $this->json($status);
    }
}
