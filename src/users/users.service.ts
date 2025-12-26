import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { UpdateUserDto } from '../auth/dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, role } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new this.userModel({
      email,
      password: hashedPassword,
      name,
      role: role || 'user',
      isActive: true,
    });

    await user.save();

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async findAll() {
    const users = await this.userModel.find().select('-password').exec();
    return users;
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: any) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent non-admin users from changing their role or other users
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Prevent non-admin users from changing role
    if (currentUser.role !== 'admin' && updateUserDto.role) {
      throw new ForbiddenException('You cannot change your role');
    }

    // If password is being updated, hash it
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({ email: updateUserDto.email });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { ...updateUserDto }, { new: true })
      .select('-password')
      .exec();

    return updatedUser;
  }

  async remove(id: string, currentUser: any) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent users from deleting themselves
    if (currentUser.id === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await this.userModel.findByIdAndDelete(id).exec();
    return { message: 'User deleted successfully' };
  }

  async findOneByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }
}
