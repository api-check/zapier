const authentication = {
  type: 'custom',
  test: {
    url: 'https://api.apicheck.nl/lookup/v1/countries/',
    method: 'GET',
  },
  fields: [
    {
      key: 'api_key',
      label: 'API Key',
      type: 'password',
      required: true,
      helpText: 'Your ApiCheck API key from [app.apicheck.nl](https://app.apicheck.nl)'
    },
    {
      key: 'referer',
      label: 'Referer (optional)',
      type: 'string',
      required: false,
      helpText: 'Required if your API key has "Allowed Hosts" enabled'
    }
  ],
  connectionLabel: '{{bundle.authData.api_key}}'
};

const addAuthHeaders = (request, z, bundle) => {
  request.headers['X-API-KEY'] = bundle.authData.api_key;
  request.headers['Accept'] = 'application/json';
  if (bundle.authData.referer) {
    request.headers['Referer'] = bundle.authData.referer;
  }
  return request;
};

const version = '1.0.0';

module.exports = {
  version: version,
  platformVersion: '15.10.0',
  
  authentication,
  
  beforeRequest: [addAuthHeaders],
  
  afterResponse: [
    (response, z, bundle) => {
      if (response.status === 401) {
        throw new z.errors.Error('Invalid API key. Please check your credentials.', 'AuthenticationError', 401);
      }
      if (response.status === 429) {
        throw new z.errors.Error('Rate limit exceeded. Please try again later.', 'RateLimitError', 429);
      }
      return response;
    }
  ],
  
  triggers: {},
  
  creates: {
    lookup_address: {
      key: 'lookup_address',
      noun: 'Address',
      display: {
        label: 'Lookup Address',
        description: 'Look up an address by postal code and house number (NL, LU)'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: { 'NL': 'nl', 'LU': 'lu' }, default: 'nl' },
          { key: 'postalcode', label: 'Postal Code', type: 'string', required: true, helpText: 'e.g., 1012LM' },
          { key: 'number', label: 'House Number', type: 'string', required: true, helpText: 'e.g., 1' },
          { key: 'number_addition', label: 'Number Addition', type: 'string', required: false, helpText: 'e.g., A, 1-3' }
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams({
            country: bundle.inputData.country.toLowerCase(),
            postalcode: bundle.inputData.postalcode,
            number: bundle.inputData.number
          });
          if (bundle.inputData.number_addition) {
            params.append('numberAddition', bundle.inputData.number_addition);
          }
          const response = await z.request(`https://api.apicheck.nl/lookup/v1/address/?${params}`);
          return [response.json];
        },
        sample: {
          street: 'Damrak',
          number: '1',
          postalcode: '1012LM',
          city: 'Amsterdam',
          municipality: 'Amsterdam',
          country: { name: 'Nederland', code: 'nl' },
          coordinates: { latitude: 52.3731, longitude: 4.8922 }
        }
      }
    },
    
    verify_email: {
      key: 'verify_email',
      noun: 'Email',
      display: {
        label: 'Verify Email',
        description: 'Verify an email address for validity, disposable status, and greylisting'
      },
      operation: {
        inputFields: [
          { key: 'email', label: 'Email Address', type: 'string', required: true }
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams({ email: bundle.inputData.email });
          const response = await z.request(`https://api.apicheck.nl/verify/v1/email/?${params}`);
          return [response.json];
        },
        sample: {
          email: 'test@example.com',
          status: 'valid',
          disposable_email: false,
          greylisted: false
        }
      }
    },
    
    verify_phone: {
      key: 'verify_phone',
      noun: 'Phone',
      display: {
        label: 'Verify Phone',
        description: 'Verify a phone number for validity and formatting'
      },
      operation: {
        inputFields: [
          { key: 'number', label: 'Phone Number', type: 'string', required: true, helpText: 'Include country code, e.g., +31612345678' }
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams({ number: bundle.inputData.number });
          const response = await z.request(`https://api.apicheck.nl/verify/v1/phone/?${params}`);
          return [response.json];
        },
        sample: {
          number: '+31612345678',
          valid: true,
          country_code: 'NL',
          international_formatted: '+31 6 12345678'
        }
      }
    }
  },
  
  searches: {
    global_search: {
      key: 'global_search',
      noun: 'Address',
      display: {
        label: 'Global Search',
        description: 'Search for addresses, streets, cities, or postal codes'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: { 'NL': 'nl', 'BE': 'be', 'LU': 'lu', 'DE': 'de', 'FR': 'fr' }, default: 'nl' },
          { key: 'query', label: 'Search Query', type: 'string', required: true, helpText: 'Search term like city name, street, or postal code' },
          { key: 'limit', label: 'Limit', type: 'integer', required: false, default: 10 }
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams({
            country: bundle.inputData.country.toLowerCase(),
            query: bundle.inputData.query
          });
          if (bundle.inputData.limit) {
            params.append('limit', bundle.inputData.limit);
          }
          const response = await z.request(`https://api.apicheck.nl/search/v1/global/?${params}`);
          return response.json.results || [];
        },
        sample: {
          id: 12345,
          name: 'Amsterdam',
          type: 'city',
          latitude: 52.3676,
          longitude: 4.9041
        }
      }
    },
    
    search_address: {
      key: 'search_address',
      noun: 'Address',
      display: {
        label: 'Search Address',
        description: 'Search for addresses by IDs from other searches'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: { 'NL': 'nl', 'BE': 'be', 'LU': 'lu', 'DE': 'de', 'FR': 'fr' } },
          { key: 'street_id', label: 'Street ID', type: 'integer', required: false, helpText: 'From previous search results' },
          { key: 'city_id', label: 'City ID', type: 'integer', required: false },
          { key: 'postalcode_id', label: 'Postal Code ID', type: 'integer', required: false },
          { key: 'number', label: 'House Number', type: 'string', required: false }
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams({ country: bundle.inputData.country.toLowerCase() });
          ['street_id', 'city_id', 'postalcode_id', 'number'].forEach(field => {
            if (bundle.inputData[field]) {
              params.append(field, bundle.inputData[field]);
            }
          });
          const response = await z.request(`https://api.apicheck.nl/search/v1/address/?${params}`);
          return response.json.results || [];
        },
        sample: {
          street: 'Damrak',
          number: '1',
          postalcode: '1012LM',
          city: 'Amsterdam'
        }
      }
    }
  }
};
