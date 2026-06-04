<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

handle_options_request();
require_method('GET');

try {
    $document = find_document(get_pdo(), app_document_id());
    $extension = strtolower(pathinfo((string) $document['realname'], PATHINFO_EXTENSION));
    $inlineExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    $disposition = in_array($extension, $inlineExtensions, true) ? 'inline' : 'attachment';

    stream_document($document, $disposition);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    api_error('Unable to view document.', 500);
}
