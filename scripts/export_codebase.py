"""
Script to export the entire codebase into a single text file for AI consumption.
Run: python scripts/export_codebase.py
"""

import os
from pathlib import Path
from datetime import datetime

# Root directory of the project
ROOT_DIR = Path(__file__).parent.parent

# Output file
OUTPUT_FILE = ROOT_DIR / "codebase_export.txt"

# Directories to exclude
EXCLUDE_DIRS = {
    'node_modules',
    '.git',
    '.next',
    '__pycache__',
    'venv',
    'env',
    'embedding_env',
    '.vscode',
    'dist',
    'build',
    '.cache',
    'coverage',
    'Lib',
    'Include',
    'Scripts',
    'site-packages',
}

# Files to exclude
EXCLUDE_FILES = {
    '.gitignore',
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store',
    'Thumbs.db',
    'codebase_export.txt',  # Don't include the output file itself
}

# File extensions to include (code and config files)
INCLUDE_EXTENSIONS = {
    # JavaScript/TypeScript
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    # Python
    '.py',
    # Web
    '.html', '.css', '.scss', '.sass', '.less',
    # Config
    '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg',
    # Documentation
    '.md', '.mdx', '.txt', '.rst',
    # Shell scripts
    '.sh', '.bash', '.ps1', '.bat', '.cmd',
    # SQL
    '.sql',
    # Other
    '.env.example', '.gitignore.example',
}

# Files without extensions to include
INCLUDE_FILENAMES = {
    'Dockerfile',
    'Makefile',
    '.eslintrc',
    '.prettierrc',
    '.babelrc',
}


def should_include_file(file_path: Path) -> bool:
    """Check if a file should be included in the export."""
    # Check if file is in exclude list
    if file_path.name in EXCLUDE_FILES:
        return False
    
    # Check if any parent directory is excluded
    for parent in file_path.parents:
        if parent.name in EXCLUDE_DIRS:
            return False
    
    # Check extension
    if file_path.suffix.lower() in INCLUDE_EXTENSIONS:
        return True
    
    # Check filename without extension
    if file_path.name in INCLUDE_FILENAMES:
        return True
    
    return False


def is_binary_file(file_path: Path) -> bool:
    """Check if a file is binary."""
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(1024)
            if b'\x00' in chunk:
                return True
        return False
    except Exception:
        return True


def get_relative_path(file_path: Path) -> str:
    """Get the relative path from the root directory."""
    try:
        return str(file_path.relative_to(ROOT_DIR))
    except ValueError:
        return str(file_path)


def collect_files() -> list[Path]:
    """Collect all files to be included in the export."""
    files = []
    
    for root, dirs, filenames in os.walk(ROOT_DIR):
        # Remove excluded directories from dirs to prevent walking into them
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for filename in filenames:
            file_path = Path(root) / filename
            if should_include_file(file_path) and not is_binary_file(file_path):
                files.append(file_path)
    
    # Sort files for consistent output
    files.sort(key=lambda p: get_relative_path(p).lower())
    return files


def export_codebase():
    """Export the entire codebase to a single text file."""
    files = collect_files()
    
    print(f"Found {len(files)} files to export...")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
        # Write header
        out.write("=" * 80 + "\n")
        out.write("CODEBASE EXPORT\n")
        out.write(f"Project: PaperGenie\n")
        out.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        out.write(f"Total Files: {len(files)}\n")
        out.write("=" * 80 + "\n\n")
        
        # Write table of contents
        out.write("TABLE OF CONTENTS\n")
        out.write("-" * 40 + "\n")
        for i, file_path in enumerate(files, 1):
            rel_path = get_relative_path(file_path)
            out.write(f"{i:3}. {rel_path}\n")
        out.write("\n" + "=" * 80 + "\n\n")
        
        # Write each file
        for file_path in files:
            rel_path = get_relative_path(file_path)
            
            out.write(f"\n{'=' * 80}\n")
            out.write(f"FILE: {rel_path}\n")
            out.write(f"{'=' * 80}\n\n")
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    out.write(content)
                    if not content.endswith('\n'):
                        out.write('\n')
            except Exception as e:
                out.write(f"[Error reading file: {e}]\n")
            
            out.write("\n")
        
        # Write footer
        out.write("\n" + "=" * 80 + "\n")
        out.write("END OF CODEBASE EXPORT\n")
        out.write("=" * 80 + "\n")
    
    # Get file size
    size_bytes = OUTPUT_FILE.stat().st_size
    size_kb = size_bytes / 1024
    size_mb = size_kb / 1024
    
    print(f"\n✅ Export complete!")
    print(f"📁 Output: {OUTPUT_FILE}")
    print(f"📊 Size: {size_kb:.2f} KB ({size_mb:.2f} MB)")
    print(f"📄 Files included: {len(files)}")


if __name__ == "__main__":
    export_codebase()
