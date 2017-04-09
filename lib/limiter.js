const MODULE_NAME = "koa-limit-connections";

module.exports = function (options = {}) {

    let currentConnections = 0;
    let isMaxDynamic = false;

    if (typeof options !== "object") {
        throw MODULE_NAME + " - Argument passed must be an object";
    }

    let {
        max = 100,
        dynamicMax = null,
        onMax = null,
        onConnection = null,
        onException = null,
        catchExceptions = true
    } = options;

    if (typeof dynamicMax === "function") {
        isMaxDynamic = true;
    }

    if (typeof max !== "number" || max < 1) {
        throw MODULE_NAME + " - Max must be a number and greater than 0";
    }

    return function *limitConnections(next) {
        // Increment early so that we can access and
        // test against
        currentConnections++;

        if (isMaxDynamic) {
            const res = parseInt(dynamicMax.call(this));
            max = res && res > 0 ? res : max;
        }

        if (typeof onConnection === "function" ) {
            onConnection.call(this, currentConnections, max);
        }

        if (currentConnections > max) {

            currentConnections--;

            if (typeof onMax === "function" ) {
                onMax.call(this, currentConnections, max);

            } else {
                this.status = 503;
                this.body = "Too Busy";
            }

        } else {

            if (catchExceptions) {

                try {
                    yield next;
                    currentConnections--;

                } catch (exception) {
                    currentConnections--;

                    if (typeof onException === "function" ) {
                        onException.call(this, exception);
                    }
                }

            } else {
                yield next;
                currentConnections--;
            }

        }
    };
};
