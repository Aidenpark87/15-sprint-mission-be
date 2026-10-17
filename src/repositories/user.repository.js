const PUBLIC_SELECT = {
  id: true,
  email: true,
  nickname: true,
  image: true,
  createdAt: true,
  updatedAt: true,
};

export class UserRepository {
  #db;

  constructor({ db }) {
    this.#db = db;
  }

  create(data) {
    return this.#db.user.create({ data });
  }

  findByEmail(email) {
    return this.#db.user.findUnique({ where: { email } });
  }

  findByNickname(nickname) {
    return this.#db.user.findUnique({ where: { nickname } });
  }

  findById(id) {
    return this.#db.user.findUnique({
      where: { id: Number(id) },
      select: PUBLIC_SELECT,
    });
  }
}
