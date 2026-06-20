import type { TyravelRequest } from '@tyravel/http';
import { Response } from '@tyravel/http';
import { User } from '../models/user.js';

export class UserController {
  async index() {
    const users = await User.all();
    return Response.json({ users: users.map((user) => user.toJSON()) });
  }

  async show(request: TyravelRequest) {
    const user = await User.find(Number(request.param('id')));

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const posts = await user.posts().get();

    return Response.json({
      user: user.toJSON(),
      posts: posts.map((post) => post.toJSON()),
    });
  }
}