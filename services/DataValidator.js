class DataValidator {
  validateRepositoryData(repo) {
    return {
      hasName: !!(repo.name && repo.name !== 'N/A' && repo.name.length > 0),
      hasValidUrl: !!(repo.url && repo.url !== 'N/A' && repo.url.startsWith('/')),
      hasDescription: !!(repo.description && repo.description !== 'N/A'),
      isComplete: false
    };
  }
  
  validateAllRepositories(repositories) {
    const validations = repositories.map((repo, index) => {
      const validation = this.validateRepositoryData(repo);
      validation.index = index + 1;
      validation.name = repo.name;
      validation.isComplete = validation.hasName && validation.hasValidUrl;
      return validation;
    });
    
    const validCount = validations.filter(v => v.isComplete).length;
    
    return {
      total: repositories.length,
      valid: validCount,
      invalid: repositories.length - validCount,
      validations: validations
    };
  }
  
  validateAPIResponse(response) {
    return {
      url: response.url,
      status: response.status,
      isSuccess: response.status === 200,
      hasData: !!(response.body && Object.keys(response.body).length > 0),
      dataKeys: response.body ? Object.keys(response.body) : [],
      hasItems: !!(response.body && (response.body.items || response.body.results || response.body.data))
    };
  }
  
  validateAllAPIResponses(responses) {
    const validations = responses.map((response, index) => {
      const validation = this.validateAPIResponse(response);
      validation.index = index + 1;
      return validation;
    });
    
    const successCount = validations.filter(v => v.isSuccess).length;
    
    return {
      total: responses.length,
      successful: successCount,
      failed: responses.length - successCount,
      validations: validations
    };
  }
  
  compareBackendWithFrontend(frontendCount, apiResponses) {
    const comparison = {
      frontendCount: frontendCount,
      backendResponsesCount: apiResponses.length,
      backendItemCounts: [],
      hasMatch: false
    };
    
    apiResponses.forEach(response => {
      if (response.body) {
        const items = response.body.items || response.body.results || response.body.data;
        if (items && Array.isArray(items)) {
          comparison.backendItemCounts.push({
            url: response.url,
            count: items.length,
            matchesFrontend: items.length >= frontendCount
          });
        }
      }
    });
    
    comparison.hasMatch = comparison.backendItemCounts.some(b => b.matchesFrontend);
    
    return comparison;
  }
}

module.exports = DataValidator;