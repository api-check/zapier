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
      helpText: 'Your ApiCheck API key from [app.apicheck.nl](https://app.apicheck.nl/authentication/register)'
    },
    {
      key: 'referer',
      label: 'Referer (optional)',
      type: 'string',
      required: false,
      helpText: 'Required if your API key has "Allowed Hosts" enabled. See [documentation](https://apicheck.nl/documentation#allowed-hosts)'
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

const version = '1.0.3';

const COUNTRIES_ALL = {
  'Netherlands': 'nl', 'Belgium': 'be', 'Luxembourg': 'lu', 'Germany': 'de', 'France': 'fr',
  'Czech Republic': 'cz', 'Finland': 'fi', 'Italy': 'it', 'Norway': 'no', 'Poland': 'pl',
  'Portugal': 'pt', 'Romania': 'ro', 'Spain': 'es', 'Switzerland': 'ch', 'Austria': 'at',
  'Denmark': 'dk', 'United Kingdom': 'gb', 'Sweden': 'se'
};

const COUNTRIES_LOOKUP = { 'Netherlands': 'nl', 'Luxembourg': 'lu' };

module.exports = {
  version: version,
  platformVersion: '18.3.0',
  
  authentication,
  
  beforeRequest: [addAuthHeaders],
  
  afterResponse: [
    (response, z, bundle) => {
      if (response.status === 401) {
        throw new z.errors.Error('Invalid API key. Get one at app.apicheck.nl', 'AuthenticationError', 401);
      }
      if (response.status === 429) {
        throw new z.errors.Error('Rate limit exceeded. Try again later.', 'RateLimitError', 429);
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
        description: 'Look up an address by postal code and house number (Netherlands, Luxembourg)'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_LOOKUP, default: 'nl' },
          { key: 'postalcode', label: 'Postal Code', type: 'string', required: true, helpText: 'e.g., 1012LM' },
          { key: 'number', label: 'House Number', type: 'string', required: true, helpText: 'e.g., 1' }
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams({
            country: bundle.inputData.country.toLowerCase(),
            postalcode: bundle.inputData.postalcode,
            number: bundle.inputData.number
          });
          const response = await z.request(`https://api.apicheck.nl/lookup/v1/address/?${params}`);
          return [response.json];
        },
        sample: { street: 'Damrak', number: '1', postalcode: '1012LM', city: 'Amsterdam', country: { name: 'Nederland', code: 'nl' } }
      }
    },
    
    get_number_additions: {
      key: 'get_number_additions',
      noun: 'Number Addition',
      display: {
        label: 'Get Number Additions',
        description: 'Get available number additions for a postal code and house number (e.g., A, B, 1-3)'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_LOOKUP, default: 'nl' },
          { key: 'postalcode', label: 'Postal Code', type: 'string', required: true, helpText: 'e.g., 1012LM' },
          { key: 'number', label: 'House Number', type: 'string', required: true, helpText: 'e.g., 1' }
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams({
            country: bundle.inputData.country.toLowerCase(),
            postalcode: bundle.inputData.postalcode,
            number: bundle.inputData.number
          });
          const response = await z.request(`https://api.apicheck.nl/lookup/v1/numberadditions/?${params}`);
          return [response.json];
        },
        sample: { number: '1', numberAdditions: ['A', 'B', '1-3'] }
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
          const response = await z.request(`https://api.apicheck.nl/verify/v1/email/?email=${encodeURIComponent(bundle.inputData.email)}`);
          return [response.json];
        },
        sample: { email: 'test@example.com', status: 'valid', disposable_email: false, greylisted: false }
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
          const response = await z.request(`https://api.apicheck.nl/verify/v1/phone/?number=${encodeURIComponent(bundle.inputData.number)}`);
          return [response.json];
        },
        sample: { number: '+31612345678', valid: true, country_code: 'NL' }
      }
    }
  },
  
  searches: {
    global_search: {
      key: 'global_search',
      noun: 'Address',
      display: {
        label: 'Global Search',
        description: 'Search for addresses, streets, cities, or postal codes across 18 European countries'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_ALL, default: 'nl' },
          { key: 'query', label: 'Search Query', type: 'string', required: true, helpText: 'Search term like city name, street, or postal code' },
          { key: 'limit', label: 'Limit', type: 'string', required: false, default: '10' }
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams({
            country: bundle.inputData.country.toLowerCase(),
            query: bundle.inputData.query
          });
          if (bundle.inputData.limit) params.append('limit', bundle.inputData.limit);
          const response = await z.request(`https://api.apicheck.nl/search/v1/global/?${params}`);
          return response.json.results || [];
        },
        sample: { id: 12345, name: 'Amsterdam', type: 'city' }
      }
    },
    
    search_locality: {
      key: 'search_locality',
      noun: 'Locality',
      display: {
        label: 'Search Locality',
        description: 'Search for localities (deelgemeenten), primarily in Belgium'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_ALL, default: 'be' },
          { key: 'name', label: 'Locality Name', type: 'string', required: true, helpText: 'Name of the locality to search for' },
          { key: 'limit', label: 'Limit', type: 'string', required: false, default: '10' }
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams({
            country: bundle.inputData.country.toLowerCase(),
            name: bundle.inputData.name
          });
          if (bundle.inputData.limit) params.append('limit', bundle.inputData.limit);
          const response = await z.request(`https://api.apicheck.nl/search/v1/locality/?${params}`);
          return response.json.results || [];
        },
        sample: { id: 12345, name: 'Schaerbeek' }
      }
    },
    
    search_municipality: {
      key: 'search_municipality',
      noun: 'Municipality',
      display: {
        label: 'Search Municipality',
        description: 'Search for municipalities (gemeenten), primarily in Belgium'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_ALL, default: 'be' },
          { key: 'name', label: 'Municipality Name', type: 'string', required: true, helpText: 'Name of the municipality to search for' },
          { key: 'limit', label: 'Limit', type: 'string', required: false, default: '10' }
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams({
            country: bundle.inputData.country.toLowerCase(),
            name: bundle.inputData.name
          });
          if (bundle.inputData.limit) params.append('limit', bundle.inputData.limit);
          const response = await z.request(`https://api.apicheck.nl/search/v1/municipality/?${params}`);
          return response.json.results || [];
        },
        sample: { id: 12345, name: 'Brussel' }
      }
    }
  }
};
