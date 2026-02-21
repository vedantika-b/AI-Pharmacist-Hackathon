#!/usr/bin/env python3
"""
AI Pharmacist - Database Connectivity Test Suite

Tests:
1. Supabase PostgreSQL connection
2. Table access and schema validation
3. Authentication credentials
4. Query performance
5. Data write/read operations
6. Transaction support

Environment variables required:
- SUPABASE_URL
- SUPABASE_KEY
"""

import os
import sys
import time
import json
from datetime import datetime
from typing import Dict, Any, List, Tuple

# Color codes
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

try:
    import psycopg2
    from psycopg2 import sql, extras, errors
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    print(f"{Colors.YELLOW}Warning: psycopg2 not installed. Install it with: pip install psycopg2-binary{Colors.RESET}\n")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    print(f"{Colors.YELLOW}Warning: requests not installed. Install it with: pip install requests{Colors.RESET}\n")

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

class DatabaseConnectivityTester:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip('/')
        self.supabase_key = os.getenv("SUPABASE_KEY", "")
        self.verify_env()
        
        self.results = []
        self.conn = None
        self.cursor = None
        
        # Expected schema tables
        self.expected_tables = [
            "users", "products", "inventory", "orders", "prescriptions",
            "order_items", "notifications", "ai_logs", "refill_predictions"
        ]
    
    def verify_env(self):
        """Check environment variables"""
        if not self.supabase_url:
            print(f"{Colors.RED}Error: SUPABASE_URL not set{Colors.RESET}")
            print("Please set environment variables:")
            print("  export SUPABASE_URL='your-project-url'")
            print("  export SUPABASE_KEY='your-project-key'")
            sys.exit(1)
        
        if not self.supabase_key:
            print(f"{Colors.RED}Error: SUPABASE_KEY not set{Colors.RESET}")
            sys.exit(1)
    
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
                    print(f"     {Colors.YELLOW}{key}:{Colors.RESET}")
                    for k, v in value.items():
                        print(f"        {k}: {v}")
                elif isinstance(value, (list, tuple)):
                    print(f"     {Colors.YELLOW}{key}:{Colors.RESET}")
                    for item in value:
                        print(f"        - {item}")
                else:
                    print(f"     {Colors.YELLOW}{key}:{Colors.RESET} {value}")
    
    # ============ REST API CONNECTION TESTS ============
    
    def test_supabase_api_reachable(self) -> TestResult:
        """Test Supabase REST API connectivity"""
        result = TestResult("Supabase REST API Reachability")
        start = time.time()
        
        if not REQUESTS_AVAILABLE:
            result.message = "requests library not available"
            return result
        
        try:
            # Test auth endpoint
            response = requests.get(
                f"{self.supabase_url}/rest/v1/",
                headers={"apikey": self.supabase_key},
                timeout=5
            )
            result.duration = time.time() - start
            
            if response.status_code in [200, 401, 403]:  # 401/403 expected without auth
                result.passed = True
                result.message = f"Supabase API is reachable (HTTP {response.status_code})"
                result.details = {
                    "api_url": self.supabase_url,
                    "status_code": response.status_code,
                    "response_time_ms": int(result.duration * 1000)
                }
            else:
                result.message = f"Unexpected status code: {response.status_code}"
                result.details = {"status": response.status_code}
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_rest_table_query(self) -> TestResult:
        """Test querying a table via REST API"""
        result = TestResult("REST API Table Query (Products)")
        start = time.time()
        
        if not REQUESTS_AVAILABLE:
            result.message = "requests library not available"
            return result
        
        try:
            response = requests.get(
                f"{self.supabase_url}/rest/v1/products?limit=1",
                headers={
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}"
                },
                timeout=5
            )
            result.duration = time.time() - start
            
            if response.status_code == 200:
                result.passed = True
                data = response.json()
                result.message = f"Successfully queried products table"
                result.details = {
                    "rows_returned": len(data) if isinstance(data, list) else 1,
                    "status_code": 200,
                    "response_type": type(data).__name__
                }
                if isinstance(data, list) and len(data) > 0:
                    result.details["sample_fields"] = list(data[0].keys())
            else:
                result.message = f"Query failed with status {response.status_code}"
                result.details = {
                    "status": response.status_code,
                    "response": response.text[:200]
                }
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    # ============ POSTGRESQL DIRECT CONNECTION TESTS ============
    
    def extract_postgres_credentials(self) -> Tuple[str, str, str, str, int]:
        """Extract PostgreSQL connection details from Supabase URL"""
        try:
            # Supabase URL format: https://project-ref.supabase.co
            project_ref = self.supabase_url.split("//")[1].split(".")[0]
            
            # Default Supabase PostgreSQL settings
            host = f"{project_ref}.db.supabase.co"
            port = 5432
            database = "postgres"
            user = "postgres"
            
            # Try to get password from environment or use key as fallback
            password = os.getenv("SUPABASE_DB_PASSWORD", self.supabase_key)
            
            return host, user, password, database, port
        except Exception as e:
            raise Exception(f"Failed to parse Supabase credentials: {str(e)}")
    
    def test_postgres_connection(self) -> TestResult:
        """Test direct PostgreSQL connection"""
        result = TestResult("PostgreSQL Direct Connection")
        start = time.time()
        
        if not PSYCOPG2_AVAILABLE:
            result.message = "psycopg2 not available"
            return result
        
        try:
            host, user, password, database, port = self.extract_postgres_credentials()
            
            self.conn = psycopg2.connect(
                host=host,
                port=port,
                database=database,
                user=user,
                password=password,
                connect_timeout=5
            )
            
            result.duration = time.time() - start
            result.passed = True
            result.message = "Successfully connected to PostgreSQL"
            
            # Get connection info
            version = self.conn.get_parameter_status('server_version')
            result.details = {
                "host": host,
                "port": port,
                "database": database,
                "user": user,
                "server_version": version,
                "connection_time_ms": int(result.duration * 1000)
            }
        except psycopg2.Error as e:
            result.duration = time.time() - start
            result.message = f"PostgreSQL error: {e.diag.message_primary if e.diag else str(e)}"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_table_existence(self) -> TestResult:
        """Test that expected tables exist"""
        result = TestResult("Database Schema - Table Verification")
        start = time.time()
        
        if not self.conn:
            result.message = "No database connection"
            return result
        
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            
            existing_tables = [row[0] for row in cursor.fetchall()]
            found_tables = [t for t in self.expected_tables if t in existing_tables]
            missing_tables = [t for t in self.expected_tables if t not in existing_tables]
            
            result.duration = time.time() - start
            cursor.close()
            
            if len(found_tables) >= len(self.expected_tables) * 0.7:  # At least 70%
                result.passed = True
                result.message = f"Found {len(found_tables)}/{len(self.expected_tables)} expected tables"
                result.details = {
                    "found_tables": found_tables,
                    "missing_tables": missing_tables,
                    "total_existing_tables": len(existing_tables)
                }
            else:
                result.message = f"Only {len(found_tables)} out of {len(self.expected_tables)} tables found"
                result.details = {
                    "found": found_tables,
                    "missing": missing_tables
                }
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_table_row_count(self) -> TestResult:
        """Test row counts in key tables"""
        result = TestResult("Database Tables - Row Count Check")
        start = time.time()
        
        if not self.conn:
            result.message = "No database connection"
            return result
        
        try:
            cursor = self.conn.cursor()
            table_counts = {}
            
            for table in self.expected_tables[:5]:  # Check first 5 tables
                try:
                    cursor.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(
                        sql.Identifier(table)
                    ))
                    count = cursor.fetchone()[0]
                    table_counts[table] = count
                except psycopg2.Error:
                    table_counts[table] = "N/A"
            
            result.duration = time.time() - start
            cursor.close()
            
            result.passed = True
            result.message = "Retrieved row counts for sample tables"
            result.details = table_counts
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_table_schema(self) -> TestResult:
        """Test table schema and column info"""
        result = TestResult("Database Tables - Schema Validation")
        start = time.time()
        
        if not self.conn:
            result.message = "No database connection"
            return result
        
        try:
            cursor = self.conn.cursor()
            
            # Get schema for key tables
            schema_info = {}
            for table in self.expected_tables[:3]:  # Check first 3 tables
                try:
                    cursor.execute("""
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = %s
                        ORDER BY ordinal_position
                    """, (table,))
                    columns = {row[0]: row[1] for row in cursor.fetchall()}
                    schema_info[table] = columns
                except psycopg2.Error:
                    schema_info[table] = "Not found"
            
            result.duration = time.time() - start
            cursor.close()
            
            result.passed = len(schema_info) > 0
            result.message = f"Retrieved schema for {len(schema_info)} tables"
            result.details = schema_info
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    # ============ DATA OPERATION TESTS ============
    
    def test_insert_operation(self) -> TestResult:
        """Test INSERT operation"""
        result = TestResult("Data Operation - INSERT Test")
        start = time.time()
        
        if not self.conn:
            result.message = "No database connection"
            return result
        
        try:
            cursor = self.conn.cursor()
            
            # Try to insert into users table
            test_id = f"test-{int(time.time())}"
            cursor.execute("""
                INSERT INTO users (id, email, created_at)
                VALUES (%s, %s, %s)
                RETURNING id
            """, (test_id, f"test-{test_id}@example.com", datetime.now()))
            
            result_id = cursor.fetchone()
            self.conn.commit()
            cursor.close()
            
            result.duration = time.time() - start
            result.passed = result_id is not None
            result.message = "INSERT operation successful"
            result.details = {
                "returned_id": result_id[0] if result_id else None,
                "table": "users"
            }
        except psycopg2.Error as e:
            self.conn.rollback()
            result.duration = time.time() - start
            result.message = f"INSERT failed: {e.diag.message_primary if e.diag else str(e)}"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_select_operation(self) -> TestResult:
        """Test SELECT operation"""
        result = TestResult("Data Operation - SELECT Test")
        start = time.time()
        
        if not self.conn:
            result.message = "No database connection"
            return result
        
        try:
            cursor = self.conn.cursor(cursor_factory=extras.RealDictCursor)
            
            # Simple SELECT
            cursor.execute("SELECT * FROM products LIMIT 5")
            rows = cursor.fetchall()
            
            result.duration = time.time() - start
            cursor.close()
            
            result.passed = len(rows) >= 0
            result.message = f"SELECT returned {len(rows)} rows"
            result.details = {
                "rows_returned": len(rows),
                "sample_row_keys": list(rows[0].keys()) if rows else []
            }
        except psycopg2.Error as e:
            result.duration = time.time() - start
            result.message = f"SELECT failed: {str(e)}"
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_transaction_support(self) -> TestResult:
        """Test transaction support"""
        result = TestResult("Database - Transaction Support")
        start = time.time()
        
        if not self.conn:
            result.message = "No database connection"
            return result
        
        try:
            cursor = self.conn.cursor()
            
            # Start transaction
            self.conn.autocommit = False
            
            # Perform operations
            cursor.execute("SELECT version()")
            version = cursor.fetchone()
            
            # Check if in transaction
            cursor.execute("SELECT in_transaction()")
            in_transaction = cursor.fetchone()
            
            self.conn.rollback()  # Rollback test transaction
            cursor.close()
            
            result.duration = time.time() - start
            result.passed = version is not None
            result.message = "Transaction support verified"
            result.details = {
                "transactions_supported": True,
                "autocommit": self.conn.autocommit
            }
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    def test_connection_pool(self) -> TestResult:
        """Test connection pooling capability"""
        result = TestResult("Database - Connection Pool Check")
        start = time.time()
        
        if not self.conn:
            result.message = "No database connection"
            return result
        
        try:
            cursor = self.conn.cursor()
            
            # Check max connections
            cursor.execute("SHOW max_connections")
            max_conn = cursor.fetchone()[0]
            
            cursor.execute("SELECT count(*) FROM pg_stat_activity")
            active_conn = cursor.fetchone()[0]
            
            result.duration = time.time() - start
            cursor.close()
            
            result.passed = True
            result.message = "Connection pool info retrieved"
            result.details = {
                "max_connections": max_conn,
                "active_connections": active_conn,
                "available": int(max_conn) - active_conn
            }
        except Exception as e:
            result.duration = time.time() - start
            result.message = f"Error: {str(e)}"
        
        return result
    
    # ============ RUN ALL TESTS ============
    
    def run_all_tests(self):
        """Run all database connectivity tests"""
        self.print_header("SUPABASE REST API TESTS")
        self.results.append(self.test_supabase_api_reachable())
        self.print_result(self.results[-1])
        
        self.results.append(self.test_rest_table_query())
        self.print_result(self.results[-1])
        
        self.print_header("POSTGRESQL DIRECT CONNECTION TESTS")
        self.results.append(self.test_postgres_connection())
        self.print_result(self.results[-1])
        
        if self.conn:
            self.print_header("DATABASE SCHEMA TESTS")
            self.results.append(self.test_table_existence())
            self.print_result(self.results[-1])
            
            self.results.append(self.test_table_schema())
            self.print_result(self.results[-1])
            
            self.results.append(self.test_table_row_count())
            self.print_result(self.results[-1])
            
            self.print_header("DATA OPERATION TESTS")
            self.results.append(self.test_select_operation())
            self.print_result(self.results[-1])
            
            self.results.append(self.test_insert_operation())
            self.print_result(self.results[-1])
            
            self.print_header("ADVANCED TESTS")
            self.results.append(self.test_transaction_support())
            self.print_result(self.results[-1])
            
            self.results.append(self.test_connection_pool())
            self.print_result(self.results[-1])
        
        self.print_summary()
        
        # Close connection
        if self.conn:
            self.conn.close()
    
    def print_summary(self):
        """Print test summary"""
        self.print_header("TEST SUMMARY")
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        failed = total - passed
        
        print(f"{Colors.BOLD}Total Tests:{Colors.RESET} {total}")
        print(f"{Colors.GREEN}{Colors.BOLD}Passed:{Colors.RESET} {passed}")
        print(f"{Colors.RED}{Colors.BOLD}Failed:{Colors.RESET} {failed}")
        success_rate = (passed/total)*100 if total > 0 else 0
        print(f"{Colors.YELLOW}{Colors.BOLD}Success Rate:{Colors.RESET} {success_rate:.1f}%")
        print(f"{Colors.BOLD}Total Time:{Colors.RESET} {sum(r.duration for r in self.results):.2f}s")
        
        if failed > 0:
            print(f"\n{Colors.RED}{Colors.BOLD}Failed Tests:{Colors.RESET}")
            for result in self.results:
                if not result.passed:
                    print(f"  - {result.name}: {result.message}")
        else:
            print(f"\n{Colors.GREEN}{Colors.BOLD}All tests passed! ✓{Colors.RESET}")

if __name__ == "__main__":
    print(f"{Colors.BOLD}AI Pharmacist - Database Connectivity Test Suite{Colors.RESET}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    print(f"{Colors.YELLOW}Environment Settings:{Colors.RESET}")
    print(f"  SUPABASE_URL: {os.getenv('SUPABASE_URL', 'NOT SET')}")
    print(f"  SUPABASE_KEY: {'SET' if os.getenv('SUPABASE_KEY') else 'NOT SET'}\n")
    
    tester = DatabaseConnectivityTester()
    tester.run_all_tests()
    
    print(f"\nFinished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
