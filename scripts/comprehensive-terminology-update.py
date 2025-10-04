#!/usr/bin/env python3
"""
Comprehensive Terminology Update Script for HoloVitals v1.4.1
Updates all references from "patient" to "customer" throughout the entire codebase.
Includes database schema, APIs, services, and UI.
"""

import os
import re
from pathlib import Path
from typing import List, Tuple, Dict
import json

# Directories to process
DIRECTORIES = [
    "app",
    "components",
    "lib",
    "prisma",
    "middleware.ts"
]

# File extensions to process
EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".prisma", ".md", ".json"]

# Comprehensive terminology mappings (order matters!)
REPLACEMENTS = [
    # API Routes and URLs (must come first to avoid double replacements)
    (r'/api/patients/', '/api/customers/'),
    (r'/api/patient-rights/', '/api/customer-rights/'),
    (r'/audit-logs/patient/', '/audit-logs/customer/'),
    (r'/ehr/patients/', '/ehr/customers/'),
    
    # Prisma Model Names (PascalCase)
    (r'\bPatientAccessRequest\b', 'CustomerAccessRequest'),
    (r'\bPatientAllergy\b', 'CustomerAllergy'),
    (r'\bPatientAmendmentRequest\b', 'CustomerAmendmentRequest'),
    (r'\bPatientCommunicationRequest\b', 'CustomerCommunicationRequest'),
    (r'\bPatientConsent\b', 'CustomerConsent'),
    (r'\bPatientDiagnosis\b', 'CustomerDiagnosis'),
    (r'\bPatientFamilyHistory\b', 'CustomerFamilyHistory'),
    (r'\bPatientImmunization\b', 'CustomerImmunization'),
    (r'\bPatientMedication\b', 'CustomerMedication'),
    (r'\bPatientProcedure\b', 'CustomerProcedure'),
    (r'\bPatientRepository\b', 'CustomerRepository'),
    (r'\bPatientVitalSign\b', 'CustomerVitalSign'),
    (r'\bPatientLabResult\b', 'CustomerLabResult'),
    (r'\bPatientEncounter\b', 'CustomerEncounter'),
    
    # Table names in @@map directives
    (r'@@map\("patient_access_requests"\)', '@@map("customer_access_requests")'),
    (r'@@map\("patient_allergies"\)', '@@map("customer_allergies")'),
    (r'@@map\("patient_amendment_requests"\)', '@@map("customer_amendment_requests")'),
    (r'@@map\("patient_communication_requests"\)', '@@map("customer_communication_requests")'),
    (r'@@map\("patient_consents"\)', '@@map("customer_consents")'),
    (r'@@map\("patient_diagnoses"\)', '@@map("customer_diagnoses")'),
    (r'@@map\("patient_family_history"\)', '@@map("customer_family_history")'),
    (r'@@map\("patient_immunizations"\)', '@@map("customer_immunizations")'),
    (r'@@map\("patient_medications"\)', '@@map("customer_medications")'),
    (r'@@map\("patient_procedures"\)', '@@map("customer_procedures")'),
    (r'@@map\("patient_repositories"\)', '@@map("customer_repositories")'),
    (r'@@map\("patient_vital_signs"\)', '@@map("customer_vital_signs")'),
    (r'@@map\("patient_lab_results"\)', '@@map("customer_lab_results")'),
    (r'@@map\("patient_encounters"\)', '@@map("customer_encounters")'),
    
    # Field names with @map directives
    (r'@map\("patient_id"\)', '@map("customer_id")'),
    (r'@map\("patient_name"\)', '@map("customer_name")'),
    (r'@map\("patient_record"\)', '@map("customer_record")'),
    
    # Service and Component Names (PascalCase)
    (r'\bPatientRightsService\b', 'CustomerRightsService'),
    (r'\bPatientSearchService\b', 'CustomerSearchService'),
    (r'\bPatientCard\b', 'CustomerCard'),
    (r'\bPatientDetailView\b', 'CustomerDetailView'),
    (r'\bPatientList\b', 'CustomerList'),
    (r'\bPatientSearch\b', 'CustomerSearch'),
    (r'\bPatientSearchBar\b', 'CustomerSearchBar'),
    
    # Type and Interface Names (PascalCase)
    (r'\bPatientData\b', 'CustomerData'),
    (r'\bPatientInfo\b', 'CustomerInfo'),
    (r'\bPatientRecord\b', 'CustomerRecord'),
    (r'\bPatientProfile\b', 'CustomerProfile'),
    (r'\bPatientDetails\b', 'CustomerDetails'),
    (r'\bPatientSearchResult\b', 'CustomerSearchResult'),
    (r'\bPatientSearchParams\b', 'CustomerSearchParams'),
    
    # Variable and parameter names (camelCase)
    (r'\bpatientId\b', 'customerId'),
    (r'\bpatientIds\b', 'customerIds'),
    (r'\bpatientData\b', 'customerData'),
    (r'\bpatientInfo\b', 'customerInfo'),
    (r'\bpatientRecord\b', 'customerRecord'),
    (r'\bpatientProfile\b', 'customerProfile'),
    (r'\bpatientDetails\b', 'customerDetails'),
    (r'\bpatientSearch\b', 'customerSearch'),
    (r'\bpatientName\b', 'customerName'),
    (r'\bpatientEmail\b', 'customerEmail'),
    
    # Snake case (database fields, file names)
    (r'\bpatient_id\b', 'customer_id'),
    (r'\bpatient_ids\b', 'customer_ids'),
    (r'\bpatient_name\b', 'customer_name'),
    (r'\bpatient_record\b', 'customer_record'),
    (r'\bpatient_data\b', 'customer_data'),
    (r'\bpatient_info\b', 'customer_info'),
    
    # Array and collection names
    (r'\baffectedPatientIds\b', 'affectedCustomerIds'),
    
    # Relation names in Prisma
    (r'@relation\("PatientConsents"\)', '@relation("CustomerConsents")'),
    (r'@relation\("PatientAllergies"\)', '@relation("CustomerAllergies")'),
    (r'@relation\("PatientMedications"\)', '@relation("CustomerMedications")'),
    
    # General capitalized versions (must come after specific patterns)
    (r'\bPatient\b', 'Customer'),
    (r'\bPatients\b', 'Customers'),
    (r'\bPATIENT\b', 'CUSTOMER'),
    (r'\bPATIENTS\b', 'CUSTOMERS'),
    
    # General lowercase versions (must come last)
    (r'\bpatient\b', 'customer'),
    (r'\bpatients\b', 'customers'),
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
    "venv",
    "terminology-update",
    "TERMINOLOGY_UPDATE"
]

