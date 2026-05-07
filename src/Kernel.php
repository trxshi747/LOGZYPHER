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
            $privatePath = '/tmp/private.pem';
            $publicPath = '/tmp/public.pem';

            if (isset($_ENV['JWT_SECRET_KEY_CONTENT']) && !file_exists($privatePath)) {
                if (file_put_contents($privatePath, str_replace('\n', "\n", $_ENV['JWT_SECRET_KEY_CONTENT'])) === false) {
                    error_log("CRITICAL: Failed to write private key to $privatePath");
                }
            }
            if (isset($_ENV['JWT_PUBLIC_KEY_CONTENT']) && !file_exists($publicPath)) {
                if (file_put_contents($publicPath, str_replace('\n', "\n", $_ENV['JWT_PUBLIC_KEY_CONTENT'])) === false) {
                    error_log("CRITICAL: Failed to write public key to $publicPath");
                }
            }
        }
    }
}
