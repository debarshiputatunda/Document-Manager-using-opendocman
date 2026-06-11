<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

function get_pdo(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = (string) app_env_or_config('APP_DB_HOST', 'db_host', 'localhost');
    $database = (string) app_env_or_config('APP_DB_NAME', 'db_name', 'opendocman');
    $user = (string) app_env_or_config('APP_DB_USER', 'db_user', 'odmuser');
    $password = (string) app_env_or_config('APP_DB_PASS', 'db_pass', 'odm123');

    $dsn = "mysql:host={$host};dbname={$database};charset=utf8mb4";

    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
