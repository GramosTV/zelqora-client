# PowerShell script to find and fix mat-chip [selected]="true" issues
Write-Host "Finding and fixing mat-chip [selected] attributes..."

# Get all component files that might contain mat-chip components
$rootPath = "c:/Users/gramo/Desktop/sites/healthcare/healthcare-app/src"
$files = Get-ChildItem -Path $rootPath -Recurse -Include "*.ts" | Where-Object { 
    $content = Get-Content $_.FullName -Raw
    $content -match '\[selected\]="true"' 
}

$replacementCount = 0

foreach ($file in $files) {
    Write-Host "Processing file: $($file.FullName)"
    $content = Get-Content $file.FullName -Raw
    
    # Replace [selected]="true" with selected
    $newContent = $content -replace '\[selected\]="true"', 'selected'
    
    # Check if any replacements were made
    if ($newContent -ne $content) {
        $replacementsMade = ($content | Select-String -Pattern '\[selected\]="true"' -AllMatches).Matches.Count
        $replacementCount += $replacementsMade
        Write-Host "  Made $replacementsMade replacements"
        
        # Save the changes back to the file
        Set-Content -Path $file.FullName -Value $newContent
    }
}

Write-Host "Finished processing files. Total replacements made: $replacementCount"
