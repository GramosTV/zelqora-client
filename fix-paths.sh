#!/bin/bash
# Fix import paths in the healthcare-app project

# Function to fix paths in a file
fix_file() {
  local file=$1
  echo "Fixing imports in $file"
  sed -i 's/from '\''\.\.\/\.\.\/\.\.\/core/from '\''\.\.\/\.\.\/core/g' "$file"
}

# Find all TypeScript files in the features directory
find src/app/features -name "*.ts" | while read file; do
  fix_file "$file"
done

echo "All import paths have been fixed!"
