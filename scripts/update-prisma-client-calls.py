#!/usr/bin/env python3
"""
Update Prisma Client calls from patient* to customer*
"""

import re
from pathlib import Path

# Prisma model mappings
PRISMA_MODELS = {
    'patientAccessRequest': 'customerAccessRequest',
    'patientAllergy': 'customerAllergy',
    'patientAmendmentRequest': 'customerAmendmentRequest',
    'patientCommunicationRequest': 'customerCommunicationRequest',
    'patientConsent': 'customerConsent',
    'patientDiagnosis': 'customerDiagnosis',
    'patientFamilyHistory': 'customerFamilyHistory',
    'patientImmunization': 'customerImmunization',
    'patientMedication': 'customerMedication',
    'patientProcedure': 'customerProcedure',
    'patientRepository': 'customerRepository',
    'patientVitalSign': 'customerVitalSign',
    'patientLabResult': 'customerLabResult',
    'patientEncounter': 'customerEncounter',
}

# Additional variable name mappings
VARIABLE_MAPPINGS = {
    'patientRights': 'customerRights',
    'patientAge': 'customerAge',
    'patientGender': 'customerGender',
    'patientCount': 'customerCount',
}

def update_file(file_path: Path) -> int:
    """Update a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        replacements = 0
        
        # Update Prisma client calls (prisma.patientModel)
        for old_model, new_model in PRISMA_MODELS.items():
            pattern = rf'\bprisma\.{old_model}\b'
            content, count = re.subn(pattern, f'prisma.{new_model}', content)
            replacements += count
        
        # Update variable names
        for old_var, new_var in VARIABLE_MAPPINGS.items():
            pattern = rf'\b{old_var}\b'
            content, count = re.subn(pattern, new_var, content)
            replacements += count
        
        if replacements > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return replacements
        
        return 0
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return 0

def main():
    """Main execution."""
    print("Updating Prisma client calls...")
    
    total_files = 0
    total_replacements = 0
    
    for file_path in Path(".").rglob("*.ts"):
        if "node_modules" in str(file_path) or ".next" in str(file_path):
            continue
        
        replacements = update_file(file_path)
        if replacements > 0:
            total_files += 1
            total_replacements += replacements
            print(f"  ✓ {file_path}: {replacements} replacements")
    
    for file_path in Path(".").rglob("*.tsx"):
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