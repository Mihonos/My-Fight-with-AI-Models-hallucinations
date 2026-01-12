class GitHubResultsPage {
  constructor(page) {
    this.page = page;
  }
  
  get resultItems() {
    return this.page.locator('div[data-testid="results-list"] > div, .repo-list-item, article.Box-row');
  }
  
  async getResultsCount() {
    return await this.resultItems.count();
  }
  
  async getResultItem(index) {
    return this.resultItems.nth(index);
  }
  
  async extractRepositoryData(item) {
    try {
      const nameElement = item.locator('a[href*="/"]').first();
      const name = await nameElement.textContent();
      const url = await nameElement.getAttribute('href');
      
      let stars = 'N/A';
      try {
        const starElement = item.locator('[href*="stargazers"]');
        stars = await starElement.textContent();
      } catch (e) {}
      
      let description = 'N/A';
      try {
        const descElement = item.locator('p, div.mb-1').first();
        description = await descElement.textContent();
      } catch (e) {}
      
      return {
        name: name?.trim() || 'N/A',
        url: url || 'N/A',
        stars: stars.trim(),
        description: description.trim().substring(0, 100)
      };
    } catch (e) {
      return null;
    }
  }
  
  async extractAllResults(limit = 5) {
    console.log('  → Counting result items...');
    const count = await this.getResultsCount();
    console.log(`  → Found ${count} result items on page`);
    
    const maxItems = Math.min(count, limit);
    console.log(`  → Extracting data from ${maxItems} items...`);
    
    const results = [];
    for (let i = 0; i < maxItems; i++) {
      const item = await this.getResultItem(i);
      const data = await this.extractRepositoryData(item);
      if (data) {
        results.push(data);
        console.log(`    ${i + 1}. Extracted: ${data.name}`);
      }
    }
    
    console.log(`  → Total extracted: ${results.length} items`);
    return results;
  }
  
  async takeScreenshot(filename) {
    await this.page.screenshot({ path: filename, fullPage: true });
  }
}

module.exports = GitHubResultsPage;