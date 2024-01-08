const AppError = require('../utils/AppError');
const sqliteConnection = require('../database/sqlite');

class UsersController {
  async create(request, response) {
    const { name, email, password } = request.body;

    const database = await sqliteConnection();

    //verify if user email already exists
    const emailExists = await database.get(
      'SELECT * FROM users WHERE email = (?)',
      [email]
    );
    if (emailExists) {
      throw new AppError('Este email já está em uso');
    }

    await database.run(
      'INSERT INTO users ( name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );

    if (!name) {
      throw new AppError('O nome é obrigatório!');
    }

    return response.status(201).json();
  }
}

module.exports = UsersController;
