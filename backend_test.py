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

class TestResults:
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
    
    def print_summary(self, test_type: str = "BACKEND API"):
        print(f"\n{'='*60}")
        print(f"{test_type} TEST SUMMARY")
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

class AdminAPITester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def login_admin(self, results: TestResults) -> bool:
        """Login as admin and get authentication token"""
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{API_BASE_URL}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.token = data["token"]
                    user = data["user"]
                    
                    # Verify admin role
                    if user.get("role") in ["admin", "super_admin"]:
                        self.session.headers.update({
                            'Authorization': f'Bearer {self.token}'
                        })
                        results.add_result(
                            "Admin Login",
                            True,
                            f"Successfully logged in as {user.get('role')} - {user.get('full_name', 'Admin')}"
                        )
                        return True
                    else:
                        results.add_result(
                            "Admin Login",
                            False,
                            f"User role is '{user.get('role')}', expected 'admin' or 'super_admin'"
                        )
                        return False
                else:
                    results.add_result(
                        "Admin Login",
                        False,
                        "Login response missing token or user data"
                    )
                    return False
            else:
                results.add_result(
                    "Admin Login",
                    False,
                    f"Login failed: HTTP {response.status_code} - {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Admin Login",
                False,
                f"Login request failed: {str(e)}"
            )
            return False
    
    def get_creator_id(self, results: TestResults) -> Optional[str]:
        """Get a creator ID for testing"""
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/creators", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data and len(data["data"]) > 0:
                    creator = data["data"][0]
                    creator_id = creator.get("id")
                    creator_name = creator.get("full_name", "Unknown")
                    
                    results.add_result(
                        "Get Creator ID",
                        True,
                        f"Found creator: {creator_name} (ID: {creator_id})"
                    )
                    return creator_id
                else:
                    results.add_result(
                        "Get Creator ID",
                        False,
                        "No creators found in response"
                    )
                    return None
            else:
                results.add_result(
                    "Get Creator ID",
                    False,
                    f"Failed to get creators: HTTP {response.status_code}"
                )
                return None
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Get Creator ID",
                False,
                f"Request failed: {str(e)}"
            )
            return None
    
    def test_admin_endpoints(self, results: TestResults, creator_id: str):
        """Test all admin dashboard enhancement endpoints"""
        
        # Test 1: GET /api/admin/user/{user_id}
        self.test_user_detail_endpoint(results, creator_id)
        
        # Test 2: GET /api/admin/user/{user_id}/messages
        self.test_user_messages_endpoint(results, creator_id)
        
        # Test 3: GET /api/admin/user/{user_id}/photos
        self.test_user_photos_endpoint(results, creator_id)
        
        # Test 4: GET /api/admin/user-history
        self.test_user_history_endpoint(results)
        
        # Test 5: GET /api/admin/users-by-reviews
        self.test_users_by_reviews_endpoint(results)
    
    def test_user_detail_endpoint(self, results: TestResults, user_id: str):
        """Test GET /api/admin/user/{user_id}"""
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/user/{user_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["full_name", "email", "role", "total_raffles", "tickets_purchased", "followers_count"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    results.add_result(
                        "Admin User Detail Endpoint",
                        True,
                        f"User detail retrieved successfully. User: {data.get('full_name')} ({data.get('email')}), Role: {data.get('role')}, Raffles: {data.get('total_raffles')}, Followers: {data.get('followers_count')}"
                    )
                else:
                    results.add_result(
                        "Admin User Detail Endpoint",
                        False,
                        f"Missing required fields: {missing_fields}",
                        data
                    )
            else:
                results.add_result(
                    "Admin User Detail Endpoint",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Admin User Detail Endpoint",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_user_messages_endpoint(self, results: TestResults, user_id: str):
        """Test GET /api/admin/user/{user_id}/messages"""
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/user/{user_id}/messages", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    results.add_result(
                        "Admin User Messages Endpoint",
                        True,
                        f"Messages retrieved successfully. Found {len(data)} messages for user"
                    )
                else:
                    results.add_result(
                        "Admin User Messages Endpoint",
                        False,
                        "Response is not an array of messages",
                        data
                    )
            else:
                results.add_result(
                    "Admin User Messages Endpoint",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Admin User Messages Endpoint",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_user_photos_endpoint(self, results: TestResults, user_id: str):
        """Test GET /api/admin/user/{user_id}/photos"""
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/user/{user_id}/photos", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    # Check if photos have required fields
                    valid_photos = True
                    for photo in data:
                        if not all(key in photo for key in ["url", "raffle_id", "raffle_title"]):
                            valid_photos = False
                            break
                    
                    if valid_photos:
                        results.add_result(
                            "Admin User Photos Endpoint",
                            True,
                            f"Photos retrieved successfully. Found {len(data)} photos for user"
                        )
                    else:
                        results.add_result(
                            "Admin User Photos Endpoint",
                            False,
                            "Photos missing required fields (url, raffle_id, raffle_title)",
                            data
                        )
                else:
                    results.add_result(
                        "Admin User Photos Endpoint",
                        False,
                        "Response is not an array of photos",
                        data
                    )
            else:
                results.add_result(
                    "Admin User Photos Endpoint",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Admin User Photos Endpoint",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_user_history_endpoint(self, results: TestResults):
        """Test GET /api/admin/user-history"""
        try:
            # Test with pagination parameters
            params = {
                "page": 1,
                "per_page": 10
            }
            response = self.session.get(f"{API_BASE_URL}/admin/user-history", params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check pagination structure
                required_fields = ["data", "total", "page", "per_page"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    results.add_result(
                        "Admin User History Endpoint",
                        True,
                        f"User history retrieved successfully. Total users: {data.get('total')}, Page: {data.get('page')}/{data.get('total_pages', 'N/A')}"
                    )
                else:
                    results.add_result(
                        "Admin User History Endpoint",
                        False,
                        f"Missing pagination fields: {missing_fields}",
                        data
                    )
            else:
                results.add_result(
                    "Admin User History Endpoint",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Admin User History Endpoint",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_users_by_reviews_endpoint(self, results: TestResults):
        """Test GET /api/admin/users-by-reviews with filters"""
        try:
            # Test with filter parameters
            params = {
                "filter": "all",
                "sort_by": "total",
                "page": 1,
                "per_page": 10
            }
            response = self.session.get(f"{API_BASE_URL}/admin/users-by-reviews", params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check pagination structure
                required_fields = ["data", "total", "page", "per_page"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Check if users have review fields
                    users = data.get("data", [])
                    if users:
                        user = users[0]
                        review_fields = ["positive_reviews", "negative_reviews_count", "total_reviews", "avg_review_score"]
                        missing_review_fields = [field for field in review_fields if field not in user]
                        
                        if not missing_review_fields:
                            results.add_result(
                                "Admin Users by Reviews Endpoint",
                                True,
                                f"Users by reviews retrieved successfully. Total: {data.get('total')}, Users with reviews: {len(users)}"
                            )
                        else:
                            results.add_result(
                                "Admin Users by Reviews Endpoint",
                                False,
                                f"Users missing review fields: {missing_review_fields}",
                                user
                            )
                    else:
                        results.add_result(
                            "Admin Users by Reviews Endpoint",
                            True,
                            "Users by reviews endpoint working (no users with reviews found)"
                        )
                else:
                    results.add_result(
                        "Admin Users by Reviews Endpoint",
                        False,
                        f"Missing pagination fields: {missing_fields}",
                        data
                    )
            else:
                results.add_result(
                    "Admin Users by Reviews Endpoint",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Admin Users by Reviews Endpoint",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_authorization(self, results: TestResults, creator_id: str):
        """Test that endpoints require admin authorization"""
        # Create a session without auth token
        unauth_session = requests.Session()
        unauth_session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        endpoints_to_test = [
            f"/admin/user/{creator_id}",
            f"/admin/user/{creator_id}/messages",
            f"/admin/user/{creator_id}/photos",
            "/admin/user-history",
            "/admin/users-by-reviews"
        ]
        
        unauthorized_count = 0
        for endpoint in endpoints_to_test:
            try:
                response = unauth_session.get(f"{API_BASE_URL}{endpoint}", timeout=10)
                if response.status_code == 401:
                    unauthorized_count += 1
            except:
                pass  # Ignore network errors for this test
        
        if unauthorized_count == len(endpoints_to_test):
            results.add_result(
                "Admin Authorization Check",
                True,
                f"All {len(endpoints_to_test)} admin endpoints properly require authentication"
            )
        else:
            results.add_result(
                "Admin Authorization Check",
                False,
                f"Only {unauthorized_count}/{len(endpoints_to_test)} endpoints require authentication"
            )

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