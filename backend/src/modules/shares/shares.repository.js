function createSharesRepository(prisma) {
  return {
    async create(data) {
      return prisma.share.create({
        data,
      });
    },

    async findByToken(token) {
      return prisma.share.findUnique({
        where: {
          token,
        },
        include: {
          file: true,
        },
      });
    },
  };
}

export { createSharesRepository };
