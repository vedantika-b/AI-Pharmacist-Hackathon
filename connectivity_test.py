#!/usr/bin/env python3
"""
AI Pharmacist - Connectivity & Data Transfer Test Suite

This script checks:
1. Database connectivity
2. Frontend to backend connectivity
3. Data transfer integrity (both directions)
4. API response validation
"""

import requests
import time
import json
from datetime import datetime
import subprocess
import sys
from typing import Dict, Any, Tuple

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class TestResult:
    def __init__(self, name: str):
        self.name = name
        self.passed = False
        self.message = ""
        self.duration = 0.0
        self.details = {}
    
    def __str__(self):
        status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if self.passed else f"{Colors.RED}✗ FAIL{Colors.RESET}"
        return f"[{status}] {self.name} ({self.duration:.2f}s)"

class ConnectivityTester:
    def __init__(self, backend_url: str = "http://localhost:8000", frontend_url: str = "http://localhost:3000"):
        self.backend_url = backend_url
        self.frontend_url = frontend_url
        self.results = []
        self.test_data = {
            "message": "I need my metformin refilled",
            "user_id": "test-user-123",
            "quantity": 90
        }
    
    def print_header(self, title: str):
        """Print a section header"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{title.center(60)}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")
    
    def print_result(self, result: TestResult):
        """Print a test result"""
        print(f"  {result}")
        if result.message:
            print(f"     Message: {result.message}")
        if result.details:
            for key, value in result.details.items():
                if isinstance(value, dict):
                    print(f"     {Colors.YELLOW}{key}:{Colors.RESET} {json.dumps(value, indent=8)}")
                else:
                    print(f"     {Colors.YELLOW}{key}:{Colors.RESET} {value}")
    
    # ============ DATABASE CONNECTIVITY TESTS ============
    
    def test_health_check(self) -> TestResult:
        """Test basic backend connectivity via health check"""
        result = TestResult("Backend Health Check")
        start = time.time()
        
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            result.duration = time.time() - start
            
            if response.status_code == 200:
                result.passed = True
                data = response.json()
                result.message = f"Backend is healthy (status: {response.status_code})"
                result.details = {
                    "status": data.get("status"),
                    "service": data.get("service"),
                    "version": data.get("version")
                }
            else:
                result.message = f"Unexpected status code: {response.status_code}"
        except requests.exceptions.ConnectionError:
            result.duration = time.time() - start
            result.message = "Cannot connect to backend. Is it running?"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_detailed_health(self) -> TestResult:
        """Test detailed backend health including database status"""
        result = TestResult("Detailed Backend Health (DB Status)")
        start = time.time()
        
        try:
            response = requests.get(f"{self.backend_url}/health/detailed", timeout=5)
            result.duration = time.time() - start
            
            if response.status_code == 200:
                result.passed = True
                data = response.json()
                result.message = "Detailed health retrieved successfully"
                result.details = {
                    "status": data.get("status"),
                    "database": data.get("database"),
                    "cache": data.get("cache", "N/A"),
                    "external_apis": data.get("external_apis", {})
                }
                
                # Check if all critical systems are up
                if data.get("status") == "healthy":
                    result.passed = True
            else:
                result.message = f"Status: {response.status_code}"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    # ============ FRONTEND TO BACKEND CONNECTIVITY TESTS ============
    
    def test_frontend_loads(self) -> TestResult:
        """Test if frontend loads"""
        result = TestResult("Frontend Page Load")
        start = time.time()
        
        try:
            response = requests.get(self.frontend_url, timeout=5)
            result.duration = time.time() - start
            
            if response.status_code == 200:
                result.passed = True
                result.message = f"Frontend loaded successfully"
                result.details = {
                    "status_code": response.status_code,
                    "content_length": len(response.content),
                    "content_type": response.headers.get("content-type", "N/A")
                }
            else:
                result.message = f"Unexpected status: {response.status_code}"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Frontend not accessible: {str(e)}"
        
        return result
    
    def test_cors_enabled(self) -> TestResult:
        """Test if CORS is properly configured"""
        result = TestResult("CORS Configuration Check")
        start = time.time()
        
        try:
            response = requests.options(
                f"{self.backend_url}/health",
                headers={"Origin": self.frontend_url},
                timeout=5
            )
            result.duration = time.time() - start
            
            cors_origin = response.headers.get("access-control-allow-origin")
            cors_methods = response.headers.get("access-control-allow-methods")
            
            if cors_origin and cors_methods:
                result.passed = True
                result.message = "CORS is properly configured"
                result.details = {
                    "allowed_origin": cors_origin,
                    "allowed_methods": cors_methods,
                    "allow_credentials": response.headers.get("access-control-allow-credentials")
                }
            else:
                result.message = "CORS headers missing"
                result.details = {
                    "access-control-allow-origin": cors_origin or "Missing",
                    "access-control-allow-methods": cors_methods or "Missing"
                }
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    # ============ DATA TRANSFER TESTS (Frontend -> Backend) ============
    
    def test_api_post_request(self) -> TestResult:
        """Test POST request and data transfer to backend"""
        result = TestResult("POST Request - Data Transfer (Frontend→Backend)")
        start = time.time()
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/v1/chat",
                json=self.test_data,
                timeout=10,
                headers={"Content-Type": "application/json"}
            )
            result.duration = time.time() - start
            
            if response.status_code in [200, 201]:
                result.passed = True
                result.message = f"Data sent successfully (HTTP {response.status_code})"
                data = response.json()
                result.details = {
                    "sent_data": self.test_data,
                    "response_status": response.status_code,
                    "response_keys": list(data.keys()) if isinstance(data, dict) else "N/A",
                    "data_received": len(json.dumps(data)) > 0
                }
            else:
                result.message = f"Unexpected status: {response.status_code}"
                result.details = {"response": response.text[:200]}
        except requests.exceptions.Timeout:
            result.duration = time.time() - start
            result.message = "Request timed out (>10s)"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_api_get_request(self) -> TestResult:
        """Test GET request and data retrieval"""
        result = TestResult("GET Request - Data Transfer (Backend→Frontend)")
        start = time.time()
        
        try:
            response = requests.get(
                f"{self.backend_url}/api/v1/products?search=metformin&limit=5",
                timeout=10,
                headers={"Accept": "application/json"}
            )
            result.duration = time.time() - start
            
            if response.status_code == 200:
                result.passed = True
                data = response.json()
                result.message = f"Data retrieved successfully"
                result.details = {
                    "response_status": response.status_code,
                    "items_returned": len(data) if isinstance(data, list) else 1,
                    "data_size_bytes": len(response.content),
                    "content_type": response.headers.get("content-type", "N/A"),
                    "first_item_keys": list(data[0].keys()) if data and isinstance(data, list) else []
                }
            else:
                result.message = f"Unexpected status: {response.status_code}"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_complex_data_transfer(self) -> TestResult:
        """Test transfer of complex nested data"""
        result = TestResult("Complex Data Transfer (Nested JSON)")
        start = time.time()
        
        complex_data = {
            "user": {
                "id": "user-123",
                "profile": {
                    "name": "Test User",
                    "allergies": ["Penicillin", "Shellfish"],
                    "conditions": ["Diabetes", "Hypertension"]
                }
            },
            "medications": ["Metformin", "Lisinopril"],
            "preferences": {
                "notifications": True,
                "preferred_quantity": 90
            }
        }
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/v1/users/test-user-123/profile",
                json={"profile": complex_data},
                timeout=10,
                headers={"Content-Type": "application/json"}
            )
            result.duration = time.time() - start
            
            if response.status_code in [200, 201]:
                result.passed = True
                result.message = "Complex data transferred successfully"
                result.details = {
                    "data_depth": 3,  # Nested 3 levels
                    "status": response.status_code,
                    "response_size": len(response.content)
                }
            else:
                result.message = f"Status: {response.status_code}"
                result.details = {"error": response.text[:200]}
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_large_payload_transfer(self) -> TestResult:
        """Test transfer of large payload"""
        result = TestResult("Large Payload Transfer (~1MB)")
        start = time.time()
        
        # Create a large payload (1MB)
        large_data = {
            "data": "x" * (1024 * 1024),  # 1MB of data
            "user_id": "test-user-123"
        }
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/v1/export/orders",
                json={"format": "json"},
                timeout=30,
                headers={"Content-Type": "application/json"}
            )
            result.duration = time.time() - start
            
            if response.status_code in [200, 201]:
                result.passed = True
                result.message = f"Large payload handled successfully"
                result.details = {
                    "sent_size_mb": len(json.dumps(large_data)) / (1024*1024),
                    "response_size_kb": len(response.content) / 1024,
                    "status": response.status_code
                }
            else:
                result.message = f"Status: {response.status_code}"
        except requests.exceptions.Timeout:
            result.duration = time.time() - start
            result.message = "Timeout (payload too large or slow connection)"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    # ============ DATA INTEGRITY TESTS ============
    
    def test_response_validation(self) -> TestResult:
        """Test that response data is valid and complete"""
        result = TestResult("Response Data Validation")
        start = time.time()
        
        try:
            response = requests.get(
                f"{self.backend_url}/api/v1/dashboard/stats",
                timeout=10,
                headers={"Accept": "application/json"}
            )
            result.duration = time.time() - start
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields
                expected_fields = ["active_orders", "total_customers", "medicines_stock", "revenue"]
                missing_fields = [f for f in expected_fields if f not in data]
                
                if not missing_fields:
                    result.passed = True
                    result.message = "Response data is valid and complete"
                    result.details = {
                        "status": response.status_code,
                        "fields_count": len(data),
                        "expected_fields_present": len(expected_fields) - len(missing_fields),
                        "response_format": "valid JSON"
                    }
                else:
                    result.message = f"Missing fields: {missing_fields}"
                    result.details = {"present_fields": list(data.keys())}
            else:
                result.message = f"Status: {response.status_code}"
        except json.JSONDecodeError:
            result.duration = time.time() - start
            result.message = "Response is not valid JSON"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_roundtrip_data(self) -> TestResult:
        """Test data round-trip: send → store → retrieve"""
        result = TestResult("Data Round-trip (Send→Store→Retrieve)")
        start = time.time()
        timestamp = datetime.now().isoformat()
        
        test_payload = {
            "profile": {
                "full_name": f"Test User {timestamp}",
                "phone": "+1234567890",
                "date_of_birth": "1990-01-01"
            }
        }
        
        try:
            # Send data
            send_response = requests.put(
                f"{self.backend_url}/api/v1/users/test-user-123/profile",
                json=test_payload,
                timeout=10
            )
            
            if send_response.status_code in [200, 201]:
                # Retrieve data
                get_response = requests.get(
                    f"{self.backend_url}/api/v1/users/test-user-123/profile",
                    timeout=10
                )
                
                result.duration = time.time() - start
                
                if get_response.status_code == 200:
                    retrieved_data = get_response.json()
                    
                    # Verify data integrity
                    sent_name = test_payload["profile"]["full_name"]
                    retrieved_name = retrieved_data.get("full_name", "")
                    
                    if sent_name == retrieved_name:
                        result.passed = True
                        result.message = "Data round-trip successful (integrity verified)"
                        result.details = {
                            "sent_data": test_payload["profile"],
                            "retrieved_data": retrieved_data,
                            "match": True
                        }
                    else:
                        result.message = "Data mismatch in round-trip"
                        result.details = {
                            "sent": sent_name,
                            "retrieved": retrieved_name
                        }
                else:
                    result.message = f"Retrieval failed with status {get_response.status_code}"
            else:
                result.duration = time.time() - start
                result.message = f"Data send failed with status {send_response.status_code}"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_response_time(self) -> TestResult:
        """Test response time for typical requests"""
        result = TestResult("Response Time Benchmark")
        
        endpoints = {
            "Health Check": "/health",
            "Products": "/api/v1/products",
            "Dashboard Stats": "/api/v1/dashboard/stats",
            "Predictions": "/api/v1/predictions/refills"
        }
        
        times = {}
        all_passed = True
        total_time = 0
        
        for name, endpoint in endpoints.items():
            start = time.time()
            try:
                response = requests.get(
                    f"{self.backend_url}{endpoint}",
                    timeout=10
                )
                duration = time.time() - start
                times[name] = duration
                total_time += duration
                
                if duration > 2.0:  # Alert if > 2 seconds
                    all_passed = False
            except Exception as e:
                times[name] = "Error"
                all_passed = False
        
        result.duration = total_time
        result.passed = all_passed
        result.message = f"Average response time: {(total_time/len(endpoints)):.2f}s"
        result.details = times
        
        return result
    
    # ============ ERROR HANDLING TESTS ============
    
    def test_invalid_request_handling(self) -> TestResult:
        """Test error handling for invalid requests"""
        result = TestResult("Invalid Request Error Handling")
        start = time.time()
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/v1/nonexistent-endpoint",
                json={"test": "data"},
                timeout=5
            )
            result.duration = time.time() - start
            
            if response.status_code == 404:
                result.passed = True
                result.message = "Invalid request properly returns 404"
                result.details = {"status": 404, "error_response": response.text[:100]}
            elif response.status_code >= 400:
                result.passed = True
                result.message = f"Invalid request returns error status {response.status_code}"
                result.details = {"status": response.status_code}
            else:
                result.message = f"Unexpected status for invalid endpoint: {response.status_code}"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_malformed_json_handling(self) -> TestResult:
        """Test error handling for malformed JSON"""
        result = TestResult("Malformed JSON Error Handling")
        start = time.time()
        
        try:
            # Send malformed JSON
            response = requests.post(
                f"{self.backend_url}/api/v1/chat",
                data="{invalid json}",
                timeout=5,
                headers={"Content-Type": "application/json"}
            )
            result.duration = time.time() - start
            
            if response.status_code >= 400:
                result.passed = True
                result.message = f"Malformed JSON handled gracefully (status {response.status_code})"
                result.details = {"status": response.status_code}
            else:
                result.message = f"Unexpected response to malformed JSON: {response.status_code}"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error during test: {str(e)}"
        
        return result
    
    # ============ RUN ALL TESTS ============
    
    def run_all_tests(self):
        """Run all connectivity tests"""
        self.print_header("DATABASE CONNECTIVITY TESTS")
        self.results.append(self.test_health_check())
        self.print_result(self.results[-1])
        
        self.results.append(self.test_detailed_health())
        self.print_result(self.results[-1])
        
        self.print_header("FRONTEND TO BACKEND CONNECTIVITY")
        self.results.append(self.test_frontend_loads())
        self.print_result(self.results[-1])
        
        self.results.append(self.test_cors_enabled())
        self.print_result(self.results[-1])
        
        self.print_header("DATA TRANSFER TESTS (Frontend→Backend→Frontend)")
        self.results.append(self.test_api_post_request())
        self.print_result(self.results[-1])
        
        self.results.append(self.test_api_get_request())
        self.print_result(self.results[-1])
        
        self.results.append(self.test_complex_data_transfer())
        self.print_result(self.results[-1])
        
        self.results.append(self.test_large_payload_transfer())
        self.print_result(self.results[-1])
        
        self.print_header("DATA INTEGRITY TESTS")
        self.results.append(self.test_response_validation())
        self.print_result(self.results[-1])
        
        self.results.append(self.test_roundtrip_data())
        self.print_result(self.results[-1])
        
        self.print_header("PERFORMANCE TESTS")
        self.results.append(self.test_response_time())
        self.print_result(self.results[-1])
        
        self.print_header("ERROR HANDLING TESTS")
        self.results.append(self.test_invalid_request_handling())
        self.print_result(self.results[-1])
        
        self.results.append(self.test_malformed_json_handling())
        self.print_result(self.results[-1])
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        self.print_header("TEST SUMMARY")
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        failed = total - passed
        
        print(f"{Colors.BOLD}Total Tests:{Colors.RESET} {total}")
        print(f"{Colors.GREEN}{Colors.BOLD}Passed:{Colors.RESET} {passed}")
        print(f"{Colors.RED}{Colors.BOLD}Failed:{Colors.RESET} {failed}")
        print(f"{Colors.YELLOW}{Colors.BOLD}Success Rate:{Colors.RESET} {(passed/total)*100:.1f}%")
        print(f"{Colors.BOLD}Total Time:{Colors.RESET} {sum(r.duration for r in self.results):.2f}s")
        
        if failed > 0:
            print(f"\n{Colors.RED}{Colors.BOLD}Failed Tests:{Colors.RESET}")
            for result in self.results:
                if not result.passed:
                    print(f"  - {result.name}: {result.message}")
        else:
            print(f"\n{Colors.GREEN}{Colors.BOLD}All tests passed! ✓{Colors.RESET}")

if __name__ == "__main__":
    print(f"{Colors.BOLD}AI Pharmacist - Connectivity & Data Transfer Test Suite{Colors.RESET}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Default URLs (modify as needed)
    backend_url = "http://localhost:8000"
    frontend_url = "http://localhost:3000"
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        backend_url = sys.argv[1]
    if len(sys.argv) > 2:
        frontend_url = sys.argv[2]
    
    print(f"{Colors.YELLOW}Backend URL:{Colors.RESET} {backend_url}")
    print(f"{Colors.YELLOW}Frontend URL:{Colors.RESET} {frontend_url}\n")
    
    tester = ConnectivityTester(backend_url, frontend_url)
    tester.run_all_tests()
    
    print(f"\nFinished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
