module.exports = function (options = {}) {
    const NAME = "Limit Connections";

    if (typeof options !== "object") {
        throw NAME + " - Argument passed must be an object";
    }

    let {
        maxConnections = 100,
        onMaxConnections = null,
        onException = null
    } = options;

    let currentConnections = 0;

    return function *limitConnections(next) {

        if (currentConnections === maxConnections) {

            if (typeof onMaxConnections === "function" ) {
                onMaxConnections.call(this);
            } else {
                this.status = 503;
                this.body = "Too Busy";
            }

        } else {
            currentConnections++;

            try {
                yield next;
                currentConnections--;

            } catch (exception) {
                currentConnections--;

                if (typeof onException === "function" ) {
                    onException.call(this, exception);
                }
            }
        }
    }
}
