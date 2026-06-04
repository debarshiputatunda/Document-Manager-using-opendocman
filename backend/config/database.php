<?php

declare(strict_types=1);

function get_pdo(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('APP_DB_HOST') ?: 'localhost';
    $database = getenv('APP_DB_NAME') ?: 'opendocman';
    $user = getenv('APP_DB_USER') ?: 'odmuser';
    $password = getenv('APP_DB_PASS') ?: 'odm123';

    $dsn = "mysql:host={$host};dbname={$database};charset=utf8mb4";

    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
