import sys

filepath = r"d:\HRIS_BQA_Project\HRIS_BQA_Github\HRIS-BQA\server.ts"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Remove lines 2867 to 2937 (which is index 2866 to 2937 since 0-indexed)
del lines[2866:2937]

with open(filepath, "w", encoding="utf-8", newline="") as f:
    f.writelines(lines)

print("Removed duplicated lines.")
