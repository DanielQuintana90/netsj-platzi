import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigType } from '@nestjs/config';
import { Client } from 'pg';

import config from './../../config';
import { User } from '../entities/user.entity';
import { Order } from '../entities/order.entity';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';

import { ProductsService } from '../../products/services/products.service';
import { CustomersService } from './customers.service';

@Injectable()
export class UsersService {
  constructor(
    private productsService: ProductsService,
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
    @Inject('PG') private clientPg: Client,
    @InjectRepository(User) private userRepository: Repository<User>,
    private customerService: CustomersService,
  ) {}

  findAll() {
    console.log(this.configService.apiKey);
    console.log(this.configService.database.name);

    return this.userRepository.find({
      relations: ['customer'],
    });
  }

  findOne(id: number) {
    const user = this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async create(data: CreateUserDto) {
    const newUser = this.userRepository.create(data);

    if (data.customerId) {
      const customer = await this.customerService.findOne(data.customerId);
      newUser.customer = customer;
    }

    return this.userRepository.save(newUser);
  }

  async update(id: number, changes: UpdateUserDto) {
    const user = await this.userRepository.findOne(id);
    this.userRepository.merge(user, changes);
    return this.userRepository.save(user);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }

  async getOrderByUser(id: number) {
    const user = this.findOne(id);
    return {
      date: new Date(),
      user,
      products: await this.productsService.findAll(),
    };
  }

  getTasks() {
    return new Promise((resolve, reject) => {
      this.clientPg.query('SELECT * FROM tasks', (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res.rows);
      });
    });
  }
}
