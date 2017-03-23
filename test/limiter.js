const limiter = require("../lib/limiter");

describe("Limit Connections", () => {

	const contextStub = { status: 200, body: "Hello World" };
	let context;

    beforeEach( ()=> {
        context = contextStub;
    });

	it("should throw exception when options argument is not an object", () => {
		expect(() => limiter("")).to.throw("Argument passed must be an object");
	});

	it("should return a generator", () => {
		expect(limiter()).to.be.an.instanceof.GeneratorFunction;
	});

	it("Should set max connections to default of 100", () => {
		const gen = limiter({
			onConnection: function (current, max) {
				this.maxConnections = max;
			}
		}).call(context);

		gen.next();
		expect(context.maxConnections).to.equal(100);
	});

	it("Should set max connections to 1", () => {
		const max = 1;
		const gen = limiter({
			max,
			onConnection: function (current, max) {
				this.maxConnections = max;
			}
		}).call(context);

		gen.next();

		expect(context.maxConnections).to.equal(max);
	});

	it("Should trigger onMax callback when max connections reached", () => {
		const max = 1;
		const gen = limiter({
			max,
			onMax: function (current, max) {
				this.maxReached = true;
			}
		}).call(context);

		gen.next();

		expect(context.maxReached).to.be.true;
	});

	it("Should return default status of 503 when max is reached", () => {
		const max = 1;
		const gen = limiter({ max: 1 }).call(context);

		gen.next();

		expect(context.status).to.equal(503);
	});

	it("Should increment connections", () => {
		context.connections = 0;

		const gen = limiter({
			onConnection: function (current, max) {
				this.connections = current;
			}
		}).call(context);

		gen.next();

		expect(context.connections).to.equal(1);

		gen.next();
	});

	it("Should decrement connections", () => {
		context.connections = 0;

		const gen = limiter({
			max: 1,
			onMax: function(current) {
				this.connections = current;
			}
		}).call(context);

		gen.next();

		expect(context.connections).to.equal(0);


	});
})
