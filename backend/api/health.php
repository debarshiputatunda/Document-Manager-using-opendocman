<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

handle_options_request();
require_method('GET');

$checks = [
    'api' => [
        'ok' => true,
        'message' => 'API is reachable.',
    ],
    'database' => [
        'ok' => false,
        'message' => 'Database has not been checked.',
    ],
    'storage' => [
        'ok' => false,
        'message' => 'Storage has not been checked.',
    ],
];

try {
    $pdo = get_pdo();
    $pdo->query('SELECT 1');
    $checks['database'] = [
        'ok' => true,
        'message' => 'Database connection is working.',
    ];
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    $checks['database'] = [
        'ok' => false,
        'message' => 'Database connection failed.',
    ];
}

$storageDir = storage_dir();
$storageOk = is_dir($storageDir) && is_readable($storageDir) && is_writable($storageDir);
$checks['storage'] = [
    'ok' => $storageOk,
    'message' => $storageOk
        ? 'Storage directory is readable and writable.'
        : 'Storage directory is missing or not writable.',
];

$healthy = array_reduce(
    $checks,
    static fn (bool $carry, array $check): bool => $carry && $check['ok'],
    true
);

json_response([
    'success' => $healthy,
    'status' => $healthy ? 'ok' : 'degraded',
    'timestamp' => gmdate('c'),
    'checks' => $checks,
], $healthy ? 200 : 503);
