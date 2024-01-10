const AppError = require('../utils/AppError');
const sqliteConnection = require('../database/sqlite');
const { hash, compare } = require('bcryptjs');

class UsersController {
  async create(request, response) {
    const { name, email, password } = request.body;

    const database = await sqliteConnection();

    // verify if user email already exists
    const emailExists = await database.get(
      'SELECT * FROM users WHERE email = (?)',
      [email]
    );
    if (emailExists) {
      throw new AppError('Este email já está em uso');
    }

    // encrypt password
    const hashedPassword = await hash(password, 8);

    // save new user into data base
    await database.run(
      'INSERT INTO users ( name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    if (!name) {
      throw new AppError('O nome é obrigatório!');
    }

    return response.status(201).json();
  }

  async update(request, response) {
    const { name, email, password, new_password } = request.body;
    const { id } = request.params;
    const database = await sqliteConnection();

    // verify the user with that id
    const user = await database.get('SELECT * FROM users WHERE id = (?)', [id]);
    if (!user) {
      throw new AppError('Usuário não encontrato');
    }

    // verify if new email is already being used
    const userAlreadyaHaveTheEmail = await database.get(
      'SELECT * FROM users WHERE email = (?)',
      [email]
    );
    if (userAlreadyaHaveTheEmail && userAlreadyaHaveTheEmail.id !== user.id) {
      throw new AppError(
        'Este email já está sendo usado por outro usuário (que não é você).'
      );
    }

    // verify if password is valid and update
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

    // have come this far, then just update user in data base
    user.name = name ?? user.name;
    user.email = email ?? user.email;
    await database.run(
      `UPDATE users SET
      name = ?,
      email = ?,
      password = ?,
      updated_at = DATETIME('now')
      WHERE id = ?`,
      [user.name, user.email, user.password, id]
    );

    return response.status(200).json();
  }
}

module.exports = UsersController;
