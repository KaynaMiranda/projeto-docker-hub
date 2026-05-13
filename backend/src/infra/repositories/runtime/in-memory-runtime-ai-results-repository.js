import { randomUUID } from "node:crypto";

function createInMemoryRuntimeAIResultsRepository(filesRepository, initialItems = []) {
  const items = [...initialItems];

  return {
    async create(data) {
      const item = {
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };

      items.unshift(item);
      return item;
    },

    async findById(id) {
      return items.find((item) => item.id === id) || null;
    },

    async findManyByFileId(fileId) {
      return items
        .filter((item) => item.fileId === fileId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async findByFileIdAndType(fileId, type) {
      return (
        items.find((item) => item.fileId === fileId && item.type === type) || null
      );
    },

    async updateById(id, data) {
      const itemIndex = items.findIndex((item) => item.id === id);

      if (itemIndex === -1) {
        return null;
      }

      items[itemIndex] = {
        ...items[itemIndex],
        ...data,
      };

      return items[itemIndex];
    },
  };
}

export { createInMemoryRuntimeAIResultsRepository };
