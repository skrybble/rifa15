#!/usr/bin/env python3
"""
RafflyWin Backend API Testing
Tests PWA configuration and Admin Dashboard enhancement endpoints
"""

import requests
import json
import sys
from typing import Dict, Any, List, Optional

# Base URLs
FRONTEND_URL = "https://ticket-win.preview.emergentagent.com"
API_BASE_URL = "https://ticket-win.preview.emergentagent.com/api"

# Admin credentials for testing
ADMIN_EMAIL = "admin@rafflywin.com"
ADMIN_PASSWORD = "test123"

class PWATestResults:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
    
    def add_result(self, test_name: str, passed: bool, message: str, details: Any = None):
        self.results.append({
            "test": test_name,
            "passed": passed,
            "message": message,
            "details": details
        })
        if passed:
            self.passed += 1
        else:
            self.failed += 1
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"PWA TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {len(self.results)}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {(self.passed/len(self.results)*100):.1f}%")
        
        if self.failed > 0:
            print(f"\n{'='*60}")
            print("FAILED TESTS:")
            print(f"{'='*60}")
            for result in self.results:
                if not result["passed"]:
                    print(f"❌ {result['test']}: {result['message']}")
                    if result["details"]:
                        print(f"   Details: {result['details']}")
        
        print(f"\n{'='*60}")
        print("ALL TEST RESULTS:")
        print(f"{'='*60}")
        for result in self.results:
            status = "✅" if result["passed"] else "❌"
            print(f"{status} {result['test']}: {result['message']}")

def test_pwa_file_accessibility(results: PWATestResults):
    """Test if PWA files are accessible via HTTP requests"""
    
    pwa_files = [
        {
            "path": "/manifest.json",
            "name": "Manifest JSON",
            "expected_content_type": "application/json"
        },
        {
            "path": "/service-worker.js", 
            "name": "Service Worker JS",
            "expected_content_type": "application/javascript"
        },
        {
            "path": "/icons/icon-192x192.png",
            "name": "Icon 192x192 PNG",
            "expected_content_type": "image/png"
        },
        {
            "path": "/icons/icon-512x512.png",
            "name": "Icon 512x512 PNG", 
            "expected_content_type": "image/png"
        }
    ]
    
    for file_info in pwa_files:
        try:
            url = BASE_URL + file_info["path"]
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '').lower()
                expected_type = file_info["expected_content_type"].lower()
                
                # Check content type
                if expected_type in content_type or content_type.startswith(expected_type.split('/')[0]):
                    results.add_result(
                        f"PWA File Access - {file_info['name']}", 
                        True,
                        f"Successfully accessed with correct content-type: {content_type}"
                    )
                else:
                    results.add_result(
                        f"PWA File Access - {file_info['name']}", 
                        False,
                        f"Wrong content-type. Expected: {expected_type}, Got: {content_type}"
                    )
            else:
                results.add_result(
                    f"PWA File Access - {file_info['name']}", 
                    False,
                    f"HTTP {response.status_code}: {response.reason}"
                )
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                f"PWA File Access - {file_info['name']}", 
                False,
                f"Request failed: {str(e)}"
            )

def test_manifest_json_content(results: PWATestResults):
    """Test manifest.json content for required PWA fields"""
    
    try:
        url = BASE_URL + "/manifest.json"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            results.add_result(
                "Manifest Content Test", 
                False,
                f"Could not fetch manifest.json: HTTP {response.status_code}"
            )
            return
        
        try:
            manifest = response.json()
        except json.JSONDecodeError as e:
            results.add_result(
                "Manifest JSON Parsing", 
                False,
                f"Invalid JSON in manifest.json: {str(e)}"
            )
            return
        
        # Test required fields
        required_fields = [
            ("short_name", "RafflyWin"),
            ("name", "RafflyWin - Plataforma de Rifas"),
            ("display", "standalone")
        ]
        
        for field, expected_value in required_fields:
            if field in manifest:
                actual_value = manifest[field]
                if actual_value == expected_value:
                    results.add_result(
                        f"Manifest Field - {field}", 
                        True,
                        f"Correct value: '{actual_value}'"
                    )
                else:
                    results.add_result(
                        f"Manifest Field - {field}", 
                        False,
                        f"Expected: '{expected_value}', Got: '{actual_value}'"
                    )
            else:
                results.add_result(
                    f"Manifest Field - {field}", 
                    False,
                    f"Missing required field: {field}"
                )
        
        # Test icons array
        if "icons" in manifest:
            icons = manifest["icons"]
            if isinstance(icons, list) and len(icons) > 0:
                results.add_result(
                    "Manifest Icons Array", 
                    True,
                    f"Icons array present with {len(icons)} icons"
                )
                
                # Check for required icon sizes
                required_sizes = ["192x192", "512x512"]
                found_sizes = [icon.get("sizes", "") for icon in icons]
                
                for size in required_sizes:
                    if size in found_sizes:
                        results.add_result(
                            f"Manifest Icon Size - {size}", 
                            True,
                            f"Icon size {size} found"
                        )
                    else:
                        results.add_result(
                            f"Manifest Icon Size - {size}", 
                            False,
                            f"Required icon size {size} not found. Available: {found_sizes}"
                        )
            else:
                results.add_result(
                    "Manifest Icons Array", 
                    False,
                    "Icons array is empty or not an array"
                )
        else:
            results.add_result(
                "Manifest Icons Array", 
                False,
                "Missing icons array in manifest.json"
            )
            
    except requests.exceptions.RequestException as e:
        results.add_result(
            "Manifest Content Test", 
            False,
            f"Request failed: {str(e)}"
        )

