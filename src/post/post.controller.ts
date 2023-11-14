import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { PostService } from './post.service';
import { AuthGuard } from '@nestjs/passport';
import { CreatePostDto } from './dto/createPost.dto';
import { Request } from 'express';
import { UpdatePostDto } from './dto/updatePost';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('post')
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  getAll() {
    return this.postService.getAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  create(@Body() createPost: CreatePostDto, @Req() request: Request) {
    const userId = request.user['userId'];
    return this.postService.create(createPost, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('delete/:id')
  delete(@Param('id', ParseIntPipe) postId: number, @Req() request: Request) {
    const userId = request.user['userId'];
    return this.postService.delete(postId, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('delete/:id')
  update(
    @Param('id', ParseIntPipe) postId: number,
    @Body() updatePost: UpdatePostDto,
    @Req() request: Request,
  ) {
    const userId = request.user['userId'];
    return this.postService.update(postId, updatePost, userId);
  }
}
