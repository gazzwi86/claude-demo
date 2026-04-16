const { describe, it } = require("node:test");
const assert = require("node:assert");
const { UserStore } = require("../src/models/user");

describe("UserStore", () => {
  it("should add a user with an auto-incremented id", () => {
    const store = new UserStore();
    const user = store.add({ name: "Test", email: "test@example.com" });
    assert.strictEqual(user.id, 1);
    assert.strictEqual(user.name, "Test");
    assert.strictEqual(user.role, "user");
  });

  it("should list all users", () => {
    const store = new UserStore();
    store.add({ name: "A", email: "a@example.com" });
    store.add({ name: "B", email: "b@example.com" });
    assert.strictEqual(store.list().length, 2);
  });

  it("should find a user by id", () => {
    const store = new UserStore();
    store.add({ name: "Find Me", email: "find@example.com" });
    const found = store.findById(1);
    assert.strictEqual(found.name, "Find Me");
  });
});
