$directories = @(
    "src\components\projects",
    "src\components\auth",
    "src\components\dashboard",
    "src\components\team",
    "src\components\reports",
    "src\components\common",
    "src\hooks",
    "src\services",
    "src\context",
    "src\utils",
    "src\pages",
    "src\types",
    "src\assets",
    "src\i18n",
    "src\theme",
    "src\firebase"
)

foreach ($dir in $directories) {
    New-Item -Path $dir -ItemType Directory -Force
    Write-Host "Created directory: $dir"
}
