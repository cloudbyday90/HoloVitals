#!/bin/bash

################################################################################
# Generate Checksums for HoloVitals Deployment Files
# Creates SHA256 checksums for verification
################################################################################

CHECKSUM_FILE="CHECKSUMS.txt"

echo "Generating checksums for HoloVitals deployment files..."
echo "Generated on: $(date)" > "$CHECKSUM_FILE"
echo "Repository: https://github.com/cloudbyday90/HoloVitals" >> "$CHECKSUM_FILE"
echo "" >> "$CHECKSUM_FILE"

# Generate checksums for deployment scripts
sha256sum deploy-holovitals.sh >> "$CHECKSUM_FILE" 2>/dev/null
sha256sum verify-installation.sh >> "$CHECKSUM_FILE" 2>/dev/null

# Generate checksums for key application files
cd medical-analysis-platform 2>/dev/null || true

if [ -d "." ]; then
    find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" \) \
        ! -path "*/node_modules/*" \
        ! -path "*/.next/*" \
        ! -path "*/dist/*" \
        -exec sha256sum {} \; >> "../$CHECKSUM_FILE" 2>/dev/null
fi

cd ..

echo ""
echo "✓ Checksums generated: $CHECKSUM_FILE"
echo ""
echo "To verify files:"
echo "  sha256sum -c $CHECKSUM_FILE"