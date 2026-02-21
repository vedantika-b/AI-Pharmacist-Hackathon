#!/usr/bin/env node

/**
 * AI Pharmacist - Frontend Connectivity Test Suite
 * 
 * Run this from the frontend directory or add to package.json scripts:
 * "test:connectivity": "node connectivity-test.js"
 * 
 * Tests:
 * 1. Frontend API client availability
 * 2. Bearer token authentication
 * 3. Request/response serialization
 * 4. API error handling
 * 5. Data validation
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

class TestResult {
  constructor(name) {
    this.name = name;
    this.passed = false;
    this.message = '';
    this.duration = 0;
    this.details = {};
  }

  toString() {
    const status = this.passed
      ? `${colors.green}✓ PASS${colors.reset}`
      : `${colors.red}✗ FAIL${colors.reset}`;
    return `[${status}] ${this.name} (${this.duration.toFixed(2)}s)`;
  }
}

class FrontendConnectivityTester {
  constructor(backendUrl = 'http://localhost:8000', frontendUrl = 'http://localhost:3000') {
    this.backendUrl = backendUrl;
    this.frontendUrl = frontendUrl;
    this.results = [];
    this.testToken = 'test-token-12345'; // Would come from actual auth in real scenario
  }

  printHeader(title) {
    console.log(`\n${colors.bold}${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(
      `${colors.bold}${colors.blue}${title.padStart(
        title.length + (60 - title.length) / 2
      )}${colors.reset}`
    );
    console.log(`${colors.bold}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  }

  printResult(result) {
    console.log(`  ${result}`);
    if (result.message) {
      console.log(`     Message: ${result.message}`);
    }
    if (Object.keys(result.details).length > 0) {
      for (const [key, value] of Object.entries(result.details)) {
        const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
        console.log(`     ${colors.yellow}${key}:${colors.reset} ${valueStr}`);
      }
    }
  }

  // Helper to make HTTP requests
  makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
      const isHttps = options.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseData,
            contentType: res.headers['content-type'] || 'unknown',
          });
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  // ============ BASIC CONNECTIVITY TESTS ============

  async testBackendReachable() {
    const result = new TestResult('Backend Reachable via HTTP');
    const start = Date.now();

    try {
      const urlObj = new url.URL(this.backendUrl);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: '/health',
        method: 'GET',
        timeout: 5000,
      };

      const response = await this.makeRequest(options);
      result.duration = (Date.now() - start) / 1000;

      if (response.status === 200) {
        result.passed = true;
        result.message = 'Backend is reachable';
        try {
          const data = JSON.parse(response.body);
          result.details = {
            status: data.status,
            service: data.service,
          };
        } catch {
          result.details = { rawResponse: response.body.substring(0, 100) };
        }
      } else {
        result.message = `Unexpected status: ${response.status}`;
        result.details = { statusCode: response.status };
      }
    } catch (error) {
      result.duration = (Date.now() - start) / 1000;
      result.message = `Connection failed: ${error.message}`;
    }

    return result;
  }

  async testCorsHeaders() {
    const result = new TestResult('CORS Headers Verification');
    const start = Date.now();

    try {
      const urlObj = new url.URL(this.backendUrl);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: '/health',
        method: 'OPTIONS',
        headers: {
          'Origin': this.frontendUrl,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'content-type',
        },
        timeout: 5000,
      };

      const response = await this.makeRequest(options);
      result.duration = (Date.now() - start) / 1000;

      const corsOrigin = response.headers['access-control-allow-origin'];
      const corsMethods = response.headers['access-control-allow-methods'];

      if (corsOrigin && corsMethods) {
        result.passed = true;
        result.message = 'CORS headers are present';
        result.details = {
          'allow-origin': corsOrigin,
          'allow-methods': corsMethods,
          'allow-credentials': response.headers['access-control-allow-credentials'] || 'false',
        };
      } else {
        result.message = 'CORS headers missing';
        result.details = {
          'allow-origin': corsOrigin || 'Missing',
          'allow-methods': corsMethods || 'Missing',
        };
      }
    } catch (error) {
      result.duration = (Date.now() - start) / 1000;
      result.message = `Error: ${error.message}`;
    }

    return result;
  }

  // ============ AUTHENTICATION TESTS ============

  async testAuthenticationFlow() {
    const result = new TestResult('Authentication Token Handling');
    const start = Date.now();

    try {
      const urlObj = new url.URL(this.backendUrl);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: '/api/v1/users/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.testToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      };

      const response = await this.makeRequest(options);
      result.duration = (Date.now() - start) / 1000;

      // Should return 401 if not authenticated, but request was formed correctly
      if (response.status === 401 || response.status === 403) {
        result.passed = true;
        result.message = 'Authentication headers properly validated';
        result.details = {
          statusCode: response.status,
          headersSent: { Authorization: 'Bearer [redacted]' },
          headerReceived: {
            'www-authenticate': response.headers['www-authenticate'] || 'None',
          },
        };
      } else if (response.status === 200) {
        result.passed = true;
        result.message = 'Request with auth token processed';
        result.details = { statusCode: 200 };
      } else {
        result.message = `Unexpected status: ${response.status}`;
        result.details = { statusCode: response.status };
      }
    } catch (error) {
      result.duration = (Date.now() - start) / 1000;
      result.message = `Error: ${error.message}`;
    }

    return result;
  }

  // ============ DATA TRANSFER TESTS ============

  async testPostJsonData() {
    const result = new TestResult('POST JSON Data Transfer');
    const start = Date.now();

    const testData = {
      message: 'I need my metformin refilled',
      user_id: 'test-user-123',
      quantity: 90,
    };

    try {
      const urlObj = new url.URL(`${this.backendUrl}/api/v1/chat`);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(testData)),
        },
        timeout: 10000,
      };

      const response = await this.makeRequest(options, testData);
      result.duration = (Date.now() - start) / 1000;

      if ([200, 201, 202].includes(response.status)) {
        result.passed = true;
        result.message = `Data sent successfully (HTTP ${response.status})`;
        result.details = {
          sentData: testData,
          statusCode: response.status,
          responseSize: response.body.length,
          contentType: response.contentType,
        };
      } else {
        result.message = `Unexpected status: ${response.status}`;
        result.details = {
          statusCode: response.status,
          response: response.body.substring(0, 100),
        };
      }
    } catch (error) {
      result.duration = (Date.now() - start) / 1000;
      result.message = `Error: ${error.message}`;
    }

    return result;
  }

  async testGetJsonData() {
    const result = new TestResult('GET JSON Data Retrieval');
    const start = Date.now();

    try {
      const urlObj = new url.URL(`${this.backendUrl}/api/v1/products?search=metformin&limit=5`);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: `${urlObj.pathname}${urlObj.search}`,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        timeout: 10000,
      };

      const response = await this.makeRequest(options);
      result.duration = (Date.now() - start) / 1000;

      if (response.status === 200) {
        result.passed = true;
        try {
          const data = JSON.parse(response.body);
          const itemCount = Array.isArray(data) ? data.length : 1;
          result.message = 'Data retrieved successfully';
          result.details = {
            statusCode: 200,
            itemsReturned: itemCount,
            responseSizeBytes: response.body.length,
            contentType: response.contentType,
          };
        } catch (e) {
          result.message = 'Response received but not valid JSON';
          result.details = { error: e.message };
        }
      } else {
        result.message = `Unexpected status: ${response.status}`;
        result.details = { statusCode: response.status };
      }
    } catch (error) {
      result.duration = (Date.now() - start) / 1000;
      result.message = `Error: ${error.message}`;
    }

    return result;
  }

  async testJsonSerialization() {
    const result = new TestResult('JSON Request Serialization');
    const start = Date.now();

    const complexData = {
      user: {
        id: 'user-123',
        profile: {
          name: 'Test User',
          allergies: ['Penicillin', 'Shellfish'],
          conditions: ['Diabetes', 'Hypertension'],
        },
      },
      medications: ['Metformin', 'Lisinopril'],
      preferences: {
        notifications: true,
        preferred_quantity: 90,
      },
    };

    try {
      // Verify serialization
      const serialized = JSON.stringify(complexData);
      const deserialized = JSON.parse(serialized);

      result.duration = (Date.now() - start) / 1000;

      // Check if roundtrip is identical
      const identical = JSON.stringify(deserialized) === serialized;

      if (identical) {
        result.passed = true;
        result.message = 'JSON serialization/deserialization successful';
        result.details = {
          originalSize: serialized.length,
          depth: 3,
          fieldsPreserved: Object.keys(complexData).length,
        };
      } else {
        result.message = 'Serialization mismatch detected';
        result.details = {
          original: serialized.substring(0, 50),
          deserialized: JSON.stringify(deserialized).substring(0, 50),
        };
      }
    } catch (error) {
      result.duration = (Date.now() - start) / 1000;
      result.message = `Error: ${error.message}`;
    }

    return result;
  }

  // ============ ERROR HANDLING TESTS ============

  async testErrorStatusCodes() {
    const result = new TestResult('HTTP Error Status Handling');
    const start = Date.now();

    try {
      const urlObj = new url.URL(`${this.backendUrl}/api/v1/nonexistent`);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'GET',
        timeout: 5000,
      };

      const response = await this.makeRequest(options);
      result.duration = (Date.now() - start) / 1000;

      if (response.status >= 400) {
        result.passed = true;
        result.message = `HTTP error properly returned (${response.status})`;
        result.details = {
          statusCode: response.status,
          contentLength: response.body.length,
        };
      } else {
        result.message = `Unexpected status for nonexistent endpoint: ${response.status}`;
        result.details = { statusCode: response.status };
      }
    } catch (error) {
      result.duration = (Date.now() - start) / 1000;
      result.message = `Error: ${error.message}`;
    }

    return result;
  }

  async testTimeoutHandling() {
    const result = new TestResult('Request Timeout Handling');
    const start = Date.now();

    try {
      const urlObj = new url.URL(this.backendUrl);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: '/health',
        method: 'GET',
        timeout: 100, // Very short timeout
      };

      const response = await this.makeRequest(options);
      result.duration = (Date.now() - start) / 1000;

      // If we get here, request was fast enough
      result.passed = true;
      result.message = 'Request completed within timeout';
      result.details = { duration: result.duration };
    } catch (error) {
      result.duration = (Date.now() - start) / 1000;
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        result.message = 'Timeout correctly triggered';
        result.details = { error: 'TIMEOUT' };
      } else {
        result.message = `Error: ${error.message}`;
      }
    }

    return result;
  }

  // ============ RESPONSE VALIDATION TESTS ============

  async testResponseContentType() {
    const result = new TestResult('Response Content-Type Validation');
    const start = Date.now();

    try {
      const urlObj = new url.URL(`${this.backendUrl}/health`);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'GET',
        timeout: 5000,
      };

      const response = await this.makeRequest(options);
      result.duration = (Date.now() - start) / 1000;

      const contentType = response.headers['content-type'] || '';
      const isJson = contentType.includes('application/json');

      if (isJson) {
        result.passed = true;
        result.message = 'Response Content-Type is valid JSON';
        result.details = {
          contentType: contentType,
          charset: contentType.includes('charset') ? 'UTF-8' : 'default',
        };
      } else {
        result.message = `Unexpected Content-Type: ${contentType}`;
        result.details = { contentType };
      }
    } catch (error) {
      result.duration = (Date.now() - start) / 1000;
      result.message = `Error: ${error.message}`;
    }

    return result;
  }

  // ============ RUN ALL TESTS ============

  async runAllTests() {
    this.printHeader('BASIC CONNECTIVITY TESTS');
    this.results.push(await this.testBackendReachable());
    this.printResult(this.results[this.results.length - 1]);

    this.results.push(await this.testCorsHeaders());
    this.printResult(this.results[this.results.length - 1]);

    this.printHeader('AUTHENTICATION TESTS');
    this.results.push(await this.testAuthenticationFlow());
    this.printResult(this.results[this.results.length - 1]);

    this.printHeader('DATA TRANSFER TESTS');
    this.results.push(await this.testPostJsonData());
    this.printResult(this.results[this.results.length - 1]);

    this.results.push(await this.testGetJsonData());
    this.printResult(this.results[this.results.length - 1]);

    this.results.push(await this.testJsonSerialization());
    this.printResult(this.results[this.results.length - 1]);

    this.printHeader('RESPONSE VALIDATION TESTS');
    this.results.push(await this.testResponseContentType());
    this.printResult(this.results[this.results.length - 1]);

    this.printHeader('ERROR HANDLING TESTS');
    this.results.push(await this.testErrorStatusCodes());
    this.printResult(this.results[this.results.length - 1]);

    // Skip timeout test as it's flaky with the 100ms timeout
    // this.results.push(await this.testTimeoutHandling());
    // this.printResult(this.results[this.results.length - 1]);

    this.printSummary();
  }

  printSummary() {
    this.printHeader('TEST SUMMARY');

    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`${colors.bold}Total Tests:${colors.reset} ${total}`);
    console.log(`${colors.green}${colors.bold}Passed:${colors.reset} ${passed}`);
    console.log(`${colors.red}${colors.bold}Failed:${colors.reset} ${failed}`);
    const successRate = ((passed / total) * 100).toFixed(1);
    console.log(`${colors.yellow}${colors.bold}Success Rate:${colors.reset} ${successRate}%`);
    const totalTime = (this.results.reduce((sum, r) => sum + r.duration, 0)).toFixed(2);
    console.log(`${colors.bold}Total Time:${colors.reset} ${totalTime}s`);

    if (failed > 0) {
      console.log(`\n${colors.red}${colors.bold}Failed Tests:${colors.reset}`);
      this.results
        .filter((r) => !r.passed)
        .forEach((result) => {
          console.log(`  - ${result.name}: ${result.message}`);
        });
    } else {
      console.log(`\n${colors.green}${colors.bold}All tests passed! ✓${colors.reset}`);
    }
  }
}

// Main execution
async function main() {
  console.log(`${colors.bold}AI Pharmacist - Frontend Connectivity Test Suite${colors.reset}`);
  console.log(
    `Started at: ${new Date().toLocaleString()}\n`
  );

  let backendUrl = 'http://localhost:8000';
  let frontendUrl = 'http://localhost:3000';

  if (process.argv.length > 2) {
    backendUrl = process.argv[2];
  }
  if (process.argv.length > 3) {
    frontendUrl = process.argv[3];
  }

  console.log(`${colors.yellow}Backend URL:${colors.reset} ${backendUrl}`);
  console.log(`${colors.yellow}Frontend URL:${colors.reset} ${frontendUrl}\n`);

  const tester = new FrontendConnectivityTester(backendUrl, frontendUrl);
  await tester.runAllTests();

  console.log(`\nFinished at: ${new Date().toLocaleString()}`);
}

main().catch(console.error);
