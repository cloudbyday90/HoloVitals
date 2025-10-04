#!/usr/bin/env python3
"""
Script to merge multiple Prisma schema files into one consolidated schema.
Handles duplicate models and ensures proper structure.
"""

import re
from pathlib import Path

def extract_models(schema_content):
    """Extract all model definitions from schema content."""
    models = {}
    current_model = None
    current_content = []
    in_model = False
    brace_count = 0
    
    lines = schema_content.split('\n')
    
    for line in lines:
        # Check if this is a model declaration
        if line.strip().startswith('model '):
            if current_model and current_content:
                models[current_model] = '\n'.join(current_content)
            
            current_model = line.strip().split()[1]
            current_content = [line]
            in_model = True
            brace_count = line.count('{') - line.count('}')
        elif in_model:
            current_content.append(line)
            brace_count += line.count('{') - line.count('}')
            
            if brace_count == 0:
                models[current_model] = '\n'.join(current_content)
                current_model = None
                current_content = []
                in_model = False
    
    # Handle last model if file doesn't end with newline
    if current_model and current_content:
        models[current_model] = '\n'.join(current_content)
    
    return models

def extract_enums(schema_content):
    """Extract all enum definitions from schema content."""
    enums = {}
    current_enum = None
    current_content = []
    in_enum = False
    brace_count = 0
    
    lines = schema_content.split('\n')
    
    for line in lines:
        if line.strip().startswith('enum '):
            if current_enum and current_content:
                enums[current_enum] = '\n'.join(current_content)
            
            current_enum = line.strip().split()[1]
            current_content = [line]
            in_enum = True
            brace_count = line.count('{') - line.count('}')
        elif in_enum:
            current_content.append(line)
            brace_count += line.count('{') - line.count('}')
            
            if brace_count == 0:
                enums[current_enum] = '\n'.join(current_content)
                current_enum = None
                current_content = []
                in_enum = False
    
    if current_enum and current_content:
        enums[current_enum] = '\n'.join(current_content)
    
    return enums

def merge_schemas():
    """Merge all schema files into one consolidated schema."""
    
    # Read main schema
    main_schema_path = Path('./medical-analysis-platform/prisma/schema.prisma')
    with open(main_schema_path, 'r') as f:
        main_content = f.read()
    
    # Extract header (generator, datasource, comments)
    header_lines = []
    for line in main_content.split('\n'):
        if line.strip().startswith('model ') or line.strip().startswith('enum '):
            break
        header_lines.append(line)
    
    header = '\n'.join(header_lines)
    
    # Extract models and enums from main schema
    all_models = extract_models(main_content)
    all_enums = extract_enums(main_content)
    
    print(f"Main schema has {len(all_models)} models and {len(all_enums)} enums")
    
    # Additional schema files to merge
    additional_schemas = [
        './prisma/schema-medical-standardization.prisma',
        './prisma/schema-athenahealth-eclinicalworks.prisma',
        './prisma/schema-hipaa-compliance.prisma',
        './prisma/schema-hipaa-additional.prisma',
        './prisma/schema-compliance-additions.prisma'
    ]
    
    # Merge additional schemas
    for schema_path in additional_schemas:
        path = Path(schema_path)
        if not path.exists():
            print(f"Warning: {schema_path} not found, skipping...")
            continue
        
        with open(path, 'r') as f:
            content = f.read()
        
        models = extract_models(content)
        enums = extract_enums(content)
        
        print(f"\n{path.name}: {len(models)} models, {len(enums)} enums")
        
        # Add new models (skip duplicates)
        for model_name, model_content in models.items():
            if model_name not in all_models:
                all_models[model_name] = model_content
                print(f"  + Added model: {model_name}")
            else:
                print(f"  - Skipped duplicate model: {model_name}")
        
        # Add new enums (skip duplicates)
        for enum_name, enum_content in enums.items():
            if enum_name not in all_enums:
                all_enums[enum_name] = enum_content
                print(f"  + Added enum: {enum_name}")
            else:
                print(f"  - Skipped duplicate enum: {enum_name}")
    
    # Build consolidated schema
    consolidated = [header]
    consolidated.append('\n// ============================================================================')
    consolidated.append('// ENUMS')
    consolidated.append('// ============================================================================\n')
    
    for enum_name in sorted(all_enums.keys()):
        consolidated.append(all_enums[enum_name])
        consolidated.append('')
    
    consolidated.append('\n// ============================================================================')
    consolidated.append('// MODELS')
    consolidated.append('// ============================================================================\n')
    
    for model_name in sorted(all_models.keys()):
        consolidated.append(all_models[model_name])
        consolidated.append('')
    
    # Write consolidated schema
    output_path = Path('./prisma/schema-consolidated.prisma')
    with open(output_path, 'w') as f:
        f.write('\n'.join(consolidated))
    
    print(f"\n✅ Consolidated schema written to {output_path}")
    print(f"Total: {len(all_models)} models, {len(all_enums)} enums")
    
    return len(all_models), len(all_enums)

if __name__ == '__main__':
    models_count, enums_count = merge_schemas()
    print(f"\n🎉 Schema consolidation complete!")
    print(f"   Models: {models_count}")
    print(f"   Enums: {enums_count}")