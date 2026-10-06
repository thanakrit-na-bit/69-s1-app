// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: any) {
    const enablePublicApiPermissions = async () => {
      try {
        const publicRole = await strapi.db
          .query('plugin::users-permissions.role')
          .findOne({ where: { type: 'public' } });
        if (!publicRole) return;

        const roleService = strapi.plugin('users-permissions').service('role');
        const roleDetails = await roleService.findOne(publicRole.id);
        const permissions = roleDetails.permissions ?? {};

        for (const [typeName, type] of Object.entries<any>(permissions)) {
          if (typeName !== 'api::movie' && typeName !== 'api::review') continue;
          for (const controller of Object.values<any>(type.controllers ?? {})) {
            for (const action of Object.values<any>(controller)) {
              action.enabled = true;
            }
          }
        }

        await roleService.updateRole(publicRole.id, { permissions });
        strapi.log.info('[seed] Public permissions for movie/review enabled');
      } catch (error: any) {
        strapi.log.warn(`[seed] Could not enable public permissions: ${error.message}`);
      }
    };

    const seedDemoData = async () => {
      try {
        const movieCount = await strapi.db.query('api::movie.movie').count();
        const reviewCount = await strapi.db.query('api::review.review').count();

        if (movieCount > 0 || reviewCount > 0) return;

        const movies = [
          {
            title: 'Inception',
            slug: 'inception',
            synopsis: 'โจรล้วงความฝันต้องเจาะลึกหลายชั้น',
            genre: 'scifi',
            release_year: 2010,
            duration_min: 148,
          },
          {
            title: 'The Dark Knight',
            slug: 'the-dark-knight',
            synopsis: 'Batman เผชิญหน้ากับ The Joker',
            genre: 'action',
            release_year: 2008,
            duration_min: 152,
          },
          {
            title: 'Parasite',
            slug: 'parasite',
            synopsis: 'ครอบครัวจนวางแผนแทรกซึมเข้าบ้านคนรวย',
            genre: 'drama',
            release_year: 2019,
            duration_min: 132,
          },
        ];

        const createdMovies: any[] = [];
        for (const movie of movies) {
          const created = await strapi.documents('api::movie.movie').create({
            data: movie,
            status: 'published',
          });
          createdMovies.push(created);
        }

        const reviews = [
          {
            reviewer_name: 'Thanakrit',
            score: 9,
            comment: 'ดูแล้วติดตามตั้งแต่เปิดเรื่อง',
            phone: '081-234-5678',
            movie: createdMovies[0]?.documentId,
          },
          {
            reviewer_name: 'Student Demo',
            score: 8.5,
            comment: 'แอคชันดี บิวด์ตัวร้ายได้น่ากลัว',
            phone: '089-111-2222',
            movie: createdMovies[1]?.documentId,
          },
          {
            reviewer_name: 'Security Test',
            score: 9.5,
            comment: 'ไอเดียเรื่องสะท้อนสังคมได้คมมาก',
            phone: '090-333-4444',
            movie: createdMovies[2]?.documentId,
          },
        ];

        for (const review of reviews) {
          await strapi.documents('api::review.review').create({
            data: review,
            status: 'published',
          });
        }

        strapi.log.info('[seed] Demo movies/reviews created');
      } catch (error: any) {
        strapi.log.warn(`[seed] Could not seed demo data: ${error.message}`);
      }
    };

    await enablePublicApiPermissions();
    await seedDemoData();
  },
};
