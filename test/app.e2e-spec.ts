import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import * as pactum from 'pactum'

import { PrismaService } from "../src/prisma/prisma.service";
import { AuthDto } from "src/auth/dto";
import { EditUserDto } from "src/user/dto";
import { CreateBookmarkDto, EditBookmarkDto } from "src/bookmark/dto";

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication();
    
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
    await app.listen(3011)

    prisma = app.get(PrismaService)
    await prisma.cleanDb()

    pactum.request.setBaseUrl('http://localhost:3011/');
  })

  afterAll(() => {
    app.close();
  })

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@gmail.com',
      password: '123'
    }

    describe('Signup', () => {
      it('should throw error if email is empty', () => {
        return pactum.spec()
          .post('auth/signup')
          .withBody({password: dto.password})
          .expectStatus(400)
      })

      it('should throw error if no data provided', () => {
        return pactum.spec()
          .post('auth/signup')
          .expectStatus(400)
      })

      it('should signup', () => {
        return pactum.spec()
          .post('auth/signup')
          .withBody(dto)
          .expectStatus(201)
      })
    })

    describe('Signin', () => {
      it('should signin', () => {
        return pactum.spec()
          .post('auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token')
      })


      it('should throw error if no data provided', () => {
        return pactum.spec()
          .post('auth/signin')
          .expectStatus(400)
      })

      it('should signup', () => {
        return pactum.spec()
          .post('auth/signin')
          .withBody(dto)
          .expectStatus(200)
      })
    })

  })

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    })

    describe('Edit user', () => {
      it('should edit user by id', () => {
        const dto: EditUserDto = {
          firstName: 'John',
          email: 'john@gmail.com'
        }

        return pactum.spec()
          .patch('users')
          .withHeaders({Authorization: 'Bearer $S{userAt}'})
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email)
      })
    })
  })

  describe('Bookmarks ', () => {
    describe('Get empty bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum.spec()
          .get('bookmarks')
          .withHeaders({Authorization: 'Bearer $S{userAt}'})
          .expectStatus(200)
          .expectBody([])
      })
    })

    describe('Create bookmark', () => {
      it('should create bookmark', () => {
        const dto: CreateBookmarkDto = {
          title: 'Bookmark1',
          link: 'https://test.com'
        }
        
        return pactum.spec()
          .post('bookmarks')
          .withHeaders({Authorization: 'Bearer $S{userAt}'})
          .expectStatus(201)
          .withBody(dto)
          .stores('bookmarkId', 'id')
      })
    })

    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum.spec()
          .get('bookmarks')
          .withHeaders({Authorization: 'Bearer $S{userAt}'})
          .expectStatus(200)
          .expectJsonLength(1)
      })
    })

    describe('Get bookmark by id', () => {
      it('should get bookmark', () => {
        return pactum.spec()
          .get('bookmarks/{id}')
          .withHeaders({Authorization: 'Bearer $S{userAt}'})
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(200)
          .inspect()
          .expectBodyContains('$S{bookmarkId}')
      })
    })

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'Title 1',
        description: 'Descr 1'
      }

      it('should edit bookmark', () => {
        return pactum.spec()
          .patch('bookmarks/{id}')
          .withHeaders({Authorization: 'Bearer $S{userAt}'})
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description)
      })
    })

    describe('Delete bookmark by id', () => {
      it('should delete bookmark', () => {
        return pactum.spec()
          .delete('bookmarks/{id}')
          .withHeaders({Authorization: 'Bearer $S{userAt}'})
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(204)
      })

      it('should get an empty bookmarks', () => {
        return pactum.spec()
          .get('bookmarks')
          .withHeaders({Authorization: 'Bearer $S{userAt}'})
          .expectStatus(200)
          .expectJsonLength(0)
      })
    })
  })
})