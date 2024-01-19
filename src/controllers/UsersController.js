const AppError = require('../utils/AppError');
const sqliteConnection = require('../database/sqlite');
const knex = require('../database/knex');
const { hash, compare } = require('bcryptjs');

class UsersController {
  async create(request, response) {
    const { name, email, password } = request.body;

    // verify if user email is already in use
    const emailInUse = await knex('users').where({ email });
    if (emailInUse) {
      throw new AppError('Este email já está em uso');
    }

    // encrypt password
    const hashedPassword = await hash(password, 8);

    // save new user into data base
    await knex('users').insert({ name, email, password });

    if (!name) {
      throw new AppError('O nome é obrigatório!');
    }

    return response.status(201).json();
  }

  async update(request, response) {
    const { name, email, password, new_password } = request.body;
    const { id } = request.params;

    // verify the user with that id
    const user = await knex('users').select('*').where({ id }).first();
    if (!user) {
      throw new AppError('Usuário não encontrato');
    }

    // verify if the new email is already in used by other user
    const userAlreadyHaveNewEmail = await knex('users')
      .select('*')
      .where({ email })
      .first();
    if (userAlreadyHaveNewEmail && userAlreadyHaveNewEmail.id !== user.id) {
      throw new AppError(
        'Este email já está sendo usado por outro usuário (que não é você).'
      );
    }

    // verify if password is valid, and update it
    if (new_password && !password) {
      throw new AppError('Você precisa informar a senha antiga.');
    }
    if (new_password && password) {
      const checkPassword = await compare(password, user.password);
      if (!checkPassword) {
        throw new AppError('A senha atual não confere.');
      }

      user.password = await hash(new_password, 8);
    }

    // have come this far, then just update user in database
    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.updated_at = knex.fn.now();
    await knex('users').where({ id }).update(user);
    // await database.run(
    //   `UPDATE users SET
    //   name = ?,
    //   email = ?,
    //   password = ?,
    //   updated_at = DATETIME('now')
    //   WHERE id = ?`,
    //   [user.name, user.email, user.password, id]
    // );
    //
    // knex.fn.now()

    return response.status(200).json();
  }
}

module.exports = UsersController;
