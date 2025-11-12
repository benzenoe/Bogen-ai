#!/bin/bash

echo "=== Navigation Menu Verification Report ==="
echo ""
echo "Checking all public HTML pages for Blog and Video links..."
echo ""

cd /Users/edmundbogen/bogen-ai

for file in views/*.html views/services/*.html; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        has_blog=$(grep -c "/blog" "$file" 2>/dev/null || echo "0")
        has_video=$(grep -c "video-archive" "$file" 2>/dev/null || echo "0")

        if [ "$has_blog" -gt 0 ] && [ "$has_video" -gt 0 ]; then
            echo "✅ $filename - Has both Blog and Video"
        elif [ "$has_blog" -gt 0 ]; then
            echo "⚠️  $filename - Has Blog, MISSING Video"
        elif [ "$has_video" -gt 0 ]; then
            echo "⚠️  $filename - Has Video, MISSING Blog"
        else
            echo "❌ $filename - MISSING both Blog and Video"
        fi
    fi
done
