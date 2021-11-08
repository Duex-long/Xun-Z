import { Inject, Injectable } from '@nestjs/common';
import {
  BlogContentFace,
  SearchBlogInfo,
} from './interface/blog/blog.interface';
import { Blog } from './blogs/blogs.entity';
import { Repository, getRepository, getConnection } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BlogPageRequest,
  BlogPageResponse,
} from './interface/common/page.interface';
import { Tag } from './blogs/tag.entity';
import { TagFindAll } from './interface/tag/dto/find-tag.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    @Inject('USER_SERVICE') private userServiceClient,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }
  /**
   * blog-博客模块
   */
  async searchBlogInfo(code: string): Promise<SearchBlogInfo[]> {
    const blog = new Blog();
    blog.user = code;
    const blogList = (await this.blogRepository.find(blog)) || [];
    const userInfo = await this.userServiceClient.send('get_userInfo', code);
    const result = blogList.map(
      (item) =>
        ({
          ...item,
          name: userInfo.name,
        } as SearchBlogInfo),
    );
    return result;
  }
  public async blogFindAll(
    query: BlogPageRequest,
  ): Promise<BlogPageResponse<Blog>> {
    const { pageNo, pageSize } = query;
    const filed = [
      'blog.id',
      'blog.user',
      'blog.summary',
      'blog.title',
      'blog.createTime',
      'blog.updateTime',
    ];
    const [list, total] = await getRepository(Blog)
      .createQueryBuilder('blog')
      .select(filed)
      .skip((pageNo - 1) * pageSize)
      .take(pageSize)
      .orderBy('blog.updateTime')
      .getManyAndCount();
    const response = {
      pageNo,
      pageSize,
      list,
      total,
    };

    return response;
  }
  public async blogFindOne(blogId: string): Promise<BlogContentFace> {
    const blogInfo = this.blogRepository.findOne(blogId);
    return blogInfo;
  }
  public async submitBlog(blogContent: BlogContentFace) {
    const blog = new Blog();
    blog.user = 'testUser';
    blog.title = blogContent.title;
    blog.content = blogContent.content;
    blog.summary = blogContent.summary;
    if (!!blogContent.id) {
      await this.blogRepository.update(blogContent.id, blog);
    } else {
      await this.blogRepository.save(blog);
    }

    return null;
  }
  public async blogRemove(blogId: string) {
    try {
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(Blog)
        .where('id = :id', { id: blogId })
        .execute();
      return null;
    } catch (error) {
      return error;
    }
  }
  /**
   * tag-标签模块
   */
  public async tagCreate(data) {
    try {
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Tag)
        .values([data])
        .execute();
      return null;
    } catch (error) {
      return error;
    }
  }
  public async tagFindAll(data: TagFindAll) {
    console.log(data, 'this is where');
    const tagList = await getRepository(Tag)
      .createQueryBuilder('tag')
      .getMany();
    return tagList;
  }
  public async tagRemove(tagId: string) {
    try {
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(Tag)
        .where('id = :id', { id: tagId })
        .execute();
      return null;
    } catch (error) {
      return error;
    }
  }
}
