#!/usr/bin/env python3
"""
Update remaining patient references to customer
"""

import re
from pathlib import Path

# SQL table name mappings
SQL_TABLE_MAPPINGS = {
    'patient_access_requests': 'customer_access_requests',
    'patient_amendment_requests': 'customer_amendment_requests',
    'patient_restriction_requests': 'customer_restriction_requests',
    'patient_communication_requests': 'customer_communication_requests',
    'patient_file': 'customer_file',
}

# Other mappings (excluding FHIR standard fields)
OTHER_MAPPINGS = {
    'patientResponse': 'customerResponse',
    'patientId_provider': 'customerId_provider',
    'patients_added': 'customers_added',
}

# Files to exclude (FHIR standard fields should not be changed)
EXCLUDE_PATTERNS = [
    'patientInstruction',  # FHIR standard field
    '__tests__',  # Test files with medical content
]

def should_skip_line(line: str) -> bool:
    """Check if line should be skipped."""
    for pattern in EXCLUDE_PATTERNS:
        if pattern in line:
            return True
    return False

def update_file(file_path: Path) -> int:
    """Update a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        updated_lines = []
        replacements = 0
        
        for line in lines:
            if should_skip_line(line):
                updated_lines.append(line)
                continue
            
            updated_line = line
            
            # Update SQL table names
            for old_table, new_table in SQL_TABLE_MAPPINGS.items():
                if old_table in updated_line:
                    updated_line = updated_line.replace(old_table, new_table)
                    replacements += 1
            
            # Update other mappings
            for old_name, new_name in OTHER_MAPPINGS.items():
                pattern = rf'\b{old_name}\b'
                if re.search(pattern, updated_line):
                    updated_line = re.sub(pattern, new_name, updated_line)
                    replacements += 1
            
            updated_lines.append(updated_line)
        
        if replacements > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(updated_lines)
            return replacements
        
        return 0
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return 0

def main():
    """Main execution."""
    print("Updating remaining patient references...")
    
    total_files = 0
    total_replacements = 0
    
    for ext in ['*.ts', '*.tsx']:
        for file_path in Path(".").rglob(ext):
            if "node_modules" in str(file_path) or ".next" in str(file_path):
                continue
            
            replacements = update_file(file_path)
            if replacements > 0:
                total_files += 1
                total_replacements += replacements
                print(f"  ✓ {file_path}: {replacements} replacements")
    
    print(f"\nTotal: {total_files} files updated, {total_replacements} replacements")

if __name__ == "__main__":
    main()