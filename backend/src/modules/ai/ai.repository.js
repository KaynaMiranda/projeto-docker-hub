function createAIResultsRepository(prisma) {
  return {
    async create(data) {
      return prisma.aIResult.create({
        data,
      });
    },

    async findById(id) {
      return prisma.aIResult.findUnique({
        where: {
          id,
        },
      });
    },

    async findManyByFileId(fileId) {
      return prisma.aIResult.findMany({
        where: {
          fileId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    async findByFileIdAndType(fileId, type) {
      return prisma.aIResult.findFirst({
        where: {
          fileId,
          type,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    async updateById(id, data) {
      return prisma.aIResult.update({
        where: {
          id,
        },
        data,
      });
    },
  };
}

export { createAIResultsRepository };
