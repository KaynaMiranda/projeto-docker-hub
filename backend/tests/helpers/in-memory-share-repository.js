import { randomUUID } from "node:crypto";

function createInMemoryShareRepository(filesRepository, initialItems = []) {
  const items = [...initialItems];

  return {
    async create(data) {
      const item = {
        id: randomUUID(),
        createdAt: new Date(),
        ...data,
      };

      items.unshift(item);
      return item;
    },

    async findByToken(token) {
      const share = items.find((item) => item.token === token) || null;

      if (!share) {
        return null;
      }

      const file = await filesRepository.findById(share.fileId);

      return {
        ...share,
        file,
      };
    },
  };
}

export { createInMemoryShareRepository };
