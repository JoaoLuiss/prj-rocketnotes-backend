const knex = require('../database/knex');
const AppError = require('../utils/AppError');

class TagsController {
  async index(request, response) {
    const { user_id } = request.params;

    const tags = await knex('tags').where({ user_id }).orderBy('name');

    return response.json(tags);
  }
}

module.exports = TagsController;
