const App = require('../index');

describe('ApiCheck Zapier App', () => {
  it('should export version', () => {
    expect(App.version).toBeDefined();
  });

  it('should export authentication', () => {
    expect(App.authentication).toBeDefined();
    expect(App.authentication.type).toBe('custom');
  });

  it('should have actions', () => {
    expect(App.creates).toBeDefined();
    expect(App.creates.lookup_address).toBeDefined();
    expect(App.creates.verify_email).toBeDefined();
    expect(App.creates.verify_phone).toBeDefined();
  });

  it('should have searches', () => {
    expect(App.searches).toBeDefined();
    expect(App.searches.global_search).toBeDefined();
    expect(App.searches.search_address).toBeDefined();
  });
});
