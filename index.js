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

const version = '1.0.7';

const COUNTRIES_ALL = {
  'Netherlands': 'nl', 'Belgium': 'be', 'Luxembourg': 'lu', 'Germany': 'de', 'France': 'fr',
  'Czech Republic': 'cz', 'Finland': 'fi', 'Italy': 'it', 'Norway': 'no', 'Poland': 'pl',
  'Portugal': 'pt', 'Romania': 'ro', 'Spain': 'es', 'Switzerland': 'ch', 'Austria': 'at',
  'Denmark': 'dk', 'United Kingdom': 'gb', 'Sweden': 'se'
};

const COUNTRIES_LOOKUP = { 'Netherlands': 'nl', 'Luxembourg': 'lu' };

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
          { key: 'number', label: 'House Number', type: 'string', required: true, helpText: 'e.g., 1' },
          { key: 'numberAddition', label: 'Number Addition', type: 'string', required: false, helpText: 'e.g., A, B, 1-3' }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const params = new URLSearchParams({
            postalcode: bundle.inputData.postalcode,
            number: bundle.inputData.number
          });
          if (bundle.inputData.numberAddition) {
            params.append('numberAddition', bundle.inputData.numberAddition);
          }
          const response = await z.request(`https://api.apicheck.nl/lookup/v1/postalcode/${country}?${params.toString()}`);
          return extractData(response);
        },
        sample: {
          street: 'Binnenhof',
          number: '1',
          postalcode: '2513AA',
          city: "'s-Gravenhage",
          country: { name: 'Nederland', code: 'NL' }
        }
      }
    },
    
    get_number_additions: {
      key: 'get_number_additions',
      noun: 'Number Addition',
      display: {
        label: 'Get Number Additions',
        description: 'Get available number additions for a postal code and house number'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_LOOKUP, default: 'nl' },
          { key: 'postalcode', label: 'Postal Code', type: 'string', required: true, helpText: 'e.g., 2513AA' },
          { key: 'number', label: 'House Number', type: 'string', required: true, helpText: 'e.g., 1' }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const params = new URLSearchParams({
            postalcode: bundle.inputData.postalcode,
            number: bundle.inputData.number,
            fields: '["numberAdditions"]'
          });
          const response = await z.request(`https://api.apicheck.nl/lookup/v1/address/${country}?${params.toString()}`);
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
          country_code: 'NL'
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
          { key: 'city_id', label: 'City ID', type: 'integer', required: false, helpText: 'Filter by city' },
          { key: 'street_id', label: 'Street ID', type: 'integer', required: false, helpText: 'Filter by street' },
          { key: 'postalcode_id', label: 'Postal Code ID', type: 'integer', required: false, helpText: 'Filter by postal code' },
          { key: 'locality_id', label: 'Locality ID', type: 'integer', required: false, helpText: 'Filter by locality (Belgium)' },
          { key: 'municipality_id', label: 'Municipality ID', type: 'integer', required: false, helpText: 'Filter by municipality (Belgium)' },
          { key: 'limit', label: 'Limit', type: 'integer', required: false, default: 10 }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const params = new URLSearchParams({ query: bundle.inputData.query });
          if (bundle.inputData.city_id) params.append('city_id', bundle.inputData.city_id);
          if (bundle.inputData.street_id) params.append('street_id', bundle.inputData.street_id);
          if (bundle.inputData.postalcode_id) params.append('postalcode_id', bundle.inputData.postalcode_id);
          if (bundle.inputData.locality_id) params.append('locality_id', bundle.inputData.locality_id);
          if (bundle.inputData.municipality_id) params.append('municipality_id', bundle.inputData.municipality_id);
          if (bundle.inputData.limit) params.append('limit', bundle.inputData.limit);
          
          const response = await z.request(`https://api.apicheck.nl/search/v1/global/${country}?${params.toString()}`);
          
          const data = extractData(response);
          const results = [];
          
          if (data && data.Results) {
            if (data.Results.Streets) results.push(...data.Results.Streets.map(s => ({...s, type: 'street'})));
            if (data.Results.Cities) results.push(...data.Results.Cities.map(c => ({...c, type: 'city'})));
            if (data.Results.Postalcodes) results.push(...data.Results.Postalcodes.map(p => ({...p, type: 'postalcode'})));
          }
          
          return results.slice(0, bundle.inputData.limit || 10);
        },
        sample: {
          name: 'Amsterdam',
          type: 'city',
          city_id: 2465
        }
      }
    },
    
    search_city: {
      key: 'search_city',
      noun: 'City',
      display: {
        label: 'Search City',
        description: 'Search for cities by name across 18 European countries'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_ALL, default: 'nl' },
          { key: 'name', label: 'City Name', type: 'string', required: true, helpText: 'e.g., Amsterdam' },
          { key: 'limit', label: 'Limit', type: 'integer', required: false, default: 10 }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const params = new URLSearchParams({ name: bundle.inputData.name });
          if (bundle.inputData.limit) params.append('limit', bundle.inputData.limit);
          const response = await z.request(`https://api.apicheck.nl/search/v1/city/${country}?${params.toString()}`);
          return extractData(response);
        },
        sample: { id: 2465, name: 'Amsterdam' }
      }
    },
    
    search_street: {
      key: 'search_street',
      noun: 'Street',
      display: {
        label: 'Search Street',
        description: 'Search for streets by name across 18 European countries'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_ALL, default: 'nl' },
          { key: 'name', label: 'Street Name', type: 'string', required: true, helpText: 'e.g., Damrak' },
          { key: 'city_id', label: 'City ID', type: 'integer', required: false, helpText: 'Filter by city' },
          { key: 'limit', label: 'Limit', type: 'integer', required: false, default: 10 }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const params = new URLSearchParams({ name: bundle.inputData.name });
          if (bundle.inputData.city_id) params.append('city_id', bundle.inputData.city_id);
          if (bundle.inputData.limit) params.append('limit', bundle.inputData.limit);
          const response = await z.request(`https://api.apicheck.nl/search/v1/street/${country}?${params.toString()}`);
          return extractData(response);
        },
        sample: { id: 12345, name: 'Damrak', city: 'Amsterdam' }
      }
    },
    
    search_postalcode: {
      key: 'search_postalcode',
      noun: 'Postal Code',
      display: {
        label: 'Search Postal Code',
        description: 'Search for postal codes across 18 European countries'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_ALL, default: 'nl' },
          { key: 'name', label: 'Postal Code', type: 'string', required: true, helpText: 'e.g., 1012' },
          { key: 'city_id', label: 'City ID', type: 'integer', required: false, helpText: 'Filter by city' },
          { key: 'limit', label: 'Limit', type: 'integer', required: false, default: 10 }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const params = new URLSearchParams({ name: bundle.inputData.name });
          if (bundle.inputData.city_id) params.append('city_id', bundle.inputData.city_id);
          if (bundle.inputData.limit) params.append('limit', bundle.inputData.limit);
          const response = await z.request(`https://api.apicheck.nl/search/v1/postalcode/${country}?${params.toString()}`);
          return extractData(response);
        },
        sample: { id: 54321, postalcode: '1012LM', city: 'Amsterdam' }
      }
    },
    
    search_locality: {
      key: 'search_locality',
      noun: 'Locality',
      display: {
        label: 'Search Locality',
        description: 'Search for localities (deelgemeenten) by name. Primarily relevant for Belgium.'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_ALL, default: 'be' },
          { key: 'name', label: 'Locality Name', type: 'string', required: true, helpText: 'e.g., Antwerpen' },
          { key: 'limit', label: 'Limit', type: 'integer', required: false, default: 10 }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const params = new URLSearchParams({ name: bundle.inputData.name });
          if (bundle.inputData.limit) params.append('limit', bundle.inputData.limit);
          const response = await z.request(`https://api.apicheck.nl/search/v1/locality/${country}?${params.toString()}`);
          return extractData(response);
        },
        sample: { id: 111, name: 'Antwerpen', municipality: 'Antwerpen' }
      }
    },
    
    search_municipality: {
      key: 'search_municipality',
      noun: 'Municipality',
      display: {
        label: 'Search Municipality',
        description: 'Search for municipalities (gemeenten) by name. Primarily relevant for Belgium.'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_ALL, default: 'be' },
          { key: 'name', label: 'Municipality Name', type: 'string', required: true, helpText: 'e.g., Antwerpen' },
          { key: 'limit', label: 'Limit', type: 'integer', required: false, default: 10 }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const params = new URLSearchParams({ name: bundle.inputData.name });
          if (bundle.inputData.limit) params.append('limit', bundle.inputData.limit);
          const response = await z.request(`https://api.apicheck.nl/search/v1/municipality/${country}?${params.toString()}`);
          return extractData(response);
        },
        sample: { id: 222, name: 'Antwerpen' }
      }
    },
    
    search_address: {
      key: 'search_address',
      noun: 'Address',
      display: {
        label: 'Search Address',
        description: 'Resolve a full address using IDs from other search results'
      },
      operation: {
        inputFields: [
          { key: 'country', label: 'Country', type: 'string', required: true, choices: COUNTRIES_ALL, default: 'nl' },
          { key: 'street_id', label: 'Street ID', type: 'integer', required: false, helpText: 'From Search Street' },
          { key: 'city_id', label: 'City ID', type: 'integer', required: false, helpText: 'From Search City' },
          { key: 'postalcode_id', label: 'Postal Code ID', type: 'integer', required: false, helpText: 'From Search Postal Code' },
          { key: 'locality_id', label: 'Locality ID', type: 'integer', required: false, helpText: 'From Search Locality (Belgium)' },
          { key: 'municipality_id', label: 'Municipality ID', type: 'integer', required: false, helpText: 'From Search Municipality (Belgium)' },
          { key: 'number', label: 'House Number', type: 'string', required: false, helpText: 'e.g., 1' },
          { key: 'numberAddition', label: 'Number Addition', type: 'string', required: false, helpText: 'e.g., A' },
          { key: 'limit', label: 'Limit', type: 'integer', required: false, default: 10 }
        ],
        perform: async (z, bundle) => {
          const country = bundle.inputData.country.toLowerCase();
          const params = new URLSearchParams();
          if (bundle.inputData.street_id) params.append('street_id', bundle.inputData.street_id);
          if (bundle.inputData.city_id) params.append('city_id', bundle.inputData.city_id);
          if (bundle.inputData.postalcode_id) params.append('postalcode_id', bundle.inputData.postalcode_id);
          if (bundle.inputData.locality_id) params.append('locality_id', bundle.inputData.locality_id);
          if (bundle.inputData.municipality_id) params.append('municipality_id', bundle.inputData.municipality_id);
          if (bundle.inputData.number) params.append('number', bundle.inputData.number);
          if (bundle.inputData.numberAddition) params.append('numberAddition', bundle.inputData.numberAddition);
          if (bundle.inputData.limit) params.append('limit', bundle.inputData.limit);
          const response = await z.request(`https://api.apicheck.nl/search/v1/address/${country}?${params.toString()}`);
          return extractData(response);
        },
        sample: {
          street: 'Damrak',
          number: '1',
          postalcode: '1012LM',
          city: 'Amsterdam',
          country: { name: 'Nederland', code: 'NL' }
        }
      }
    }
  }
};
