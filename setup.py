#!/usr/bin/env python3
"""
Setup script for AI Fitness + Nutrition Tracker
This script helps set up the development environment and run initial tests.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, cwd=None, check=True):
    """Run a shell command and return the result."""
    print(f"Running: {command}")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            check=check, 
            capture_output=True, 
            text=True
        )
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def check_python_version():
    """Check if Python version is 3.11 or higher."""
    print("Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        print(f"❌ Python 3.11+ required, found {version.major}.{version.minor}")
        sys.exit(1)
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")

def check_docker():
    """Check if Docker and Docker Compose are available."""
    print("Checking Docker...")
    
    # Check Docker
    result = run_command("docker --version", check=False)
    if result.returncode != 0:
        print("❌ Docker not found. Please install Docker.")
        return False
    print("✅ Docker found")
    
    # Check Docker Compose
    result = run_command("docker-compose --version", check=False)
    if result.returncode != 0:
        print("❌ Docker Compose not found. Please install Docker Compose.")
        return False
    print("✅ Docker Compose found")
    
    return True

def setup_environment():
    """Set up environment files."""
    print("Setting up environment...")
    
    # Copy env.example to .env if it doesn't exist
    env_file = Path(".env")
    env_example = Path("env.example")
    
    if not env_file.exists() and env_example.exists():
        shutil.copy(env_example, env_file)
        print("✅ Created .env file from env.example")
        print("⚠️  Please review and update .env file with your settings")
    elif env_file.exists():
        print("✅ .env file already exists")
    else:
        print("⚠️  No environment file found. Please create .env manually")

def install_dependencies():
    """Install Python dependencies."""
    print("Installing Python dependencies...")
    
    server_dir = Path("server")
    if not server_dir.exists():
        print("❌ Server directory not found")
        return False
    
    # Install requirements
    result = run_command("pip install -r requirements.txt", cwd=server_dir, check=False)
    if result.returncode != 0:
        print("❌ Failed to install dependencies")
        return False
    
    print("✅ Dependencies installed successfully")
    return True

def run_tests():
    """Run the test suite."""
    print("Running tests...")
    
    server_dir = Path("server")
    if not server_dir.exists():
        print("❌ Server directory not found")
        return False
    
    # Run the simple API test
    result = run_command("python test_api_simple.py", cwd=server_dir, check=False)
    if result.returncode != 0:
        print("❌ Tests failed")
        return False
    
    print("✅ Tests passed")
    return True

def main():
    """Main setup function."""
    print("AI Fitness + Nutrition Tracker - Setup Script")
    print("=" * 50)
    
    # Check Python version
    check_python_version()
    
    # Check Docker (optional for local development)
    docker_available = check_docker()
    
    # Setup environment
    setup_environment()
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Setup failed at dependency installation")
        sys.exit(1)
    
    # Run tests
    if not run_tests():
        print("❌ Setup failed at testing")
        sys.exit(1)
    
    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Review and update .env file if needed")
    print("2. Start the application:")
    
    if docker_available:
        print("   Option A (Docker): cd docker && docker-compose up -d")
        print("   Option B (Local): cd server && uvicorn app.main:app --reload")
    else:
        print("   cd server && uvicorn app.main:app --reload")
        print("   (Note: You'll need MongoDB and Redis running locally)")
    
    print("3. Access API docs at: http://localhost:8000/docs")
    print("4. For mobile development: cd mobile && npm install")

if __name__ == "__main__":
    main()
