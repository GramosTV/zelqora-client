# PowerShell script to fix import paths in the healthcare-app project

# Function to fix paths in a file
function Fix-File {
  param (
    [string]$file
  )
  
  Write-Host "Fixing imports in $file"
  (Get-Content $file) | 
    ForEach-Object { $_ -replace "from '\.\.\/\.\.\/\.\.\/core", "from '\.\.\/\.\.\/core" } |
    Set-Content $file
}

# Find all TypeScript files in the features directory
$files = Get-ChildItem -Path "src/app/features" -Recurse -Filter "*.ts"
foreach ($file in $files) {
  Fix-File -file $file.FullName
}

Write-Host "All import paths have been fixed!" -ForegroundColor Green
