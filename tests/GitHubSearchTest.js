const { chromium } = require('playwright');
const GitHubSearchPage = require('../pages/GitHubSearchPage');
const APIMonitor = require('../services/APIMonitor');
const DataValidator = require('../services/DataValidator');
const TestReporter = require('../services/TestReporter');

class GitHubSearchTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.searchPage = null;
    this.resultsPage = null;
    this.apiMonitor = null;
    this.validator = null;
    this.reporter = null;
  }
  
  async setup() {
    this.reporter = new TestReporter('GitHub Search Test');
    this.reporter.log('Setting up test environment...');
    
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 300
    });
    
    const context = await this.browser.newContext();
    this.page = await context.newPage();
    
    // Initialize services
    this.apiMonitor = new APIMonitor(this.page);
    this.validator = new DataValidator();
    
    // Initialize page objects
    this.searchPage = new GitHubSearchPage(this.page);
    
    this.reporter.logSuccess('Setup complete');
  }
  
  async runTest(searchQuery) {
    try {
      // Step 1: Start API monitoring
      this.reporter.logStep(1, 'Start API monitoring');
      this.apiMonitor.startMonitoring();
      this.reporter.logSuccess('API monitoring started');
      
      // Step 2: Navigate to search page
      this.reporter.logStep(2, 'Navigate to GitHub Search');
      await this.searchPage.navigate();
      this.reporter.logSuccess('Navigation complete');
      
      // Step 3: Perform search
      this.reporter.logStep(3, 'Perform search');
      this.resultsPage = await this.searchPage.search(searchQuery);
      this.reporter.logSuccess('Search complete');
      
      // Step 4: Extract frontend results
      this.reporter.logStep(4, 'Extract frontend results');
      const results = await this.resultsPage.extractAllResults(5);
      this.reporter.logSuccess(`Extracted ${results.length} results`);
      
      results.forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.name}`);
      });
      
      // Step 5: Validate frontend data
      this.reporter.logStep(5, 'Validate frontend data');
      const frontendValidation = this.validator.validateAllRepositories(results);
      this.reporter.logSuccess(`${frontendValidation.valid}/${frontendValidation.total} results valid`);
      
      // Step 6: Validate backend responses
      this.reporter.logStep(6, 'Validate backend responses');
      const apiResponses = this.apiMonitor.getResponses();
      const backendValidation = this.validator.validateAllAPIResponses(apiResponses);
      this.reporter.logSuccess(`Captured ${apiResponses.length} API responses`);
      
      backendValidation.validations.forEach((v, i) => {
        const status = v.isSuccess ? '✓' : '✗';
        console.log(`  API ${i + 1}: ${v.status} ${status}`);
      });
      
      // Step 7: Compare backend with frontend
      this.reporter.logStep(7, 'Compare backend with frontend');
      const comparison = this.validator.compareBackendWithFrontend(
        results.length, 
        apiResponses
      );
      this.reporter.logSuccess('Comparison complete');
      
      // Step 8: Generate report
      this.reporter.logStep(8, 'Generate test report');
      const report = this.reporter.generateReport(
        { results: results },
        { 
          requestCount: this.apiMonitor.getRequestCount(),
          responseCount: this.apiMonitor.getResponseCount(),
          requests: this.apiMonitor.getRequests(),
          responses: apiResponses
        },
        {
          frontend: frontendValidation,
          backend: backendValidation,
          comparison: comparison
        }
      );
      
      this.reporter.saveReport(report);
      
      // Step 9: Take screenshot
      this.reporter.logStep(9, 'Take screenshot');
      await this.resultsPage.takeScreenshot('test-screenshot.png');
      this.reporter.logSuccess('Screenshot saved');
      
      // Print summary
      this.reporter.printSummary(report);
      
      return report;
      
    } catch (error) {
      this.reporter.logError(`Test failed: ${error.message}`);
      await this.page.screenshot({ path: 'error-screenshot.png' });
      throw error;
    }
  }
  
  async teardown() {
    this.reporter.log('Keeping browser open for 5 seconds...');
    await this.page.waitForTimeout(5000);
    
    this.reporter.log('Cleaning up...');
    if (this.apiMonitor) {
      this.apiMonitor.stopMonitoring();
    }
    if (this.browser) {
      await this.browser.close();
    }
    this.reporter.logSuccess('Teardown complete');
  }
}

// ============================================
// MAIN EXECUTION
// ============================================
async function main() {
  const test = new GitHubSearchTest();
  
  try {
    await test.setup();
    await test.runTest('playwright automation');
    await test.teardown();
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('TEST EXECUTION FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('='.repeat(60) + '\n');
    
    await test.teardown();
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

// Export for reuse in other test suites
module.exports = GitHubSearchTest;