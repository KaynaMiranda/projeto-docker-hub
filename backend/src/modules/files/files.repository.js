function createFilesRepository(prisma) {
  return {
    async create(data) {
      return prisma.file.create({
        data,
      });
    },

    async findMany() {
      return prisma.file.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    async findById(id) {
      return prisma.file.findUnique({
        where: {
          id,
        },
      });
    },

    async updateById(id, data) {
      return prisma.file.update({
        where: {
          id,
        },
        data,
      });
    },
  };
}

export { createFilesRepository };
