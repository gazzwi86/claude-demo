---
description: Scaffold a new REST endpoint with route, model, and test
arguments:
  - name: resource
    description: The resource name (e.g. "products", "orders")
    required: true
---

Create a new REST API endpoint for the "$ARGUMENTS.resource" resource:

1. Create `src/models/$ARGUMENTS.resource.js` with a store class following the UserStore pattern
2. Create `src/routes/$ARGUMENTS.resource.js` with GET (list) and POST (create) handlers
3. Register the routes in `src/routes/index.js`
4. Create `tests/$ARGUMENTS.resource.test.js` with basic tests
5. Run `npm test` to verify everything works
