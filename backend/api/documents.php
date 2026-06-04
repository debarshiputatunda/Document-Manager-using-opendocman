<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

handle_options_request();
require_method('GET');

try {
    $pdo = get_pdo();
    $stmt = $pdo->query(
        'SELECT
            app_documents.id,
            app_documents.title,
            app_documents.created_at,
            odm_data.id AS odm_document_id,
            odm_data.realname,
            odm_data.created AS odm_created
        FROM app_documents
        INNER JOIN odm_data ON odm_data.id = app_documents.odm_document_id
        ORDER BY app_documents.created_at DESC, app_documents.id DESC'
    );

    $documents = array_map(
        static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'title' => $row['title'] ?: $row['realname'],
                'original_filename' => $row['realname'],
                'upload_date' => $row['created_at'] ?: $row['odm_created'],
                'view_url' => '/api/view.php?id=' . (int) $row['id'],
                'download_url' => '/api/download.php?id=' . (int) $row['id'],
            ];
        },
        $stmt->fetchAll()
    );

    json_response(['success' => true, 'documents' => $documents]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    api_error('Unable to load documents.', 500);
}
