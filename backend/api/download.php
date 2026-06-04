<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

handle_options_request();
require_method('GET');

try {
    $document = find_document(get_pdo(), app_document_id());
    stream_document($document, 'attachment');
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    api_error('Unable to download document.', 500);
}
