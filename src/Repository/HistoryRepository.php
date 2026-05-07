<?php
namespace App\Repository;

use App\Entity\History;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class HistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, History::class);
    }

    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('h')
            ->where('h.user = :user')
            ->setParameter('user', $user)
            ->orderBy('h.uploaded_at', 'DESC')
            ->getQuery()
            ->getResult();
    }
}