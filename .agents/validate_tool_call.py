#!/usr/bin/env python3
import sys
import os
import json

def validate_command(command, cwd):
    # Ensure command runs within the project directory or system safe commands
    abs_cwd = os.path.abspath(cwd)
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    # Simple check: Cwd must be inside the project root
    if not abs_cwd.startswith(project_root):
        print(f"Error: Command execution path '{abs_cwd}' is outside project root '{project_root}'", file=sys.stderr)
        return False
        
    # Block dangerous patterns
    dangerous_keywords = ["rm -rf", "mkfs", "format", "chmod 777"]
    for keyword in dangerous_keywords:
        if keyword in command:
            print(f"Error: Dangerous command keyword '{keyword}' detected!", file=sys.stderr)
            return False
            
    return True

def validate_file_edit(filepath):
    abs_filepath = os.path.abspath(filepath)
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    # Avoid editing system files or git config directly, or files outside project root
    if not abs_filepath.startswith(project_root):
        print(f"Error: File path '{abs_filepath}' is outside project root '{project_root}'", file=sys.stderr)
        return False
        
    # Prevent touching sensitive directories
    sensitive_dirs = [os.path.join(project_root, ".git")]
    for s_dir in sensitive_dirs:
        if abs_filepath.startswith(s_dir):
            print(f"Error: Attempt to modify sensitive directory '{s_dir}'", file=sys.stderr)
            return False
            
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: validate_tool_call.py <tool_json_arguments>", file=sys.stderr)
        sys.exit(0)  # default allow if no arguments provided to prevent lockups

    try:
        args = json.loads(sys.argv[1])
        tool_name = args.get("tool_name", "")
        
        if tool_name == "run_command":
            cmd = args.get("CommandLine", "")
            cwd = args.get("Cwd", ".")
            if not validate_command(cmd, cwd):
                sys.exit(1)
        elif tool_name in ["write_file", "replace_file_content", "multi_replace_file_content"]:
            target_file = args.get("TargetFile", "")
            if target_file and not validate_file_edit(target_file):
                sys.exit(1)
                
    except Exception as e:
        print(f"Error during tool call validation: {e}", file=sys.stderr)
        sys.exit(1)

    # All checks passed
    sys.exit(0)

if __name__ == "__main__":
    main()
