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
        $uploaded_file = $request->files->get('log_file');

        if (in_array($uploaded_file->getClientOriginalExtension(), ['log', 'txt'])) {
            // Sauvegarder le fichier dans la session
            $analyzed_file = $this->log_file_analyzer($uploaded_file->getPathname());
            $request->getSession()->set('my_log', $analyzed_file);

            // Si l'utilisateur est connecté, sauvegarder dans l'historique
            if ($user) {
                $analysisResult = json_encode($analyzed_file);

                $history = new History();
                $history->setUser($user);
                $history->setFilename($uploaded_file->getClientOriginalName());
                $history->setFileContent($analysisResult);
                $history->setUploadedAt(new \DateTime());

                $this->entityManager->persist($history);
                $this->entityManager->flush();
            }

            return $this->redirectToRoute('show_log_data');
        }

        return $this->redirectToRoute('show_log_data');
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
            $analysisResult = json_decode($item->getFileContent(), true);
            $historyData[] = [
                'id' => $item->getId(),
                'filename' => $item->getFilename(),
                'uploadedAt' => $item->getUploadedAt()->format('Y-m-d H:i:s'),
                'logCount' => is_array($analysisResult) ? count($analysisResult) : 0,
                'analysisResult' => $analysisResult
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

        // Charger l'analyse depuis file_content
        $analysisResult = json_decode($history->getFileContent(), true);
        $request->getSession()->set('my_log', $analysisResult);

        return $this->json(['message' => 'History loaded successfully']);
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
