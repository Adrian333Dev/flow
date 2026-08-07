#!/usr/bin/env bash
# Lists all guides with descriptions. Run from project root.
# Output: - docs/guides/... | description

find docs/guides -name "*.md" | sort | while read -r file; do
  desc=$(awk '
    NR==1 && /^---/ { fm=1; next }
    fm && /^---/ { exit }
    fm && /^description:/ {
      sub(/^description:[[:space:]]*/, "")
      gsub(/^["'"'"']|["'"'"']$/, "")
      print
      exit
    }
  ' "$file")
  [ -n "$desc" ] && echo "- $file | $desc"
done

exit 0
