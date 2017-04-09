const limiter = require("../lib/limiter");
const cloneDeep = require('lodash.clonedeep');

describe("Limit Connections", () => {

	const contextStub = { status: 200, body: "Hello World" };
    let reqContext;
	let secondReqContext;

    beforeEach( ()=> {
        reqContext = cloneDeep(contextStub);
        secondReqContext = cloneDeep(contextStub);
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
		const middleware = limiter({
			onConnection: function (current, max) {
				this.maxConnections = max;
			}
		});

		middleware.call(reqContext).next();

		expect(reqContext.maxConnections).to.equal(100);
	});

	it("Should set max connections to 1", () => {
		const middleware = limiter({
			max: 1,
			onConnection: function (current, max) {
				this.maxConnections = max;
			}
		});

		middleware.call(reqContext).next();

		expect(reqContext.maxConnections).to.equal(1);
	});

	it("Should trigger onMax callback when max connections reached", () => {
        const secondReqContext = cloneDeep(reqContext);
        const middleware = limiter({
			max: 1,
			onMax: function (current, max) {
				this.maxReached = true;
			}
		});

        middleware.call(reqContext).next();
        middleware.call(secondReqContext).next();

		expect(secondReqContext.maxReached).to.be.true;
	});

	it("Should return default status of 503 when max is reached", () => {
        const middleware = limiter({ max: 1 });

        middleware.call(reqContext).next();
        middleware.call(secondReqContext).next();

		expect(secondReqContext.status).to.equal(503);
	});

	it("Should increment connections", () => {
		const middleware = limiter({
			onConnection: function (current, max) {
				this.connections = current;
			}
		});

		middleware.call(reqContext).next();

		expect(reqContext.connections).to.equal(1);
	});

	it("Should decrement connections", () => {
        const secondReqContext = cloneDeep(reqContext);
		const middleware = limiter({
			max: 1,
			onConnection: function(current) {
				// increases by 1
				this.connections = current;
			},
			onMax: function(current) {
				// Has decreased by 1
				this.connections = current;
			}
		});

        middleware.call(reqContext).next();
        middleware.call(secondReqContext).next();

		expect(secondReqContext.connections).to.equal(1);
	});

	describe("When using dynamicMax", () => {

		it("max should be set of returned value", () => {
			const middleware = limiter({
				dynamicMax: function() {
					return 1;
				},
				onConnection: function (current, max) {
					this.maxConnections = max;
				}
			});

			middleware.call(reqContext).next();

			expect(reqContext.maxConnections).to.equal(1);
		});

		it("max should fallback when returned value can't be parsed", () => {
			const middleware = limiter({
				max: 20,
				dynamicMax: function() {
					return "hey";
				},
				onConnection: function (current, max) {
					this.maxConnections = max;
				}
			});

			middleware.call(reqContext).next();

			expect(reqContext.maxConnections).to.equal(20);
		});

		it("max should fallback when returned value is < 1", () => {
			const middleware = limiter({
				max: 20,
				dynamicMax: function() {
					return -1;
				},
				onConnection: function (current, max) {
					this.maxConnections = max;
				}
			});

			middleware.call(reqContext).next();

			expect(reqContext.maxConnections).to.equal(20);
		});

	});

	describe("When catchExceptions is true", () => {

		it("should catch and call onException", () => {
			let eCount = 0;

			const middleware = limiter({
				onException: function () {
					eCount++;
				}
			});

			const g = middleware.call(reqContext);

			g.next();
			g.throw(new Error('Something went wrong'));

			expect(eCount).to.equal(1);
		});

	});

	describe("When catchExceptions is false", () => {

		it("should not catch and not call onException", () => {
			let eCount = 0;

			const middleware = limiter({
				catchExceptions: false,
				onException: function () {
					eCount++;
				}
			});

			const g = middleware.call(reqContext);

			g.next();
			expect(() => g.throw(new Error('Something went wrong'))).to.throw();
			expect(eCount).to.equal(0);

		});

	});
})
