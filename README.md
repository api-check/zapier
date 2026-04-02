# ApiCheck Zapier Integration

Validate addresses, verify emails and phone numbers, search addresses across 18 European countries.

## Getting Started

1. Search for "ApiCheck" in Zapier's app directory
2. Connect your account using your API key from [app.apicheck.nl](https://app.apicheck.nl)
3. Choose an operation and configure

## Actions

### Global Search (Recommended)

The **Global Search** action is the most powerful way to find addresses. It searches across streets, cities, and postal codes in one query with powerful filtering options.

**Use Global Search when you want to:**
- Find any type of address data (streets, cities, or postal codes)
- Filter results by city, street, or postal code area
- Search across Belgium with locality/municipality filters
- Get flexible, comprehensive results in one call

**Configuration:**
- **Country**: Select from 18 European countries
- **Search Query**: Enter a street name, city name, or postal code
- **Limit**: Maximum number of results (default: 10)

**Advanced Filtering** (combine with search query):
- **Filter by City ID** - only return results within a specific city
- **Filter by Street ID** - only return results on a specific street
- **Filter by Postal Code ID** - only return results in a postal code area
- **Filter by Locality ID (Belgium)** - only return results in a locality (deelgemeente)
- **Filter by Municipality ID (Belgium)** - only return results in a municipality (gemeente)

**Result Types:**
Each result includes a `type` field:
- `city` - City/municipality
- `street` - Street name
- `postalcode` - Postal code area

**Example Workflow:**
1. Use Global Search to find cities matching "Amsterdam"
2. Get the `city_id` from the result
3. Use Global Search again with `city_id` filter to find streets in that city

### Lookup Address

Look up an exact address by postal code and house number.

**Supported countries:** Netherlands, Luxembourg

**Fields:**
- **Country** - Select Netherlands or Luxembourg
- **Postal Code** - e.g., 1012LM
- **House Number** - e.g., 1
- **Number Addition** (optional) - e.g., A, B, 1-3

**Returns:**
- Street name
- City
- Postal code
- House number
- Country

### Get Number Additions

Get available number additions (apartment/suite letters) for a postal code and house number.

**Supported countries:** Netherlands, Luxembourg

**Use this when:**
- You need to show dropdown options for apartment units
- Validating that a number addition exists

**Returns:**
- House number
- Array of available additions (e.g., `["A", "B", "1-3"]`)

### Verify Email

Verify an email address for validity and check if it's from a disposable email provider.

**Fields:**
- **Email Address** - The email to verify

**Returns:**
- **Status** - `valid`, `invalid`, or `unknown`
- **Disposable Email** - `true` if from a disposable email provider
- **Greylisted** - `true` if the mail server is greylisting

### Verify Phone

Verify a phone number for validity.

**Fields:**
- **Phone Number** - Include country code, e.g., +31612345678

**Returns:**
- **Valid** - `true` if valid number
- **Country Code** - e.g., NL
- **Formatted Number** - Standardized format

### Search City

Search for cities by name across 18 European countries.

**Fields:**
- **Country** - Select from 18 countries
- **City Name** - Search query
- **Limit** - Maximum results

**Returns:** List of cities with `city_id`, `name`, and country info

### Search Street

Search for streets by name.

**Fields:**
- **Country** - Select from 18 countries
- **Street Name** - Search query
- **City ID** (optional) - Filter to a specific city
- **Limit** - Maximum results

**Returns:** List of streets with `street_id`, `name`, `city_id`

### Search Postal Code

Search for postal codes.

**Fields:**
- **Country** - Select from 18 countries
- **Postal Code** - Search query (partial or full)
- **City ID** (optional) - Filter to a specific city
- **Limit** - Maximum results

**Returns:** List of postal codes with `postalcode_id`, `name`, `city_id`

### Search Locality

Search for localities (deelgemeenten) by name. Primarily for Belgium.

**Fields:**
- **Country** - Belgium recommended
- **Locality Name** - Search query
- **Limit** - Maximum results

**Returns:** List of localities with `locality_id`, `name`

### Search Municipality

Search for municipalities (gemeenten) by name. Primarily for Belgium.

**Fields:**
- **Country** - Belgium recommended
- **Municipality Name** - Search query
- **Limit** - Maximum results

**Returns:** List of municipalities with `municipality_id`, `name`

### Search Address

Resolve a full address using IDs from other search actions.

**Fields:**
- **Country** - Select from 18 countries
- **Street ID** - From Search Street
- **City ID** - From Search City
- **Postal Code ID** - From Search Postal Code
- **Locality ID** - From Search Locality (Belgium)
- **Municipality ID** - From Search Municipality (Belgium)
- **House Number** - The house number
- **Number Addition** - Optional apartment/suite letter
- **Limit** - Maximum results

## Supported Countries

### All Search Actions (18 countries)
Netherlands (nl), Belgium (be), Luxembourg (lu), Germany (de), France (fr), Czech Republic (cz), Finland (fi), Italy (it), Norway (no), Poland (pl), Portugal (pt), Romania (ro), Spain (es), Switzerland (ch), Austria (at), Denmark (dk), United Kingdom (gb), Sweden (se)

### Address Lookup (Netherlands & Luxembourg only)
Netherlands (nl), Luxembourg (lu)

## Example Zaps

### Validate customer signup form
1. **Trigger** - New form submission
2. **Lookup Address** - Validate postal code + house number
3. **Verify Email** - Check email is valid and not disposable
4. **Verify Phone** - Validate phone number
5. **Action** - Create validated customer record

### Find addresses in a city
1. **Global Search** - Search for "Amsterdam", get `city_id`
2. **Global Search** - Search for "Dam" with `city_id` filter, get `street_id`
3. **Search Address** - Use `street_id` and house number to get full address

### Belgium address autocomplete
1. **Search Municipality** - User types gemeente name
2. **Search Locality** - User selects deelgemeente
3. **Global Search** - Use `municipality_id` or `locality_id` filter for street/city results

## Tips

1. **Use Global Search first** - It's the most flexible and covers all use cases
2. **Filter for precision** - Use city_id, street_id, etc. to narrow down results
3. **Chain actions** - Use IDs from one search as filters in another
4. **Belgium addresses** - Use locality and municipality filters for precise results

## API Key

Get your API key at [app.apicheck.nl](https://app.apicheck.nl)

## Support

- Documentation: [docs.apicheck.nl](https://docs.apicheck.nl)
- Support: support@apicheck.nl
