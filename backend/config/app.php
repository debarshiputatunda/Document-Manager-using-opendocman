<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

define('APP_MAX_FILE_SIZE', (int) app_env_or_config('APP_MAX_FILE_SIZE', 'max_file_size', 20971520));
define('APP_DEFAULT_OWNER_ID', (int) app_env_or_config('APP_DEFAULT_OWNER_ID', 'default_owner_id', 1));

function storage_dir(): string
{
    $path = (string) app_env_or_config(
        'ODM_STORAGE_DIR',
        'storage_dir',
        __DIR__ . '/../../../document-storage'
    );

    $realPath = realpath($path);

    if ($realPath === false) {
        return rtrim($path, DIRECTORY_SEPARATOR);
    }

    return rtrim($realPath, DIRECTORY_SEPARATOR);
}

function allowed_upload_types(): array
{
    return [
        'pdf' => ['application/pdf'],
        'doc' => ['application/msword', 'application/vnd.ms-word'],
        'docx' => [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
        ],
        'xls' => ['application/vnd.ms-excel'],
        'xlsx' => [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip',
        ],
        'ppt' => ['application/vnd.ms-powerpoint'],
        'pptx' => [
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/zip',
        ],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
    ];
}
