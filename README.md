# koa-limit-connections
Simple middleware to limit concurrency for __Koa v1__

Need to restrict how much traffic your application can take at any given point in time? With *koa-limit-connections* you can easily define your limits both statically or dynamically.

## Getting started
Install the module to your project
```
$ npm install --save koa-limit-connections
```

Add it to your middleware stack. It's highly recommended that it's included near the top before any downstream computation occurs to prevent unnecessary load on your application. It's a fail fast approach.

```js
const limitConnections = require("koa-limit-connections");
const Koa = require('koa');
const app = new Koa();

app.use(limitConnections({
    // Override default options
}));

// response
app.use(ctx => {
  ctx.body = 'Hello Koa';
});

app.listen(3000);
```

## Options

### max
`number` - **Default 100**


Use any value > 0 to set your threshold.

```js
app.use(limitConnections({
    max: 10
}));
```


### dynamicMax
`function` - Has Koa context


Allows you to update the **max** threshold dynamically as long as it's parseable and value exceeds 0 else falls back to **max**

```js
app.use(limitConnections({
    max: 20,
    dynamicMax: function () {
        // get request header
        return parseInt(this.get("limit-connections"));
    }
}));
```


### onConnection
`function([connections][, max])` - Has Koa context


Called on initial request.

```js
app.use(limitConnections({
    onConnection: function () {
        // Do stuff ...
    }
}));
```


### onMax
`function([connections][, max])` - Has Koa context


Called when threshold is met preventing the rest of the middelware stack being called. Use this as an opportunity to customize your response. By default it sets response status to **503** and response body to **Too Busy**

```js
app.use(limitConnections({
    onMax: function () {
        this.body = "<h1>Application is too busy to handle your request</h1>";
    }
}));
```


### onException
`function([exception])` - Has Koa context


Added as an additional security measure **koa-limit-connections** catches unhandled exceptions to ensure that connections are decremented even in the case of exceptions caused from downstream middleware or other application faults.

```js
app.use(limitConnections({
    onException: function (exception) {
        // Handle exception ...
    }
}));
```
