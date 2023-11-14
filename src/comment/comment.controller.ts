import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Req,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Request } from 'express';
import { CreateCommentDto } from './dto/createComment.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger/dist/decorators';

@ApiBearerAuth()
@ApiTags('Comment')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  create(@Req() request: Request, @Body() createComment: CreateCommentDto) {
    const userId = request.user['userId'];
    return this.commentService.create(createComment, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('delete/:id')
  delete(
    @Param('id', ParseIntPipe) idComment: number,
    @Req() request: Request,
    @Body('postId') postId: number,
  ) {
    const userId = request.user['userId'];
    return this.commentService.delete(idComment, userId, postId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('delete/:id')
  update(
    @Param('id', ParseIntPipe) commentId: number,
    @Req() request: Request,
    @Body() updateComment: UpdateCommentDto,
  ) {
    const userId = request.user['userId'];
    return this.commentService.update(commentId, userId, updateComment);
  }
}
