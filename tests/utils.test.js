const { describe, it } = require("node:test");
const assert = require("node:assert");
const { slugify, uniqueSlug } = require("../src/utils/slug");
const { parsePageParams, buildPaginatedResponse, paginate } = require("../src/utils/pagination");
const { sha256Hex, constantTimeEqual, hashPassword, verifyPassword } = require("../src/utils/hash");

describe("slugify", () => {
  it("lowercases and dasherizes", () => {
    assert.strictEqual(slugify("Hello World"), "hello-world");
  });

  it("strips punctuation", () => {
    assert.strictEqual(slugify("Hello, World!"), "hello-world");
  });

  it("collapses multiple spaces and dashes", () => {
    assert.strictEqual(slugify("foo   --  bar"), "foo-bar");
  });

  it("returns empty string for non-strings", () => {
    assert.strictEqual(slugify(null), "");
    assert.strictEqual(slugify(undefined), "");
  });
});

describe("uniqueSlug", () => {
  it("returns base when not taken", () => {
    assert.strictEqual(uniqueSlug("Hello", () => false), "hello");
  });

  it("appends counter when taken", () => {
    const taken = new Set(["hello", "hello-2"]);
    assert.strictEqual(uniqueSlug("Hello", (s) => taken.has(s)), "hello-3");
  });
});

describe("parsePageParams", () => {
  it("uses defaults", () => {
    const p = parsePageParams({});
    assert.strictEqual(p.page, 1);
    assert.strictEqual(p.pageSize, 20);
    assert.strictEqual(p.offset, 0);
  });

  it("clamps min", () => {
    const p = parsePageParams({ page: -5, pageSize: 0 });
    assert.strictEqual(p.page, 1);
    assert.strictEqual(p.pageSize, 1);
  });

  it("clamps max pageSize", () => {
    const p = parsePageParams({ pageSize: 9999 });
    assert.strictEqual(p.pageSize, 100);
  });
});

describe("buildPaginatedResponse", () => {
  it("computes pagination metadata", () => {
    const r = buildPaginatedResponse([1, 2], 1, 5, 2);
    assert.strictEqual(r.pagination.total, 5);
    assert.strictEqual(r.pagination.totalPages, 3);
    assert.strictEqual(r.pagination.hasNext, true);
    assert.strictEqual(r.pagination.hasPrev, false);
  });
});

describe("paginate", () => {
  it("slices the right window", () => {
    const items = [1, 2, 3, 4, 5, 6];
    assert.deepStrictEqual(paginate(items, 2, 2), [3, 4]);
    assert.deepStrictEqual(paginate(items, 3, 2), [5, 6]);
  });
});

describe("hash utils", () => {
  it("sha256Hex is deterministic", () => {
    assert.strictEqual(sha256Hex("hello"), sha256Hex("hello"));
    assert.notStrictEqual(sha256Hex("hello"), sha256Hex("world"));
    assert.strictEqual(sha256Hex("hello").length, 64);
  });

  it("constantTimeEqual matches identical strings", () => {
    assert.strictEqual(constantTimeEqual("abc", "abc"), true);
    assert.strictEqual(constantTimeEqual("abc", "abd"), false);
    assert.strictEqual(constantTimeEqual("abc", "abcd"), false);
  });

  it("hashPassword/verifyPassword roundtrip", () => {
    const hash = hashPassword("supersecret");
    assert.strictEqual(verifyPassword("supersecret", hash), true);
    assert.strictEqual(verifyPassword("wrong", hash), false);
  });
});
