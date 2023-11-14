import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Database } from '../../database/data-source.js';
import { User } from './user.entity.js';

@injectable()
export class UserService {
  private userRepository: Repository<User>;

  constructor(private readonly database: Database) {
    this.userRepository = database.em.getRepository(User);
  }
}
