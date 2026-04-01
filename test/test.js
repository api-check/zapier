const App = require('../index');

describe('ApiCheck Zapier App', () => {
  it('should export version', () => {
    expect(App.version).toBeDefined();
  });

  it('should export authentication', () => {
    expect(App.authentication).toBeDefined();
    expect(App.authentication.type).toBe('custom');
  });

  it('should have creates (actions)', () => {
    expect(App.creates).toBeDefined();
    expect(App.creates.lookup_address).toBeDefined();
    expect(App.creates.get_number_additions).toBeDefined();
    expect(App.creates.verify_email).toBeDefined();
    expect(App.creates.verify_phone).toBeDefined();
  });

  it('should have searches', () => {
    expect(App.searches).toBeDefined();
    expect(App.searches.global_search).toBeDefined();
    expect(App.searches.search_city).toBeDefined();
    expect(App.searches.search_street).toBeDefined();
    expect(App.searches.search_postalcode).toBeDefined();
    expect(App.searches.search_locality).toBeDefined();
    expect(App.searches.search_municipality).toBeDefined();
    expect(App.searches.search_address).toBeDefined();
  });

  it('should have numberAddition field in lookup_address', () => {
    const fields = App.creates.lookup_address.operation.inputFields;
    const numberAdditionField = fields.find(f => f.key === 'numberAddition');
    expect(numberAdditionField).toBeDefined();
    expect(numberAdditionField.required).toBe(false);
  });

  it('should have locality_id and municipality_id in global_search', () => {
    const fields = App.searches.global_search.operation.inputFields;
    expect(fields.find(f => f.key === 'locality_id')).toBeDefined();
    expect(fields.find(f => f.key === 'municipality_id')).toBeDefined();
  });

  it('should have locality_id and municipality_id in search_address', () => {
    const fields = App.searches.search_address.operation.inputFields;
    expect(fields.find(f => f.key === 'locality_id')).toBeDefined();
    expect(fields.find(f => f.key === 'municipality_id')).toBeDefined();
  });

  it('should have numberAddition in search_address', () => {
    const fields = App.searches.search_address.operation.inputFields;
    const numberAdditionField = fields.find(f => f.key === 'numberAddition');
    expect(numberAdditionField).toBeDefined();
    expect(numberAdditionField.required).toBe(false);
  });
});
