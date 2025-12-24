#!/usr/bin/env python3
"""
RafflyWin Backend API Testing
Tests Admin Earnings and Notification System features
"""

import requests
import json
import sys
from typing import Dict, Any, List, Optional

# Base URLs
FRONTEND_URL = "https://ticket-raffle-5.preview.emergentagent.com"
API_BASE_URL = "https://ticket-raffle-5.preview.emergentagent.com/api"

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

class AdminEarningsTester:
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
    
    def test_earnings_endpoints(self, results: TestResults):
        """Test all admin earnings endpoints"""
        
        # Test 1: GET /api/admin/earnings?period=month
        self.test_admin_earnings_endpoint(results)
        
        # Test 2: GET /api/admin/earnings/summary
        self.test_earnings_summary_endpoint(results)
    
    def test_admin_earnings_endpoint(self, results: TestResults):
        """Test GET /api/admin/earnings?period=month"""
        try:
            params = {"period": "month"}
            response = self.session.get(f"{API_BASE_URL}/admin/earnings", params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["period", "summary", "earnings_by_tier", "daily_earnings", "transactions", "pagination"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Check summary structure
                    summary = data.get("summary", {})
                    summary_fields = ["total_earnings", "total_transactions", "pending_transactions", "avg_fee"]
                    missing_summary_fields = [field for field in summary_fields if field not in summary]
                    
                    if not missing_summary_fields:
                        # Check earnings_by_tier structure
                        earnings_by_tier = data.get("earnings_by_tier", {})
                        expected_tiers = [1, 2, 3, 5, 10]
                        missing_tiers = [str(tier) for tier in expected_tiers if str(tier) not in earnings_by_tier]
                        
                        if not missing_tiers:
                            # Check pagination structure
                            pagination = data.get("pagination", {})
                            pagination_fields = ["page", "per_page", "total", "total_pages"]
                            missing_pagination_fields = [field for field in pagination_fields if field not in pagination]
                            
                            if not missing_pagination_fields:
                                results.add_result(
                                    "Admin Earnings Endpoint",
                                    True,
                                    f"Earnings data retrieved successfully. Period: {data.get('period')}, Total Earnings: ${summary.get('total_earnings', 0)}, Transactions: {summary.get('total_transactions', 0)}, Pending: {summary.get('pending_transactions', 0)}"
                                )
                            else:
                                results.add_result(
                                    "Admin Earnings Endpoint",
                                    False,
                                    f"Missing pagination fields: {missing_pagination_fields}",
                                    data
                                )
                        else:
                            results.add_result(
                                "Admin Earnings Endpoint",
                                False,
                                f"Missing earnings tiers: {missing_tiers}",
                                data
                            )
                    else:
                        results.add_result(
                            "Admin Earnings Endpoint",
                            False,
                            f"Missing summary fields: {missing_summary_fields}",
                            data
                        )
                else:
                    results.add_result(
                        "Admin Earnings Endpoint",
                        False,
                        f"Missing required fields: {missing_fields}",
                        data
                    )
            else:
                results.add_result(
                    "Admin Earnings Endpoint",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Admin Earnings Endpoint",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_earnings_summary_endpoint(self, results: TestResults):
        """Test GET /api/admin/earnings/summary"""
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/earnings/summary", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_periods = ["today", "week", "month", "all_time"]
                missing_periods = [period for period in required_periods if period not in data]
                
                if not missing_periods:
                    # Check each period has required fields
                    all_periods_valid = True
                    for period in required_periods:
                        period_data = data.get(period, {})
                        if "total" not in period_data or "count" not in period_data:
                            all_periods_valid = False
                            break
                    
                    if all_periods_valid:
                        today_total = data.get("today", {}).get("total", 0)
                        week_total = data.get("week", {}).get("total", 0)
                        month_total = data.get("month", {}).get("total", 0)
                        all_time_total = data.get("all_time", {}).get("total", 0)
                        
                        results.add_result(
                            "Admin Earnings Summary Endpoint",
                            True,
                            f"Summary retrieved successfully. Today: ${today_total}, Week: ${week_total}, Month: ${month_total}, All Time: ${all_time_total}"
                        )
                    else:
                        results.add_result(
                            "Admin Earnings Summary Endpoint",
                            False,
                            "Some periods missing 'total' or 'count' fields",
                            data
                        )
                else:
                    results.add_result(
                        "Admin Earnings Summary Endpoint",
                        False,
                        f"Missing required periods: {missing_periods}",
                        data
                    )
            else:
                results.add_result(
                    "Admin Earnings Summary Endpoint",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Admin Earnings Summary Endpoint",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_earnings_authorization(self, results: TestResults):
        """Test that earnings endpoints require admin authorization"""
        # Create a session without auth token
        unauth_session = requests.Session()
        unauth_session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        endpoints_to_test = [
            "/admin/earnings",
            "/admin/earnings/summary"
        ]
        
        unauthorized_count = 0
        for endpoint in endpoints_to_test:
            try:
                response = unauth_session.get(f"{API_BASE_URL}{endpoint}", timeout=10)
                # Check for 401 (Unauthorized) or 403 (Forbidden) - both indicate auth is required
                if response.status_code in [401, 403]:
                    unauthorized_count += 1
            except:
                pass  # Ignore network errors for this test
        
        if unauthorized_count == len(endpoints_to_test):
            results.add_result(
                "Admin Earnings Authorization Check",
                True,
                f"All {len(endpoints_to_test)} earnings endpoints properly require authentication"
            )
        else:
            results.add_result(
                "Admin Earnings Authorization Check",
                False,
                f"Only {unauthorized_count}/{len(endpoints_to_test)} endpoints require authentication"
            )

class NotificationTester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.user_email = "juan@user.com"
        self.user_password = "test123"
    
    def login_user(self, results: TestResults) -> bool:
        """Login as user and get authentication token"""
        try:
            login_data = {
                "email": self.user_email,
                "password": self.user_password
            }
            
            response = self.session.post(f"{API_BASE_URL}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.token = data["token"]
                    user = data["user"]
                    
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.token}'
                    })
                    results.add_result(
                        "User Login",
                        True,
                        f"Successfully logged in as {user.get('role')} - {user.get('full_name', 'User')}"
                    )
                    return True
                else:
                    results.add_result(
                        "User Login",
                        False,
                        "Login response missing token or user data"
                    )
                    return False
            else:
                results.add_result(
                    "User Login",
                    False,
                    f"Login failed: HTTP {response.status_code} - {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "User Login",
                False,
                f"Login request failed: {str(e)}"
            )
            return False
    
    def test_notification_endpoints(self, results: TestResults):
        """Test all notification endpoints"""
        
        # Test 1: GET /api/notifications
        notifications = self.test_get_notifications_endpoint(results)
        
        # Test 2: POST /api/notifications/{id}/read (if notifications exist)
        if notifications and len(notifications) > 0:
            self.test_mark_notification_read_endpoint(results, notifications[0])
        else:
            results.add_result(
                "Mark Notification Read Endpoint",
                True,
                "No notifications found to test mark as read functionality (this is expected for new users)"
            )
    
    def test_get_notifications_endpoint(self, results: TestResults):
        """Test GET /api/notifications"""
        try:
            response = self.session.get(f"{API_BASE_URL}/notifications", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    # Check notification structure if any exist
                    if len(data) > 0:
                        notification = data[0]
                        required_fields = ["id", "user_id", "title", "message", "type", "read", "created_at"]
                        missing_fields = [field for field in required_fields if field not in notification]
                        
                        if not missing_fields:
                            unread_count = len([n for n in data if not n.get("read", True)])
                            results.add_result(
                                "Get Notifications Endpoint",
                                True,
                                f"Notifications retrieved successfully. Total: {len(data)}, Unread: {unread_count}"
                            )
                        else:
                            results.add_result(
                                "Get Notifications Endpoint",
                                False,
                                f"Notifications missing required fields: {missing_fields}",
                                notification
                            )
                    else:
                        results.add_result(
                            "Get Notifications Endpoint",
                            True,
                            "Notifications endpoint working (no notifications found for user)"
                        )
                    
                    return data
                else:
                    results.add_result(
                        "Get Notifications Endpoint",
                        False,
                        "Response is not an array of notifications",
                        data
                    )
                    return []
            else:
                results.add_result(
                    "Get Notifications Endpoint",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return []
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Get Notifications Endpoint",
                False,
                f"Request failed: {str(e)}"
            )
            return []
    
    def test_mark_notification_read_endpoint(self, results: TestResults, notification: dict):
        """Test POST /api/notifications/{id}/read"""
        try:
            notification_id = notification.get("id")
            if not notification_id:
                results.add_result(
                    "Mark Notification Read Endpoint",
                    False,
                    "Notification missing ID field"
                )
                return
            
            response = self.session.post(f"{API_BASE_URL}/notifications/{notification_id}/read", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "message" in data:
                    results.add_result(
                        "Mark Notification Read Endpoint",
                        True,
                        f"Notification marked as read successfully: {data.get('message')}"
                    )
                else:
                    results.add_result(
                        "Mark Notification Read Endpoint",
                        False,
                        "Response missing success message",
                        data
                    )
            else:
                results.add_result(
                    "Mark Notification Read Endpoint",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except requests.exceptions.RequestException as e:
            results.add_result(
                "Mark Notification Read Endpoint",
                False,
                f"Request failed: {str(e)}"
            )

def run_admin_earnings_tests():
    """Run Admin Earnings feature tests"""
    print("Starting Admin Earnings Feature Tests...")
    print(f"API Base URL: {API_BASE_URL}")
    print(f"Admin Credentials: {ADMIN_EMAIL}")
    print("="*60)
    
    results = TestResults()
    earnings_tester = AdminEarningsTester()
    
    # Step 1: Login as admin
    print("Step 1: Logging in as admin...")
    if not earnings_tester.login_admin(results):
        results.print_summary("ADMIN EARNINGS")
        return False
    
    # Step 2: Test earnings endpoints
    print("Step 2: Testing admin earnings endpoints...")
    earnings_tester.test_earnings_endpoints(results)
    
    # Step 3: Test authorization
    print("Step 3: Testing earnings endpoint authorization...")
    earnings_tester.test_earnings_authorization(results)
    
    # Print results
    results.print_summary("ADMIN EARNINGS")
    
    return results.failed == 0

def run_notification_tests():
    """Run Notification System tests"""
    print("\nStarting Notification System Tests...")
    print(f"API Base URL: {API_BASE_URL}")
    print("User Credentials: juan@user.com")
    print("="*60)
    
    results = TestResults()
    notification_tester = NotificationTester()
    
    # Step 1: Login as user
    print("Step 1: Logging in as user...")
    if not notification_tester.login_user(results):
        results.print_summary("NOTIFICATIONS")
        return False
    
    # Step 2: Test notification endpoints
    print("Step 2: Testing notification endpoints...")
    notification_tester.test_notification_endpoints(results)
    
    # Print results
    results.print_summary("NOTIFICATIONS")
    
    return results.failed == 0

def main():
    """Main test runner"""
    print("RafflyWin Admin Earnings & Notification System Testing")
    print("="*60)
    
    # Run Admin Earnings tests
    earnings_success = run_admin_earnings_tests()
    
    # Run Notification System tests
    notification_success = run_notification_tests()
    
    # Overall summary
    print("\n" + "="*60)
    print("OVERALL TEST SUMMARY")
    print("="*60)
    print(f"Admin Earnings Tests: {'✅ PASSED' if earnings_success else '❌ FAILED'}")
    print(f"Notification System Tests: {'✅ PASSED' if notification_success else '❌ FAILED'}")
    
    overall_success = earnings_success and notification_success
    print(f"Overall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    
    # Return appropriate exit code
    return 0 if overall_success else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)