import {
  Controller,
  Post,
  Inject,
  Body,
  Get,
  Req,
  Param,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { SubmitBlogDto } from '../interface/blog/dto/submit-blog-dto';
import {
  BlogPageRequestDto,
  BlogPageResponseDto,
} from '../interface/blog/dto/find-all-blog-dto';
import { Authorization } from '../decorator/authorization.decorator';
import { IResponse } from '../interface/common/response.interface';
import { CreateTagDto } from '../interface/tag/dto/create-tag.dto';
import { TagFindAll } from '../interface/tag/dto/find-tag.dto';

@Controller('blog')
@ApiTags('blog')
export class BlogController {
  constructor(
    @Inject('BLOG_SERVICE') private client: ClientProxy,
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
  ) {}
  @Post('submitBlog')
  @Authorization(true)
  @ApiBearerAuth('access-token')
  async submitBlog(@Body() submitContent: SubmitBlogDto, @Req() request) {
    const tokenInfo = await firstValueFrom(
      this.authClient.send(
        'auth_token_analysis',
        request.headers.authorization,
      ),
    );
    const submitBlogResponse = await firstValueFrom(
      this.client.send('blog_submit', {
        ...submitContent,
        user: tokenInfo.key,
      }),
    );
    return submitBlogResponse;
  }

  @Get('findOne/:id')
  @Authorization(false)
  @ApiParam({
    name: 'id',
  })
  async findOne(@Param('id') id) {
    const findOneResponse = await firstValueFrom(
      this.client.send('blog_info', id),
    );
    return findOneResponse;
  }

  @Post('findAll')
  @Authorization(false)
  async findAll(
    @Body() query: BlogPageRequestDto,
  ): Promise<BlogPageResponseDto> {
    const response = await firstValueFrom(this.client.send('blog_list', query));
    return response;
  }

  @Put('remove/:id')
  @Authorization(true)
  @ApiParam({
    name: 'id',
  })
  async remove(@Param('id') id) {
    const removeResponse = await firstValueFrom(
      this.client.send('blog_remove', id),
    );
    return removeResponse;
  }

  @Get('user')
  @Authorization(false)
  async getUserBlogs(@Req() request) {
    const authTokenResponse = await firstValueFrom(
      this.client.send('get_user_blogs', 'testUser'),
    );
    return authTokenResponse;
  }

  @Post('tagCreate')
  @Authorization(true)
  @ApiBearerAuth('access-token')
  async tagCreate(@Body() query: CreateTagDto, @Req() request) {
    const tokenInfo: { key: string } = await firstValueFrom(
      this.authClient.send(
        'auth_token_analysis',
        request.headers.authorization,
      ),
    );
    const createResponse = await firstValueFrom<IResponse<boolean>>(
      this.client.send('tag_create', { ...query, userCode: tokenInfo.key }),
    );
    return createResponse;
  }

  @Put('tagRemove/:id')
  @Authorization(true)
  @ApiParam({
    name: 'id',
  })
  async tagRemove(@Param('id') id: string) {
    const removeResponse = await firstValueFrom(
      this.client.send('tag_remove', id),
    );
    return removeResponse;
  }

  @Post('tagFindAll')
  @Authorization(false)
  async tagFindAll(@Body() query: TagFindAll) {
    const response = await firstValueFrom(this.client.send('tag_list', query));
    return response;
  }
}
