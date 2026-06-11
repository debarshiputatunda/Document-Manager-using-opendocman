<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

handle_options_request();
require_method('GET');

try {
    $page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT, [
        'options' => ['default' => 1, 'min_range' => 1],
    ]);
    $pageSize = filter_input(INPUT_GET, 'page_size', FILTER_VALIDATE_INT, [
        'options' => ['default' => 10, 'min_range' => 1, 'max_range' => 100],
    ]);
    $search = trim((string) ($_GET['search'] ?? ''));
    $date = trim((string) ($_GET['date'] ?? ''));
    $sort = trim((string) ($_GET['sort'] ?? 'upload_date'));
    $direction = strtolower(trim((string) ($_GET['direction'] ?? 'desc')));

    if (strlen($search) > 100) {
        api_error('Search term must be 100 characters or fewer.', 422);
    }

    if ($date !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        api_error('Date filter must use YYYY-MM-DD format.', 422);
    }

    $sortColumns = [
        'title' => 'LOWER(COALESCE(NULLIF(app_documents.title, \'\'), odm_data.realname))',
        'type' => 'LOWER(SUBSTRING_INDEX(odm_data.realname, \'.\', -1))',
        'filename' => 'LOWER(odm_data.realname)',
        'upload_date' => 'COALESCE(app_documents.created_at, odm_data.created)',
    ];
    $sortColumn = $sortColumns[$sort] ?? $sortColumns['upload_date'];
    $sort = array_key_exists($sort, $sortColumns) ? $sort : 'upload_date';
    $direction = $direction === 'asc' ? 'asc' : 'desc';
    $offset = ($page - 1) * $pageSize;

    $where = ['app_documents.deleted_at IS NULL'];
    $params = [];

    if ($search !== '') {
        $where[] = '(app_documents.title LIKE :search_title OR odm_data.realname LIKE :search_filename)';
        $params[':search_title'] = '%' . $search . '%';
        $params[':search_filename'] = '%' . $search . '%';
    }

    if ($date !== '') {
        $where[] = 'DATE(COALESCE(app_documents.created_at, odm_data.created)) = :upload_date';
        $params[':upload_date'] = $date;
    }

    $whereSql = implode(' AND ', $where);

    $pdo = get_pdo();
    ensure_app_documents_deleted_at($pdo);

    $countStmt = $pdo->prepare(
        "SELECT COUNT(*) AS total
        FROM app_documents
        INNER JOIN odm_data ON odm_data.id = app_documents.odm_document_id
        WHERE {$whereSql}"
    );

    foreach ($params as $name => $value) {
        $countStmt->bindValue($name, $value, PDO::PARAM_STR);
    }

    $countStmt->execute();
    $total = (int) $countStmt->fetchColumn();
    $totalPages = max(1, (int) ceil($total / $pageSize));

    if ($page > $totalPages) {
        $page = $totalPages;
        $offset = ($page - 1) * $pageSize;
    }

    $stmt = $pdo->prepare(
        "SELECT
            app_documents.id,
            app_documents.title,
            app_documents.created_at,
            odm_data.id AS odm_document_id,
            odm_data.realname,
            odm_data.created AS odm_created
        FROM app_documents
        INNER JOIN odm_data ON odm_data.id = app_documents.odm_document_id
        WHERE {$whereSql}
        ORDER BY {$sortColumn} {$direction}, app_documents.id DESC
        LIMIT :limit OFFSET :offset"
    );

    foreach ($params as $name => $value) {
        $stmt->bindValue($name, $value, PDO::PARAM_STR);
    }

    $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $documents = array_map(
        static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'odm_document_id' => (int) $row['odm_document_id'],
                'title' => $row['title'] ?: $row['realname'],
                'original_filename' => $row['realname'],
                'upload_date' => $row['created_at'] ?: $row['odm_created'],
                'view_url' => '/api/view.php?id=' . (int) $row['id'],
                'download_url' => '/api/download.php?id=' . (int) $row['id'],
            ];
        },
        $stmt->fetchAll()
    );

    json_response([
        'success' => true,
        'documents' => $documents,
        'pagination' => [
            'page' => $page,
            'page_size' => $pageSize,
            'total' => $total,
            'total_pages' => $totalPages,
            'sort' => $sort,
            'direction' => $direction,
            'search' => $search,
            'date' => $date,
        ],
    ]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    api_error('Unable to load documents.', 500);
}