def test_index_html_pwa_meta_tags(results: PWATestResults):
    """Test index.html for required PWA meta tags"""
    
    try:
        url = BASE_URL + "/"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            results.add_result(
                "Index HTML Access", 
                False,
                f"Could not fetch index.html: HTTP {response.status_code}"
            )
            return
        
        html_content = response.text.lower()
        
        # Test for required meta tags and links
        required_tags = [
            {
                "name": "Manifest Link",
                "pattern": 'rel="manifest"',
                "description": "Link to manifest.json"
            },
            {
                "name": "Apple Mobile Web App Capable",
                "pattern": 'name="apple-mobile-web-app-capable"',
                "description": "Apple PWA meta tag"
            },
            {
                "name": "Theme Color",
                "pattern": 'name="theme-color"',
                "description": "Theme color meta tag"
            }
        ]
        
        for tag in required_tags:
            if tag["pattern"] in html_content:
                results.add_result(
                    f"HTML Meta Tag - {tag['name']}", 
                    True,
                    f"Found: {tag['description']}"
                )
            else:
                results.add_result(
                    f"HTML Meta Tag - {tag['name']}", 
                    False,
                    f"Missing: {tag['description']}"
                )
        
        # Test for service worker registration
        if "serviceWorker" in response.text and "register" in response.text:
            results.add_result(
                "Service Worker Registration", 
                True,
                "Service worker registration script found in HTML"
            )
        else:
            results.add_result(
                "Service Worker Registration", 
                False,
                "Service worker registration script not found in HTML"
            )
            
    except requests.exceptions.RequestException as e:
        results.add_result(
            "Index HTML Test", 
            False,
            f"Request failed: {str(e)}"
        )

def test_additional_pwa_icons(results: PWATestResults):
    """Test additional PWA icon sizes for completeness"""
    
    additional_icons = [
        "/icons/icon-72x72.png",
        "/icons/icon-96x96.png", 
        "/icons/icon-128x128.png",
        "/icons/icon-144x144.png",
        "/icons/icon-152x152.png",
        "/icons/icon-384x384.png"
    ]
    
    accessible_icons = 0
    
    for icon_path in additional_icons:
        try:
            url = BASE_URL + icon_path
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                accessible_icons += 1
            
        except requests.exceptions.RequestException:
            pass  # Ignore errors for additional icons
    
    if accessible_icons >= len(additional_icons) * 0.8:  # 80% success rate
        results.add_result(
            "Additional PWA Icons", 
            True,
            f"{accessible_icons}/{len(additional_icons)} additional icons accessible"
        )
    else:
        results.add_result(
            "Additional PWA Icons", 
            False,
            f"Only {accessible_icons}/{len(additional_icons)} additional icons accessible"
        )

def main():
    print("Starting PWA Configuration Tests...")
    print(f"Base URL: {BASE_URL}")
    print("="*60)
    
    results = PWATestResults()
    
    # Run all PWA tests
    print("Testing PWA file accessibility...")
    test_pwa_file_accessibility(results)
    
    print("Testing manifest.json content...")
    test_manifest_json_content(results)
    
    print("Testing index.html PWA meta tags...")
    test_index_html_pwa_meta_tags(results)
    
    print("Testing additional PWA icons...")
    test_additional_pwa_icons(results)
    
    # Print results
    results.print_summary()
    
    # Return appropriate exit code
    return 0 if results.failed == 0 else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)