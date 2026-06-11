<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

handle_options_request();
require_method('POST');

try {
    $payload = json_request_body();
    $id = payload_document_id($payload);

    $pdo = get_pdo();
    ensure_app_documents_deleted_at($pdo);

    $stmt = $pdo->prepare(
        'UPDATE app_documents
        SET deleted_at = NOW()
        WHERE id = :id AND deleted_at IS NULL'
    );
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        api_error('Document not found.', 404);
    }

    json_response([
        'success' => true,
        'message' => 'Document removed from the list.',
    ]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    api_error('Unable to remove document.', 500);
}
