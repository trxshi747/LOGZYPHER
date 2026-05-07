<?php

namespace App\Controller;

use App\Entity\History;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

final class LogController extends AbstractController
{
    public string $log_directory;

    public function __construct(
        string $kernelLogsDir,
        private EntityManagerInterface $entityManager
    ) {
        $this->log_directory = $kernelLogsDir;
    }

    public function log_line_analyzer($line)
    {
        $pattern = '/^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+\d{2}:\d{2})\] (\w+)\.(\w+): (.*)$/';
        if (preg_match($pattern, $line, $matches)) {
            return ([
                "time" => $matches[1] ?? "inconnue",
                "channel" => $matches[2] ?? "inconnue",
                "level" => $matches[3] ?? "inconnue",
                "message" => $matches[4] ?? "inconnue"
            ]);
        }
        return null;
    }

    public function log_file_analyzer($file)
    {
        $analyzed_log_array = [];
        $opened_file = fopen($file, 'r');
        while (($line = fgets($opened_file)) !== false) {
            $analyzed_log = $this->log_line_analyzer($line);
            if ($analyzed_log !== null) {
                $analyzed_log_array[] = $analyzed_log;
            }
        }
        fclose($opened_file);
        return $analyzed_log_array;
    }

    #[Route('/show_log_data', name: 'show_log_data', methods: ['GET'])]
    public function show_log_data(Request $request): Response
    {
        $my_log = $request->getSession()->get('my_log', []);

        if ($request->query->get('_format') === 'json') {
            return $this->json(['my_log' => $my_log]);
        }

        return $this->render('home/index.html.twig', ['my_log' => $my_log]);
    }

    #[Route('/api/upload_file', name: 'upload_file', methods: ['POST'])]
    public function upload_file(Request $request, #[CurrentUser] ?User $user): Response
    {
        $data = json_decode($request->getContent(), true);

        if (!$data || !isset($data['logs']) || !isset($data['filename'])) {
            return $this->json(['message' => 'Invalid data format'], 400);
        }

        $logsData = $data['logs'];
        $filename = $data['filename'];

        // Extraction de l'array de logs réel (si c'est déjà résumé par le client)
        $analyzed_file = isset($logsData['is_summarized']) ? $logsData['data'] : $logsData;

        // Sauvegarder l'array brut dans la session pour l'affichage immédiat
        $request->getSession()->set('my_log', $analyzed_file);

        // Si l'utilisateur est connecté, sauvegarder dans l'historique
        if ($user) {
            // Utiliser les données déjà préparées (éventuellement résumées) par le client
            $jsonResult = json_encode($logsData);

            // Tentative de compression
            $compressedData = gzcompress($jsonResult, 9);

            // Sécurité supplémentaire : si c'est encore trop gros, on re-résume (cas rare avec le client-side parsing)
            if (strlen($compressedData) > 5000000 && is_array($analyzed_file)) {
                $errors = array_filter($analyzed_file, fn($l) => in_array(strtoupper($l['level'] ?? ''), ['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY', 'WARNING']));
                $others = array_filter($analyzed_file, fn($l) => !in_array(strtoupper($l['level'] ?? ''), ['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY', 'WARNING']));

                shuffle($others);
                $sampledOthers = array_slice($others, 0, (int)(count($others) * 0.1));

                $summarized_file = array_merge($errors, $sampledOthers);
                usort($summarized_file, fn($a, $b) => strcmp($a['time'] ?? '', $b['time'] ?? ''));

                $jsonResult = json_encode([
                    'is_summarized' => true,
                    'original_count' => count($analyzed_file),
                    'data' => $summarized_file
                ]);
                $compressedData = gzcompress($jsonResult, 9);
            }

            $compressedResult = base64_encode($compressedData);

            $history = new History();
            $history->setUser($user);
            $history->setFilename($filename);
            $history->setFileContent($compressedResult);
            $history->setUploadedAt(new \DateTime());

            $this->entityManager->persist($history);
            $this->entityManager->flush();
        }

        return $this->json(['message' => 'Logs processed successfully']);
    }

    #[Route('/api/history', name: 'api_history', methods: ['GET'])]
    public function getHistory(#[CurrentUser] ?User $user): Response
    {
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $history = $this->entityManager->getRepository(History::class)->findBy(
            ['user' => $user],
            ['uploaded_at' => 'DESC']
        );

        $historyData = [];
        foreach ($history as $item) {
            $rawContent = $item->getFileContent();
            $decoded = @gzuncompress(base64_decode($rawContent));
            $analysisResult = json_decode($decoded ?: $rawContent, true);

            // Toujours obtenir l'array de logs pour le logCount
            $logs = isset($analysisResult['is_summarized']) ? $analysisResult['data'] : $analysisResult;

            $historyData[] = [
                'id' => $item->getId(),
                'filename' => $item->getFilename(),
                'uploadedAt' => $item->getUploadedAt()->format('Y-m-d H:i:s'),
                'logCount' => is_array($logs) ? count($logs) : 0,
                'isSummarized' => isset($analysisResult['is_summarized']),
                'originalCount' => $analysisResult['original_count'] ?? (is_array($logs) ? count($logs) : 0)
            ];
        }

        return $this->json($historyData);
    }

    #[Route('/api/history/{id}/load', name: 'api_history_load', methods: ['POST'])]
    public function loadHistory(int $id, Request $request, #[CurrentUser] ?User $user): Response
    {
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $history = $this->entityManager->getRepository(History::class)->find($id);

        if (!$history || $history->getUser()->getId() !== $user->getId()) {
            return $this->json(['message' => 'History not found'], 404);
        }

        $rawContent = $history->getFileContent();
        $decoded = @gzuncompress(base64_decode($rawContent));
        $analysisResult = json_decode($decoded ?: $rawContent, true);

        // Extraire l'array de logs réel
        $logs = isset($analysisResult['is_summarized']) ? $analysisResult['data'] : $analysisResult;

        // Save only the ARRAY to session
        $request->getSession()->set('my_log', $logs);

        return $this->json([
            'message' => 'History loaded successfully',
            'logs' => $logs // Return only the ARRAY
        ]);
    }

    #[Route('/api/history/{id}/download', name: 'api_history_download', methods: ['GET'])]
    public function downloadHistory(int $id, #[CurrentUser] ?User $user): Response
    {
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $history = $this->entityManager->getRepository(History::class)->find($id);

        if (!$history || $history->getUser()->getId() !== $user->getId()) {
            return $this->json(['message' => 'History not found'], 404);
        }

        $fileContent = $history->getFileContent();
        $filename = $history->getFilename();

        $response = new Response($fileContent);
        $response->headers->set('Content-Type', 'text/plain');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');

        return $response;
    }
    #[Route('/clear_log_session', name: 'clear_log_session', methods: ['POST'])]
    public function clearLogSession(Request $request): Response
    {
        $request->getSession()->remove('my_log');
        return new Response(null, 204);
    }
}
