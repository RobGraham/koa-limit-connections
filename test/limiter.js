const limiter = require("../lib/limiter");

describe("Limit Connections", () => {

	const contextStub = { status: 200, body: "Hello World" };
	let context;

    beforeEach( ()=> {
        context = contextStub;
    });

    it("should return a generator", () => {
		expect(limiter()).to.be.an.instanceof.GeneratorFunction;
	});

    describe("should throw", () => {

		it("when max is not a number", () => {
			expect(() => limiter({ max: "foobar" })).to.throw();
		});

		it("when options argument is not an object", () => {
			expect(() => limiter("")).to.throw();
		});
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
		const gen = limiter({
			max: 1,
			onConnection: function (current, max) {
				this.maxConnections = max;
			}
		}).call(context);

		gen.next();

		expect(context.maxConnections).to.equal(1);
	});

	/*it("Should trigger onMax callback when max connections reached", () => {
		const gen = limiter({
			max: 1,
			onMax: function (current, max) {
				this.maxReached = true;
			}
		}).call(context);

		gen.next();

		expect(context.maxReached).to.be.true;
	});*/

	/*it("Should return default status of 503 when max is reached", () => {
		const max = 1;
		const gen = limiter({ max: 1 }).call(context);

		gen.next();

		expect(context.status).to.equal(503);
	});*/

	it("Should increment connections", () => {
		const gen = limiter({
			onConnection: function (current, max) {
				this.connections = current;
			}
		}).call(context);

		gen.next();

		expect(context.connections).to.equal(1);
	});

	/*it("Should decrement connections", () => {

		const gen = limiter({
			max: 1,
			onConnection: function(current) {
				// increases by 1
				this.connections = current;
			},
			onMax: function(current) {
				// Has decreased by 1
				this.connections = current;
			}
		}).call(context);

		gen.next();

		expect(context.connections).to.equal(0);
	});*/

	describe("When using dynamicMax", () => {

		it("max should be set of returned value", () => {
			const gen = limiter({
				dynamicMax: function() {
					return 1;
				},
				onConnection: function (current, max) {
					this.maxConnections = max;
				}
			}).call(context);

			gen.next();

			expect(context.maxConnections).to.equal(1);
		});

		it("max should fallback when returned value can't be parsed", () => {
			const gen = limiter({
				max: 20,
				dynamicMax: function() {
					return "hey";
				},
				onConnection: function (current, max) {
					this.maxConnections = max;
				}
			}).call(context);

			gen.next();

			expect(context.maxConnections).to.equal(20);
		});

		it("max should fallback when returned value is < 1", () => {
			const gen = limiter({
				max: 20,
				dynamicMax: function() {
					return -1;
				},
				onConnection: function (current, max) {
					this.maxConnections = max;
				}
			}).call(context);

			gen.next();

			expect(context.maxConnections).to.equal(20);
		});

	});
})
