const knex = require('../database/knex');
const AppError = require('../utils/AppError');

class NotesController {
  async create(request, response) {
    const { title, description, tags, links } = request.body;
    const { user_id } = request.params;

    // validate user_id
    const user = await knex('users').select('*').where({ id: user_id }).first();
    if (!user) {
      throw new AppError(
        `Não foi encontrado nenhum usuário com o id = ${user_id}.`
      );
    }

    // insert the new note in the database
    const [note_id] = await knex('notes').insert({
      title,
      description,
      user_id,
    });

    const linksToInsert = links.map((link) => {
      return {
        note_id,
        url: link,
      };
    });
    await knex('links').insert(linksToInsert);

    const tagsToInsert = tags.map((name) => {
      return {
        note_id,
        name,
        user_id,
      };
    });
    await knex('tags').insert(tagsToInsert);

    return response.json();
  }

  async show(request, response) {
    const { id } = request.params;

    const note = await knex('notes').where({ id }).first();
    const tags = await knex('tags').where({ note_id: id }).orderBy('name');
    const links = await knex('links')
      .where({ note_id: id })
      .orderBy('created_at');

    return response.json({
      ...note,
      tags,
      links,
    });
  }

  async delete(request, response) {
    const { id } = request.params;

    // validate id
    const note = await knex('notes').where({ id }).first();
    if (!note) {
      throw new AppError(`Não foi encontrada nenhuma nota com o id = ${id}.`);
    }

    // delete existing note
    await knex('notes').where({ id }).del();

    return response.json();
  }

  async index(request, response) {
    const { user_id, title, tags } = request.query;

    // validate user_id
    const user = await knex('users').where({ id: user_id }).first();
    if (!user) {
      throw new AppError(`Nenhum usuário encontrado com id = ${user_id}.`);
    }

    // search the notes by the tag (if tags were passed on request)
    let notes;
    if (tags) {
      // if there's tag, search by it
      const tagsArray = tags.split(',').map((tag) => tag.trim());

      notes = await knex('notes')
        .innerJoin('tags', 'tags.note_id', 'notes.id')
        // .select('notes.id', 'notes.title', 'notes.user_id')
        .select('notes.*')
        .where('notes.user_id', user_id)
        .whereLike('notes.title', `%${title}%`)
        .whereIn('tags.name', tagsArray)
        .orderBy('notes.title')
        .groupBy('notes.id');
    } else {
      /* if no tags, search by title of the note */
      notes = await knex('notes')
        .where({ user_id })
        .whereLike('title', `%${title}%`)
        .orderBy('title')
        .groupBy('notes.id');
    }

    const userTags = await knex('tags').where({ user_id });
    const notesWithTags = notes.map((note) => {
      const noteTags = userTags.filter((tag) => tag.note_id === note.id);
      return {
        ...note,
        tags: noteTags,
      };
    });

    return response.json(notesWithTags);
  }
}

module.exports = NotesController;
