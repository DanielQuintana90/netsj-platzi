import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindConditions } from 'typeorm';

import { Product } from './../entities/product.entity';
import {
  CreateProductDto,
  FilterProductsDto,
  UpdateProductDto,
} from './../dtos/products.dtos';
import { Category } from '../entities/category.entity';
import { Brand } from '../entities/brand.entity';
import { min } from 'class-validator';

@Injectable()
export class ProductsService {
  // private counterId = 1;

  // private products: Product[] = [
  //   {
  //     id: 1,
  //     name: 'Product 1',
  //     description: 'bla bla',
  //     price: 122,
  //     image: '',
  //     stock: 12,
  //   },
  // ];

  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(Brand) private brandRepo: Repository<Brand>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
  ) {}

  findAll(params?: FilterProductsDto) {
    if (params) {
      const where: FindConditions<Product> = {};
      const { limit, offset } = params;
      const { minPrice, maxPrice } = params;
      if (minPrice && maxPrice) {
        where.price = Between(minPrice, maxPrice);
      }
      return this.productRepository.find({
        relations: ['brand', 'categories'],
        take: limit,
        skip: offset,
        where,
      });
    }
    return this.productRepository.find({
      relations: ['brand', 'categories'],
    });
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne(id, {
      relations: ['brand', 'categories'],
    });

    if (!product) {
      throw new NotFoundException(`Producto #${id} not found`);
    }

    return product;
  }

  async create(data: CreateProductDto) {
    // const newProduct = new Product();
    // newProduct.image = data.image;
    // newProduct.name = data.name;
    // newProduct.description = data.description;
    // newProduct.price = data.price;
    // newProduct.stock = data.stock;

    const newProduct = this.productRepository.create(data);
    if (data.brandId) {
      const brand = await this.brandRepo.findOne(data.brandId);
      newProduct.brand = brand;
    }
    if (data.categoriesId) {
      const categories = await this.categoryRepo.findByIds(data.categoriesId);
      newProduct.categories = categories;
    }
    return this.productRepository.save(newProduct);
  }

  async update(id: number, changes: UpdateProductDto) {
    const product = await this.productRepository.findOne(id);
    if (changes.brandId) {
      const brand = await this.brandRepo.findOne(changes.brandId);
      product.brand = brand;
    }
    if (changes.categoriesId) {
      const categories = await this.categoryRepo.findByIds(
        changes.categoriesId,
      );
      product.categories = categories;
    }
    this.productRepository.merge(product, changes);
    return this.productRepository.save(product);
  }

  async removeCategoryByProduct(productId: number, categoryId: number) {
    const product = await this.productRepository.findOne(productId, {
      relations: ['categories'],
    });
    product.categories = product.categories.filter(
      (item) => item.id !== categoryId,
    );
    return this.productRepository.save(product);
  }

  async addCategoryToProduct(productId: number, categoryId: number) {
    const product = await this.productRepository.findOne(productId, {
      relations: ['categories'],
    });

    const category = await this.categoryRepo.findOne(categoryId);
    product.categories.push(category);

    return this.productRepository.save(product);
  }

  remove(id: number) {
    return this.productRepository.delete(id);
  }
}
