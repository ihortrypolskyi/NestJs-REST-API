import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}
  
  getBookmarks(userId: number) {
    return this.prisma.bookmarks.findMany({
      where: {
        userId: userId
      }
    })
  }
  
  getBookmarkById(userId: number, bookmarkId: number) {
    return this.prisma.bookmarks.findFirst({
      where: {
        userId: userId,
        id: bookmarkId
      }
    })
  }

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    const bookmark = await this.prisma.bookmarks.create ({
      data: {
        userId: userId,
        ...dto
      }
    })

    return bookmark
  }
  
  async editBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
    const bookmark = this.prisma.bookmarks.findUnique({
      where: {
        userId: userId,
        id: bookmarkId
      }
    })

    if(!bookmark) throw new ForbiddenException('Resource is not found')
    
    return this.prisma.bookmarks.update({
      where: {
        id: bookmarkId
      },
      data: {
        ...dto
      }
    })
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = this.prisma.bookmarks.findUnique({
      where: {
        userId: userId,
        id: bookmarkId
      }
    })

    if(!bookmark) throw new ForbiddenException('Resource is not found')

    await this.prisma.bookmarks.delete({
      where: {
        id: bookmarkId,
      }
    })
  }
} 