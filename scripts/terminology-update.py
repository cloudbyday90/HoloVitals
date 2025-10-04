#!/usr/bin/env python3
"""
Terminology Update Script for HoloVitals v1.4.1
Updates all references from "patient" to "customer" throughout the codebase.
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

# Directories to process
DIRECTORIES = [
    "HoloVitals/app",
    "HoloVitals/components",
    "HoloVitals/lib",
    "HoloVitals/prisma"
]

# File extensions to process
EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".prisma", ".md"]

# Terminology mappings (case-sensitive)
REPLACEMENTS = [
    # Capitalized versions
    (r'\bPatient\b', 'Customer'),
    (r'\bPatients\b', 'Customers'),
    (r'\bPATIENT\b', 'CUSTOMER'),
    (r'\bPATIENTS\b', 'CUSTOMERS'),
    
    # Lowercase versions
    (r'\bpatient\b', 'customer'),
    (r'\bpatients\b', 'customers'),
    
    # Camel case versions
    (r'\bpatientId\b', 'customerId'),
    (r'\bpatientIds\b', 'customerIds'),
    (r'\bPatientId\b', 'CustomerId'),
    (r'\bPatientIds\b', 'CustomerIds'),
    
    # Common patterns
    (r'\bpatient_id\b', 'customer_id'),
    (r'\bpatient_ids\b', 'customer_ids'),
]

# Files to exclude
EXCLUDE_PATTERNS = [
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "__pycache__",
    ".venv",
    "venv"
]

def should_process_file(file_path: Path) -> bool:
    """Check if file should be processed."""
    # Check extension
    if file_path.suffix not in EXTENSIONS:
        return False
    
    # Check exclude patterns
    for pattern in EXCLUDE_PATTERNS:
        if pattern in str(file_path):
            return False
    
    return True

def update_file_content(content: str) -> Tuple[str, int]:
    """Update content with terminology replacements."""
    updated_content = content
    total_replacements = 0
    
    for pattern, replacement in REPLACEMENTS:
        updated_content, count = re.subn(pattern, replacement, updated_content)
        total_replacements += count
    
    return updated_content, total_replacements

def process_file(file_path: Path) -> Tuple[bool, int]:
    """Process a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        updated_content, replacements = update_file_content(original_content)
        
        if replacements > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            return True, replacements
        
        return False, 0
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False, 0

def main():
    """Main execution function."""
    print("HoloVitals v1.4.1 - Terminology Update Script")
    print("=" * 60)
    print("Updating: patient → customer")
    print()
    
    total_files_processed = 0
    total_files_updated = 0
    total_replacements = 0
    updated_files = []
    
    for directory in DIRECTORIES:
        dir_path = Path(directory)
        if not dir_path.exists():
            print(f"Warning: Directory not found: {directory}")
            continue
        
        print(f"Processing directory: {directory}")
        
        for file_path in dir_path.rglob("*"):
            if file_path.is_file() and should_process_file(file_path):
                total_files_processed += 1
                updated, replacements = process_file(file_path)
                
                if updated:
                    total_files_updated += 1
                    total_replacements += replacements
                    updated_files.append((str(file_path), replacements))
                    print(f"  ✓ {file_path.relative_to(dir_path.parent)} ({replacements} replacements)")
    
    print()
    print("=" * 60)
    print("Summary:")
    print(f"  Files scanned: {total_files_processed}")
    print(f"  Files updated: {total_files_updated}")
    print(f"  Total replacements: {total_replacements}")
    print()
    
    if updated_files:
        print("Updated files:")
        for file_path, count in sorted(updated_files, key=lambda x: x[1], reverse=True):
            print(f"  {file_path}: {count} replacements")
    
    print()
    print("Terminology update complete!")

if __name__ == "__main__":
    main()