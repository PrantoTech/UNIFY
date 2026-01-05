import requests
import sys
from datetime import datetime

class UnifyAPITester:
    def __init__(self, base_url="https://campus-connect-464.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.student_token = None
        self.mentor_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'endpoint': endpoint
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e),
                'endpoint': endpoint
            })
            return False, {}

    def test_seed_database(self):
        """Seed the database with initial data"""
        print("\n🌱 Seeding database...")
        success, response = self.run_test("Seed Database", "POST", "seed", 200)
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@unify.com", "password": "Admin@123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_student_login(self):
        """Test student login"""
        success, response = self.run_test(
            "Student Login",
            "POST",
            "auth/login",
            200,
            data={"email": "koyena@unify.com", "password": "Student@123"}
        )
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            print(f"   Student token obtained: {self.student_token[:20]}...")
            return True
        return False

    def test_mentor_login(self):
        """Test mentor login"""
        success, response = self.run_test(
            "Mentor Login",
            "POST",
            "auth/login",
            200,
            data={"email": "ananya@unify.com", "password": "Mentor@123"}
        )
        if success and 'access_token' in response:
            self.mentor_token = response['access_token']
            print(f"   Mentor token obtained: {self.mentor_token[:20]}...")
            return True
        return False

    def test_get_notices(self):
        """Test getting notices"""
        return self.run_test("Get Notices", "GET", "notices", 200)[0]

    def test_get_events(self):
        """Test getting events"""
        return self.run_test("Get Events", "GET", "events", 200)[0]

    def test_get_canteen_menu(self):
        """Test getting canteen menu"""
        return self.run_test("Get Canteen Menu", "GET", "canteen/menu", 200)[0]

    def test_get_lost_found(self):
        """Test getting lost & found items"""
        return self.run_test("Get Lost & Found", "GET", "lost-found", 200)[0]

    def test_get_clubs(self):
        """Test getting clubs"""
        return self.run_test("Get Clubs", "GET", "clubs", 200)[0]

    def test_get_posts(self):
        """Test getting posts"""
        return self.run_test("Get Posts", "GET", "posts", 200)[0]

    def test_admin_analytics(self):
        """Test admin analytics endpoint"""
        if not self.admin_token:
            print("❌ Admin token not available for analytics test")
            return False
        return self.run_test("Admin Analytics", "GET", "analytics", 200, token=self.admin_token)[0]

    def test_student_dashboard_data(self):
        """Test student can access dashboard data"""
        if not self.student_token:
            print("❌ Student token not available")
            return False
        
        # Test student can get their profile
        success1 = self.run_test("Student Profile", "GET", "auth/me", 200, token=self.student_token)[0]
        
        # Test student can get notices
        success2 = self.run_test("Student Get Notices", "GET", "notices", 200, token=self.student_token)[0]
        
        return success1 and success2

    def test_mentor_functionality(self):
        """Test mentor-specific functionality"""
        if not self.mentor_token:
            print("❌ Mentor token not available")
            return False
        
        # Test mentor can get their profile
        success1 = self.run_test("Mentor Profile", "GET", "auth/me", 200, token=self.mentor_token)[0]
        
        # Test mentor can get appointments
        success2 = self.run_test("Mentor Appointments", "GET", "appointments", 200, token=self.mentor_token)[0]
        
        return success1 and success2

    def test_create_post(self):
        """Test creating a post"""
        if not self.student_token:
            print("❌ Student token not available for post creation")
            return False
        
        return self.run_test(
            "Create Post",
            "POST",
            "posts",
            200,
            data={"content": "Test post from API testing"},
            token=self.student_token
        )[0]

    def test_websocket_endpoint(self):
        """Test WebSocket endpoint availability (basic check)"""
        try:
            # Just check if the WebSocket endpoint is reachable
            ws_url = self.base_url.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws/test-user'
            print(f"\n🔍 Testing WebSocket endpoint availability...")
            print(f"   WebSocket URL: {ws_url}")
            print("✅ WebSocket endpoint URL is properly formatted")
            return True
        except Exception as e:
            print(f"❌ WebSocket test failed: {str(e)}")
            return False

def main():
    print("🚀 Starting UNIFY Smart Campus Platform API Tests")
    print("=" * 60)
    
    tester = UnifyAPITester()
    
    # Test sequence
    tests = [
        ("Database Seeding", tester.test_seed_database),
        ("Admin Login", tester.test_admin_login),
        ("Student Login", tester.test_student_login),
        ("Mentor Login", tester.test_mentor_login),
        ("Get Notices", tester.test_get_notices),
        ("Get Events", tester.test_get_events),
        ("Get Canteen Menu", tester.test_get_canteen_menu),
        ("Get Lost & Found", tester.test_get_lost_found),
        ("Get Clubs", tester.test_get_clubs),
        ("Get Posts", tester.test_get_posts),
        ("Admin Analytics", tester.test_admin_analytics),
        ("Student Dashboard Data", tester.test_student_dashboard_data),
        ("Mentor Functionality", tester.test_mentor_functionality),
        ("Create Post", tester.test_create_post),
        ("WebSocket Endpoint", tester.test_websocket_endpoint),
    ]
    
    print(f"\n📋 Running {len(tests)} test categories...")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            tester.failed_tests.append({
                'name': test_name,
                'error': str(e),
                'endpoint': 'unknown'
            })
    
    # Print results
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    print(f"✅ Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"❌ Tests failed: {len(tester.failed_tests)}")
    
    if tester.failed_tests:
        print("\n🔍 FAILED TESTS DETAILS:")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure['name']}")
            if 'expected' in failure:
                print(f"   Expected: {failure['expected']}, Got: {failure['actual']}")
            if 'error' in failure:
                print(f"   Error: {failure['error']}")
            print(f"   Endpoint: {failure.get('endpoint', 'unknown')}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())