def should_process_file(file_path: Path) -> bool:
    """Check if file should be processed."""
    # Check extension
    if file_path.suffix not in EXTENSIONS:
        return False
    
    # Check exclude patterns
    path_str = str(file_path)
    for pattern in EXCLUDE_PATTERNS:
        if pattern in path_str:
            return False
    
    return True

def update_file_content(content: str, file_path: Path) -> Tuple[str, int, List[str]]:
    """Update content with terminology replacements."""
    updated_content = content
    total_replacements = 0
    changes = []
    
    for pattern, replacement in REPLACEMENTS:
        matches = re.findall(pattern, updated_content)
        if matches:
            updated_content, count = re.subn(pattern, replacement, updated_content)
            if count > 0:
                total_replacements += count
                changes.append(f"  {pattern} → {replacement} ({count}x)")
    
    return updated_content, total_replacements, changes

def process_file(file_path: Path) -> Tuple[bool, int, List[str]]:
    """Process a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        updated_content, replacements, changes = update_file_content(original_content, file_path)
        
        if replacements > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            return True, replacements, changes
        
        return False, 0, []
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False, 0, []

def main():
    """Main execution function."""
    print("=" * 80)
    print("HoloVitals v1.4.1 - Comprehensive Terminology Update")
    print("=" * 80)
    print("Updating: patient → customer (ALL OCCURRENCES)")
    print("This includes: Database Schema, APIs, Services, Components, and UI")
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
        
        print(f"\n📁 Processing: {directory}")
        print("-" * 80)
        
        if dir_path.is_file():
            # Handle single file
            total_files_processed += 1
            updated, replacements, changes = process_file(dir_path)
            if updated:
                total_files_updated += 1
                total_replacements += replacements
                updated_files.append((str(dir_path), replacements, changes))
                print(f"  ✓ {dir_path.name} ({replacements} replacements)")
        else:
            # Handle directory
            for file_path in sorted(dir_path.rglob("*")):
                if file_path.is_file() and should_process_file(file_path):
                    total_files_processed += 1
                    updated, replacements, changes = process_file(file_path)
                    
                    if updated:
                        total_files_updated += 1
                        total_replacements += replacements
                        updated_files.append((str(file_path), replacements, changes))
                        rel_path = file_path.relative_to(dir_path.parent)
                        print(f"  ✓ {rel_path} ({replacements} replacements)")
    
    print()
    print("=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)
    print(f"  Files scanned:     {total_files_processed}")
    print(f"  Files updated:     {total_files_updated}")
    print(f"  Total replacements: {total_replacements}")
    print()
    
    if updated_files:
        print("=" * 80)
        print("📝 DETAILED CHANGES (Top 20 files)")
        print("=" * 80)
        for file_path, count, changes in sorted(updated_files, key=lambda x: x[1], reverse=True)[:20]:
            print(f"\n{file_path}: {count} replacements")
            for change in changes[:5]:  # Show first 5 changes per file
                print(change)
            if len(changes) > 5:
                print(f"  ... and {len(changes) - 5} more changes")
    
    print()
    print("=" * 80)
    print("✅ Comprehensive terminology update complete!")
    print("=" * 80)
    print()
    print("⚠️  IMPORTANT NEXT STEPS:")
    print("  1. Review the changes carefully")
    print("  2. Run database migration (Prisma)")
    print("  3. Update API documentation")
    print("  4. Test all functionality")
    print("  5. Create migration guide for users")
    print()

if __name__ == "__main__":
    main()