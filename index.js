const authentication = {
  type: 'custom',
  test: {
    url: 'https://api.apicheck.nl/verify/v1/email/?email=test@example.com',
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
      helpText: 'Required if your API key has "Allowed Hosts" enabled'
    }
  ],
  connectionLabel: 'ApiCheck'
};

const addAuthHeaders = (request, z, bundle) => {
  request.headers['X-API-KEY'] = bundle.authData.api_key;
  request.headers['Accept'] = 'application/json';
  if (bundle.authData.referer) {
    request.headers['Referer'] = bundle.authData.referer;
  }
  return request;
};

const version = '1.0.6';

const COUNTRIES_ALL = {
  'Netherlands': 'nl', 'Belgium': 'be', 'Luxembourg': 'lu', 'Germany': 'de', 'France': 'fr',
  'Czech Republic': 'cz', 'Finland': 'fi', 'Italy': 'it', 'Norway': 'no', 'Poland': 'pl',
  'Portugal': 'pt', 'Romania': 'ro', 'Spain': 'es', 'Switzerland': 'ch', 'Austria': 'at',
  'Denmark': 'dk', 'United Kingdom': 'gb', 'Sweden': 'se'
};

const COUNTRIES_LOOKUP = { 'Netherlands': 'nl', 'Luxembourg': 'lu' };

// Helper to extract data from API response
const extractData = (response) => {
  if (response.json && response.json.data) {
    return response.json.data;
  }
  return response.json;
};

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
      if (response.json && response.json.error === true) {
        throw new z.errors.Error(response.json.description || 'API Error', 'ApiError', response.status);
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
          { key: 'postalcode', label: 'Postal Code', type: 'string', required: true, helpText: 'e.g., 2513AA' },
          { key: 'number', label: 'House Number', type: 'string', required: true, helpText: 'e.g., 1' }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const response = await z.request(`https://api.apicheck.nl/lookup/v1/postalcode/${country}?postalcode=${bundle.inputData.postalcode}&number=${bundle.inputData.number}`);
          return extractData(response);
        },
        sample: {
          street: 'Binnenhof',
          number: '1',
          postalcode: '2513AA',
          city: "'s-Gravenhage",
          municipality: "'s-Gravenhage",
          province: 'Zuid-Holland',
          country: { name: 'Nederland', code: 'NL' },
          coordinates: { latitude: 52.0791379, longitude: 4.3121533 }
        }
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
          { key: 'postalcode', label: 'Postal Code', type: 'string', required: true, helpText: 'e.g., 2513AA' },
          { key: 'number', label: 'House Number', type: 'string', required: true, helpText: 'e.g., 1' }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const response = await z.request(`https://api.apicheck.nl/lookup/v1/address/${country}?postalcode=${bundle.inputData.postalcode}&number=${bundle.inputData.number}`);
          return extractData(response);
        },
        sample: {
          number: '1',
          numberAdditions: ['A', 'B', '1-3']
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
          const response = await z.request(`https://api.apicheck.nl/verify/v1/email/?email=${encodeURIComponent(bundle.inputData.email)}`);
          return extractData(response);
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
          const response = await z.request(`https://api.apicheck.nl/verify/v1/phone/?number=${encodeURIComponent(bundle.inputData.number)}`);
          return extractData(response);
        },
        sample: {
          number: '+31612345678',
          valid: true,
          country_code: 'NL',
          details: { number_type: 'Mobile' }
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
        description: 'Search for addresses, streets, cities, or postal codes across 18 European countries'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_ALL, default: 'nl' },
          { key: 'query', label: 'Search Query', type: 'string', required: true, helpText: 'Search term like city name, street, or postal code' },
          { key: 'limit', label: 'Limit', type: 'string', required: false, default: '10' }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const params = `query=${encodeURIComponent(bundle.inputData.query)}${bundle.inputData.limit ? '&limit=' + bundle.inputData.limit : ''}`;
          const response = await z.request(`https://api.apicheck.nl/search/v1/global/${country}?${params}`);
          
          const data = extractData(response);
          const results = [];
          
          if (data && data.Results) {
            if (data.Streets) results.push(...data.Streets.map(s => ({...s, type: 'street'})));
            if (data.Cities) results.push(...data.Cities.map(c => ({...c, type: 'city'})));
            if (data.Postalcodes) results.push(...data.Postalcodes.map(p => ({...p, type: 'postalcode'})));
          }
          
          return results.slice(0, parseInt(bundle.inputData.limit || '10'));
        },
        sample: {
          name: 'Amsterdam',
          type: 'city',
          city_id: 2465
        }
      }
    }
  }
};
