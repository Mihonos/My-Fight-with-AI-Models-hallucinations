const fs = require('fs');

class TestReporter {
  constructor(testName) {
    this.testName = testName;
    this.timestamp = new Date().toISOString();
    this.logs = [];
  }
  
  log(message, level = 'INFO') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message
    };
    this.logs.push(logEntry);
    
    const prefix = level === 'ERROR' ? '❌' : level === 'SUCCESS' ? '✓' : '→';
    console.log(`${prefix} ${message}`);
  }
  
  logStep(stepNumber, description) {
    console.log(`\n→ Step ${stepNumber}: ${description}`);
  }
  
  logSuccess(message) {
    this.log(message, 'SUCCESS');
  }
  
  logError(message) {
    this.log(message, 'ERROR');
  }
  
  generateReport(frontendData, apiData, validations) {
    return {
      test: {
        name: this.testName,
        timestamp: this.timestamp,
        duration: this.calculateDuration()
      },
      frontend: {
        resultsCount: frontendData.results.length,
        results: frontendData.results,
        validation: validations.frontend
      },
      backend: {
        requestsCount: apiData.requestCount,
        responsesCount: apiData.responseCount,
        requests: apiData.requests,
        responses: apiData.responses,
        validation: validations.backend
      },
      comparison: validations.comparison,
      summary: this.generateSummary(frontendData, apiData, validations),
      logs: this.logs
    };
  }
  
  generateSummary(frontendData, apiData, validations) {
    const frontendValid = validations.frontend.valid === validations.frontend.total;
    const backendValid = validations.backend.successful === validations.backend.total;
    
    let status = 'FAILED';
    if (frontendValid && backendValid && validations.comparison.hasMatch) {
      status = 'PASSED';
    } else if (frontendValid) {
      status = 'PARTIAL';
    }
    
    return {
      status: status,
      frontendValid: frontendValid,
      backendValid: backendValid,
      dataConsistent: validations.comparison.hasMatch
    };
  }
  
  calculateDuration() {
    const start = new Date(this.timestamp);
    const end = new Date();
    return `${((end - start) / 1000).toFixed(2)}s`;
  }
  
  saveReport(report, filename = 'test-report.json') {
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    this.logSuccess(`Report saved to ${filename}`);
  }
  
  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Test: ${report.test.name}`);
    console.log(`Status: ${report.summary.status}`);
    console.log(`Duration: ${report.test.duration}`);
    console.log(`\nFrontend:`);
    console.log(`  Results: ${report.frontend.resultsCount}`);
    console.log(`  Valid: ${report.frontend.validation.valid}/${report.frontend.validation.total}`);
    console.log(`\nBackend:`);
    console.log(`  API Requests: ${report.backend.requestsCount}`);
    console.log(`  API Responses: ${report.backend.responsesCount}`);
    console.log(`  Successful: ${report.backend.validation.successful}/${report.backend.validation.total}`);
    console.log(`\nData Consistency: ${report.summary.dataConsistent ? 'YES' : 'NO'}`);
    console.log('='.repeat(60) + '\n');
  }
}

module.exports = TestReporter;