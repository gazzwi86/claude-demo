const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const { resetAll } = require("../src/db/repository");
const { clearAll } = require("../src/cache");
const postsService = require("../src/services/posts");
const authService = require("../src/services/auth");
const { ValidationError, NotFoundError, AuthError } = require("../src/errors");

function makeUser(email = "a@x.com") {
  return authService.register({ name: "Author", email, password: "password1" });
}

describe("posts service", () => {
  beforeEach(() => {
    resetAll();
    clearAll();
  });

  it("creates a post with author and slug", () => {
    const user = makeUser();
    const post = postsService.createPost(
      { title: "My First Post", body: "Hello world" },
      user.id,
    );
    assert.strictEqual(post.title, "My First Post");
    assert.strictEqual(post.slug, "my-first-post");
    assert.strictEqual(post.authorId, user.id);
    assert.strictEqual(post.published, false);
  });

  it("rejects too-short titles", () => {
    const user = makeUser();
    assert.throws(
      () => postsService.createPost({ title: "ab", body: "x" }, user.id),
      ValidationError,
    );
  });

  it("lists posts paginated, newest first", () => {
    const user = makeUser();
    postsService.createPost({ title: "Post One", body: "a" }, user.id);
    postsService.createPost({ title: "Post Two", body: "b" }, user.id);
    postsService.createPost({ title: "Post Three", body: "c" }, user.id);
    const result = postsService.listPosts({ page: 1, pageSize: 2 });
    assert.strictEqual(result.items.length, 2);
    assert.strictEqual(result.pagination.total, 3);
    assert.strictEqual(result.pagination.totalPages, 2);
    assert.strictEqual(result.pagination.hasNext, true);
  });

  it("getPost returns the post", () => {
    const user = makeUser();
    const created = postsService.createPost({ title: "Hello", body: "x" }, user.id);
    const found = postsService.getPost(created.id);
    assert.strictEqual(found.id, created.id);
  });

  it("getPost throws NotFoundError for missing", () => {
    assert.throws(() => postsService.getPost(9999), NotFoundError);
  });

  it("updatePost only allowed for author", () => {
    const user = makeUser("owner@x.com");
    const other = makeUser("other@x.com");
    const post = postsService.createPost({ title: "Mine", body: "x" }, user.id);
    assert.throws(
      () => postsService.updatePost(post.id, { title: "Hijack" }, other.id),
      AuthError,
    );
    const updated = postsService.updatePost(post.id, { title: "Renamed Post" }, user.id);
    assert.strictEqual(updated.title, "Renamed Post");
    assert.strictEqual(updated.slug, "renamed-post");
  });

  it("deletePost removes the post", () => {
    const user = makeUser();
    const post = postsService.createPost({ title: "Bye", body: "x" }, user.id);
    postsService.deletePost(post.id, user.id);
    assert.throws(() => postsService.getPost(post.id), NotFoundError);
  });
});
