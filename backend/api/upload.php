<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

handle_options_request();
require_method('POST');

function validate_title(): string
{
    $title = trim((string) ($_POST['title'] ?? ''));

    if ($title === '') {
        api_error('Title is required.', 422);
    }

    if (strlen($title) > 255) {
        api_error('Title must be 255 characters or fewer.', 422);
    }

    return $title;
}

function validate_upload(): array
{
    if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
        api_error('A file is required.', 422);
    }

    $file = $_FILES['file'];

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        api_error('The file could not be uploaded.', 422);
    }

    if (($file['size'] ?? 0) <= 0 || (int) $file['size'] > APP_MAX_FILE_SIZE) {
        api_error('File size must be greater than 0 and no more than 20 MB.', 422);
    }

    $originalName = basename((string) $file['name']);
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedTypes = allowed_upload_types();

    if (!isset($allowedTypes[$extension])) {
        api_error('This file extension is not allowed.', 422);
    }

    $tmpName = (string) $file['tmp_name'];
    if (!is_uploaded_file($tmpName)) {
        api_error('The uploaded file is invalid.', 422);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($tmpName);

    if (!in_array($mimeType, $allowedTypes[$extension], true)) {
        api_error('This file type is not allowed.', 422);
    }

    return [
        'tmp_name' => $tmpName,
        'name' => $originalName,
        'extension' => $extension,
        'mime_type' => $mimeType,
    ];
}

function first_table_id(PDO $pdo, string $table): ?int
{
    $stmt = $pdo->query("SELECT MIN(id) AS id FROM {$table}");
    $id = $stmt->fetchColumn();

    return $id === false || $id === null ? null : (int) $id;
}

try {
    $title = validate_title();
    $file = validate_upload();
    $storageDir = storage_dir();

    if (!is_dir($storageDir) || !is_writable($storageDir)) {
        api_error('Document storage is not writable.', 500);
    }

    $pdo = get_pdo();
    ensure_app_documents_deleted_at($pdo);
    $categoryId = first_table_id($pdo, 'odm_category') ?? 0;
    $departmentId = first_table_id($pdo, 'odm_department');

    $stmt = $pdo->prepare(
        'INSERT INTO odm_data
            (status, category, owner, realname, created, description, department, comment, default_rights, publishable)
        VALUES
            (0, :category, :owner, :realname, NOW(), :description, :department, "", 2, 1)'
    );
    $stmt->execute([
        ':category' => $categoryId,
        ':owner' => APP_DEFAULT_OWNER_ID,
        ':realname' => $file['name'],
        ':description' => $title,
        ':department' => $departmentId,
    ]);

    $odmDocumentId = (int) $pdo->lastInsertId();
    $targetPath = $storageDir . DIRECTORY_SEPARATOR . $odmDocumentId . '.dat';

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        $deleteStmt = $pdo->prepare('DELETE FROM odm_data WHERE id = :id');
        $deleteStmt->execute([':id' => $odmDocumentId]);
        api_error('Unable to store uploaded file.', 500);
    }

    try {
        $appStmt = $pdo->prepare(
            'INSERT INTO app_documents (title, odm_document_id) VALUES (:title, :odm_document_id)'
        );
        $appStmt->execute([
            ':title' => $title,
            ':odm_document_id' => $odmDocumentId,
        ]);
    } catch (Throwable $exception) {
        if (is_file($targetPath)) {
            unlink($targetPath);
        }

        $deleteStmt = $pdo->prepare('DELETE FROM odm_data WHERE id = :id');
        $deleteStmt->execute([':id' => $odmDocumentId]);
        throw $exception;
    }

    json_response([
        'success' => true,
        'message' => 'Document uploaded successfully.',
        'document' => [
            'id' => (int) $pdo->lastInsertId(),
            'title' => $title,
            'original_filename' => $file['name'],
        ],
    ], 201);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    api_error('Unable to upload document.', 500);
}
