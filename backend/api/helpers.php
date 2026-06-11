<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';

ini_set('display_errors', '0');
error_reporting(E_ALL);

function send_cors_headers(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

function handle_options_request(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        send_cors_headers();
        http_response_code(204);
        exit;
    }
}

function json_response(array $payload, int $status = 200): void
{
    send_cors_headers();
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function api_error(string $message, int $status = 400): void
{
    json_response(['success' => false, 'message' => $message], $status);
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        api_error('Method not allowed.', 405);
    }
}

function json_request_body(): array
{
    $rawBody = file_get_contents('php://input');
    $payload = json_decode($rawBody ?: '', true);

    if (!is_array($payload)) {
        api_error('Invalid JSON request body.', 400);
    }

    return $payload;
}

function ensure_app_documents_deleted_at(PDO $pdo): void
{
    static $checked = false;

    if ($checked) {
        return;
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM app_documents LIKE 'deleted_at'");

    if (!$stmt->fetch()) {
        $pdo->exec('ALTER TABLE app_documents ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL');
    }

    $checked = true;
}

function payload_document_id(array $payload): int
{
    $id = filter_var($payload['id'] ?? null, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1],
    ]);

    if ($id === false || $id === null) {
        api_error('A valid document id is required.', 400);
    }

    return $id;
}

function app_document_id(): int
{
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1],
    ]);

    if ($id === false || $id === null) {
        api_error('A valid document id is required.', 400);
    }

    return $id;
}

function find_document(PDO $pdo, int $id): array
{
    ensure_app_documents_deleted_at($pdo);

    $stmt = $pdo->prepare(
        'SELECT
            app_documents.id,
            app_documents.title,
            app_documents.odm_document_id,
            app_documents.created_at,
            odm_data.realname,
            odm_data.created AS odm_created
        FROM app_documents
        INNER JOIN odm_data ON odm_data.id = app_documents.odm_document_id
        WHERE app_documents.id = :id
            AND app_documents.deleted_at IS NULL
        LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $document = $stmt->fetch();

    if (!$document) {
        api_error('Document not found.', 404);
    }

    return $document;
}

function document_path(array $document): string
{
    return storage_dir() . DIRECTORY_SEPARATOR . (int) $document['odm_document_id'] . '.dat';
}

function content_type_for_filename(string $filename): string
{
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

    $types = [
        'pdf' => 'application/pdf',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls' => 'application/vnd.ms-excel',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt' => 'application/vnd.ms-powerpoint',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
    ];

    return $types[$extension] ?? 'application/octet-stream';
}

function header_filename(string $filename): string
{
    return str_replace(['"', "\r", "\n"], '', basename($filename));
}

function stream_document(array $document, string $disposition): void
{
    $path = document_path($document);

    if (!is_file($path) || !is_readable($path)) {
        api_error('Stored file not found.', 404);
    }

    $filename = header_filename((string) $document['realname']);

    send_cors_headers();
    header('Content-Type: ' . content_type_for_filename($filename));
    header('Content-Length: ' . filesize($path));
    header(
        "Content-Disposition: {$disposition}; filename=\"{$filename}\"; filename*=UTF-8''" .
        rawurlencode($filename)
    );
    header('X-Content-Type-Options: nosniff');
    readfile($path);
    exit;
}
