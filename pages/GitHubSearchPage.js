class GitHubSearchPage {
  constructor(page) {
    this.page = page;
  }
  
  get searchInput() {
    return this.page.locator('input[aria-label="Search GitHub"]');
  }
  
  async navigate() {
    await this.page.goto('https://github.com/search', { waitUntil: 'networkidle' });
  }
  
  async enterSearchQuery(query) {
    await this.searchInput.waitFor({ timeout: 10000 });
    await this.searchInput.fill(query);
  }
  
  async submitSearch() {
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
    
    const GitHubResultsPage = require('./GitHubResultsPage');
    return new GitHubResultsPage(this.page);
  }
  
  async search(query) {
    await this.enterSearchQuery(query);
    return await this.submitSearch();
  }
}

module.exports = GitHubSearchPage;
