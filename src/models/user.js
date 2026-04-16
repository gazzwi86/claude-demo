class UserStore {
  constructor() {
    this.users = [];
    this.nextId = 1;
  }

  add(data) {
    const user = {
      id: this.nextId++,
      name: data.name,
      email: data.email,
      role: data.role || "user",
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }

  list() {
    return this.users;
  }

  findById(id) {
    return this.users.find((u) => u.id === id);
  }
}

module.exports = { UserStore };
