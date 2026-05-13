import { randomUUID } from "node:crypto";

function createInMemoryRuntimeFileRepository(initialItems = []) {
  const items = [...initialItems];

  return {
    async create(data) {
      const item = {
        id: randomUUID(),
        processingStatus: "IDLE",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };

      items.unshift(item);
      return item;
    },

    async findMany() {
      return [...items];
    },

    async findById(id) {
      return items.find((item) => item.id === id) || null;
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

export { createInMemoryRuntimeFileRepository };
