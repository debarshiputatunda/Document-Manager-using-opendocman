<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

handle_options_request();
require_method('POST');

try {
    $payload = json_request_body();
    $id = payload_document_id($payload);
    $title = trim((string) ($payload['title'] ?? ''));

    if ($title === '') {
        api_error('Title is required.', 422);
    }

    if (strlen($title) > 255) {
        api_error('Title must be 255 characters or fewer.', 422);
    }

    $pdo = get_pdo();
    ensure_app_documents_deleted_at($pdo);

    $existsStmt = $pdo->prepare(
        'SELECT id
        FROM app_documents
        WHERE id = :id AND deleted_at IS NULL
        LIMIT 1'
    );
    $existsStmt->execute([':id' => $id]);

    if (!$existsStmt->fetch()) {
        api_error('Document not found.', 404);
    }

    $stmt = $pdo->prepare(
        'UPDATE app_documents
        SET title = :title
        WHERE id = :id AND deleted_at IS NULL'
    );
    $stmt->execute([
        ':title' => $title,
        ':id' => $id,
    ]);

    json_response([
        'success' => true,
        'message' => 'Document title updated.',
        'document' => [
            'id' => $id,
            'title' => $title,
        ],
    ]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    api_error('Unable to update document title.', 500);
}
