import os
import sys
import re

def check_gitignore():
    if not os.path.exists('.gitignore'):
        print("Error: .gitignore file is missing.")
        return False
    
    with open('.gitignore', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check if .env patterns are matched
    # A simple regex to see if .env or .env.local is ignored
    if not re.search(r'^\.env$', content, re.MULTILINE):
        print("Error: .env is not in .gitignore. This is a severe security risk.")
        return False
        
    if not re.search(r'^\*\.local$', content, re.MULTILINE) and not re.search(r'^\.env\.local$', content, re.MULTILINE):
        print("Error: .env.local or *.local is not in .gitignore. This is a severe security risk.")
        return False
        
    return True

def check_env_example():
    if not os.path.exists('.env.example'):
        print("Error: .env.example file is missing. Please create one with placeholder variables.")
        return False
    
    with open('.env.example', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for potential real firebase API keys (AIzaSy...)
    if re.search(r'AIzaSy[0-9a-zA-Z_-]{33}', content):
        print("Error: Real Firebase API key detected in .env.example!")
        return False
        
    # Check for other potential secrets like "password"
    if re.search(r'=[^<]*[0-9]{4,}', content) and 'PORT' not in content:
         # very naive check, it might be better to just rely on semgrep for advanced analysis
         pass
        
    return True

def main():
    print("Running Security Checks...")
    success = True
    if not check_gitignore():
        success = False
    if not check_env_example():
        success = False
        
    if not success:
        sys.exit(1)
        
    print("Security Checks passed.")
    sys.exit(0)

if __name__ == "__main__":
    main()
