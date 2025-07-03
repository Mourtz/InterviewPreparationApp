#!/bin/bash

# Release Helper Script for Interview Preparation App
# This script helps create tags and trigger releases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate version format
validate_version() {
    if [[ ! $1 =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format. Use vX.Y.Z (e.g., v1.0.0)"
        exit 1
    fi
}

# Function to check if tag exists
check_tag_exists() {
    if git rev-parse "$1" >/dev/null 2>&1; then
        print_error "Tag $1 already exists!"
        exit 1
    fi
}

# Function to update package.json version
update_package_version() {
    local version=$1
    local version_no_v=${version#v}  # Remove 'v' prefix
    
    print_status "Updating package.json version to $version_no_v"
    
    # Update main package.json
    if command -v jq >/dev/null 2>&1; then
        jq ".version = \"$version_no_v\"" package.json > package.json.tmp && mv package.json.tmp package.json
    else
        # Fallback using sed (less reliable but works without jq)
        sed -i.bak "s/\"version\": \".*\"/\"version\": \"$version_no_v\"/" package.json
        rm -f package.json.bak
    fi
    
    # Update web package.json if it exists
    if [ -f "web/package.json" ]; then
        print_status "Updating web/package.json version to $version_no_v"
        if command -v jq >/dev/null 2>&1; then
            jq ".version = \"$version_no_v\"" web/package.json > web/package.json.tmp && mv web/package.json.tmp web/package.json
        else
            sed -i.bak "s/\"version\": \".*\"/\"version\": \"$version_no_v\"/" web/package.json
            rm -f web/package.json.bak
        fi
    fi
}

# Function to create and push tag
create_and_push_tag() {
    local version=$1
    
    print_status "Creating tag $version"
    git add package.json web/package.json 2>/dev/null || git add package.json
    git commit -m "Bump version to $version" || print_warning "No changes to commit"
    
    git tag -a "$version" -m "Release $version"
    
    print_status "Pushing tag $version to origin"
    git push origin main
    git push origin "$version"
    
    print_status "Tag $version created and pushed successfully!"
    print_status "GitHub Actions will now build the binaries automatically."
    print_status "Check the progress at: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
}

# Main script
main() {
    echo "🎯 Interview Preparation App - Release Helper"
    echo "============================================="
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository!"
        exit 1
    fi
    
    # Check if we're on main branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        print_warning "You're on branch '$current_branch', not 'main'. Continue? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_status "Cancelled."
            exit 0
        fi
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes. They will be committed with the version bump. Continue? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_status "Cancelled. Please commit or stash your changes first."
            exit 0
        fi
    fi
    
    # Get version from user
    if [ $# -eq 1 ]; then
        version=$1
    else
        echo
        print_status "Current version in package.json: $(grep '"version"' package.json | sed 's/.*"version": "\([^"]*\)".*/\1/')"
        echo
        echo -n "Enter new version (e.g., v1.0.0): "
        read -r version
    fi
    
    # Validate version
    validate_version "$version"
    
    # Check if tag already exists
    check_tag_exists "$version"
    
    # Confirm with user
    echo
    print_status "This will:"
    echo "  1. Update package.json version to ${version#v}"
    echo "  2. Commit the version bump"
    echo "  3. Create and push tag $version"
    echo "  4. Trigger GitHub Actions to build binaries"
    echo
    echo -n "Continue? (y/N): "
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        update_package_version "$version"
        create_and_push_tag "$version"
        
        echo
        print_status "Release process initiated! 🚀"
        print_status "Monitor the build progress on GitHub Actions."
        print_status "Binaries will be available at: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/releases/tag/$version"
    else
        print_status "Cancelled."
    fi
}

# Show help
show_help() {
    echo "Usage: $0 [version]"
    echo ""
    echo "Creates a new release tag and triggers automated binary builds."
    echo ""
    echo "Arguments:"
    echo "  version    Version to release (e.g., v1.0.0)"
    echo ""
    echo "Examples:"
    echo "  $0 v1.0.0     # Create release v1.0.0"
    echo "  $0            # Interactive mode"
    echo ""
    echo "Options:"
    echo "  -h, --help    Show this help message"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
