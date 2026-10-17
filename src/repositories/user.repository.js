const PUBLIC_FIELDS = ['id', 'email', 'nickname', 'image', 'createdAt', 'updatedAt'];

export class UserRepository {
  #db;

  constructor({ db }) {
    this.#db = db;
  }

  create(data) {
    return this.#db.orm.public.User.create(data);
  }

  findByEmail(email) {
    return this.#db.orm.public.User.where({ email }).first();
  }

  findByNickname(nickname) {
    return this.#db.orm.public.User.where({ nickname }).first();
  }

  findById(id) {
    return this.#db.orm.public.User.where({ id: Number(id) })
      .select(...PUBLIC_FIELDS)
      .first();
  }
}
