<?php

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function getCacheDir(): string
    {
        if (isset($_ENV['VERCEL'])) {
            return '/tmp/cache/' . $this->environment;
        }

        return parent::getCacheDir();
    }

    public function getLogDir(): string
    {
        if (isset($_ENV['VERCEL'])) {
            return '/tmp/log';
        }

        return parent::getLogDir();
    }

    public function boot(): void
    {
        parent::boot();

        // On Vercel, write JWT keys from ENV to /tmp so LexikJWT can read them as files
        if (isset($_ENV['VERCEL'])) {
            if (isset($_ENV['JWT_SECRET_KEY_CONTENT']) && !file_exists('/tmp/private.pem')) {
                file_put_contents('/tmp/private.pem', $_ENV['JWT_SECRET_KEY_CONTENT']);
            }
            if (isset($_ENV['JWT_PUBLIC_KEY_CONTENT']) && !file_exists('/tmp/public.pem')) {
                file_put_contents('/tmp/public.pem', $_ENV['JWT_PUBLIC_KEY_CONTENT']);
            }
        }
    }
}
