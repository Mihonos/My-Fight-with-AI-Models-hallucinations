class APIMonitor {
  constructor(page) {
    this.page = page;
    this.requests = [];
    this.responses = [];
    this.isMonitoring = false;
  }
  
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.page.on('request', request => this.captureRequest(request));
    this.page.on('response', response => this.captureResponse(response));
    this.isMonitoring = true;
  }
  
  stopMonitoring() {
    this.page.removeAllListeners('request');
    this.page.removeAllListeners('response');
    this.isMonitoring = false;
  }
  
  captureRequest(request) {
    if (this.isAPIRequest(request.url())) {
      this.requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: new Date().toISOString()
      });
    }
  }
  
  async captureResponse(response) {
    if (this.isAPIRequest(response.url())) {
      try {
        const body = await response.json();
        this.responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          body: body,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        // Not JSON or failed to parse
      }
    }
  }
  
  isAPIRequest(url) {
    return url.includes('/api/') || url.includes('search') || url.includes('graphql');
  }
  
  getRequests() {
    return this.requests;
  }
  
  getResponses() {
    return this.responses;
  }
  
  getRequestCount() {
    return this.requests.length;
  }
  
  getResponseCount() {
    return this.responses.length;
  }
}

module.exports = APIMonitor;