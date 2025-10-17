#!/usr/bin/env python3
"""
Branding Lockdown Scanner
Scans entire codebase for forbidden branding references.
Returns exit code 1 if any violations found (blocks CI/pre-commit).
"""
import sys
import re
import pathlib
from typing import List, Tuple

# Load blocklist from central source of truth
BLOCKLIST_FILE = pathlib.Path(__file__).parent.parent / '.branding-blocklist.txt'

def load_blocklist() -> List[str]:
    """Load forbidden terms from .branding-blocklist.txt"""
    if not BLOCKLIST_FILE.exists():
        print(f"ERROR: Blocklist not found at {BLOCKLIST_FILE}", file=sys.stderr)
        sys.exit(1)
    
    terms = []
    with open(BLOCKLIST_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            term = line.strip()
            if term and not term.startswith('#'):
                terms.append(term)
    return terms

# Build regex from blocklist
BLOCKED_TERMS = load_blocklist()
BRANDING_PATTERN = re.compile(
    r'\b(' + '|'.join(re.escape(term) for term in BLOCKED_TERMS) + r')\b',
    re.IGNORECASE
)

# Directories to skip
SKIP_DIRS = {
    '.git', 'node_modules', 'dist', 'build', '.next', 'venv', '__pycache__',
    'out', 'coverage', '.pytest_cache', '.mypy_cache', 'venv_tregu',
    'media', 'uploads', 'static'
}

# File extensions to skip (binary files)
SKIP_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.svg', '.woff', '.woff2',
    '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.wav', '.zip', '.tar', '.gz',
    '.pyc', '.pyo', '.so', '.dylib', '.dll', '.exe', '.bin', '.dat'
}

def should_skip_path(path: pathlib.Path) -> bool:
    """Check if path should be skipped"""
    # Skip directories
    if any(part in SKIP_DIRS for part in path.parts):
        return True
    
    # Skip by extension
    if path.suffix.lower() in SKIP_EXTENSIONS:
        return True
    
    # Skip the blocklist file itself
    if path.name == '.branding-blocklist.txt':
        return True
    
    # Skip this scanner script
    if path.name == 'branding_scan.py':
        return True
    
    return False

def scan_file(file_path: pathlib.Path) -> List[Tuple[int, str]]:
    """Scan a single file for branding references"""
    violations = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, start=1):
                if BRANDING_PATTERN.search(line):
                    # Truncate long lines
                    line_preview = line.strip()[:150]
                    violations.append((line_num, line_preview))
    except Exception as e:
        # Skip files that can't be read (might be binary)
        pass
    
    return violations

def scan_directory(root: str = '.') -> List[Tuple[pathlib.Path, int, str]]:
    """Recursively scan directory for branding violations"""
    all_violations = []
    root_path = pathlib.Path(root).resolve()
    
    for file_path in root_path.rglob('*'):
        if not file_path.is_file():
            continue
        
        if should_skip_path(file_path):
            continue
        
        violations = scan_file(file_path)
        for line_num, line_text in violations:
            # Store as (relative_path, line_num, line_text)
            rel_path = file_path.relative_to(root_path)
            all_violations.append((rel_path, line_num, line_text))
    
    return all_violations

def format_violation(rel_path: pathlib.Path, line_num: int, line_text: str) -> str:
    """Format violation for output"""
    return f"{rel_path}:{line_num}:{line_text}"

def main():
    """Main entry point"""
    print("🔍 Branding Lockdown Scanner")
    print(f"   Loaded {len(BLOCKED_TERMS)} blocked terms from {BLOCKLIST_FILE.name}")
    print()
    
    # Scan from repo root (one level up from tools/)
    repo_root = pathlib.Path(__file__).parent.parent
    violations = scan_directory(str(repo_root))
    
    if not violations:
        print("✅ PASS: No branding references found.")
        print("   All clear for commit/deployment.")
        return 0
    
    # Report violations
    print(f"❌ FAIL: Found {len(violations)} branding reference(s)")
    print()
    
    # Group by file for cleaner output
    by_file = {}
    for rel_path, line_num, line_text in violations:
        if rel_path not in by_file:
            by_file[rel_path] = []
        by_file[rel_path].append((line_num, line_text))
    
    for file_path in sorted(by_file.keys()):
        print(f"📄 {file_path}")
        for line_num, line_text in by_file[file_path]:
            print(f"   Line {line_num}: {line_text}")
        print()
    
    print("⚠️  Branding customization is forbidden by system policy.")
    print("   Remove all references to branding/theming before committing.")
    print()
    
    return 1

if __name__ == '__main__':
    sys.exit(main())
