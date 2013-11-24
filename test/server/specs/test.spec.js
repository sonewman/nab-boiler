var path = require('path')
  , main = require(path.join(process.cwd(), './server/main'));

describe('Server Jasmine test example', function () {
  it('Should run server test', function () {
    expect(main()).toBe(true);
  });
});