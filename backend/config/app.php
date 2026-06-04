<?php

declare(strict_types=1);

const APP_MAX_FILE_SIZE = 20971520;
const APP_DEFAULT_OWNER_ID = 1;

function storage_dir(): string
{
    $configured = getenv('ODM_STORAGE_DIR');
    $path = $configured !== false && $configured !== ''
        ? $configured
        : __DIR__ . '/../../../document-storage';

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
