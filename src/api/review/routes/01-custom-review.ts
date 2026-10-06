export default {
  routes: [
    {
      method: 'GET',
      path: '/reviews/:id/verify',
      handler: 'api::review.review.verifyIntegrity',
      config: {
        auth: false,
      },
    },
  ],
};
