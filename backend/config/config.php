<?php

declare(strict_types=1);

function app_config(string $key, mixed $default = null): mixed
{
    static $config = null;

    if ($config === null) {
        $path = __DIR__ . '/production.php';
        $loaded = is_file($path) ? require $path : [];
        $config = is_array($loaded) ? $loaded : [];
    }

    return array_key_exists($key, $config) ? $config[$key] : $default;
}

function app_env_or_config(string $envName, string $configKey, mixed $default = null): mixed
{
    $value = getenv($envName);

    if ($value !== false && $value !== '') {
        return $value;
    }

    return app_config($configKey, $default);
}
