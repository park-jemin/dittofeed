import backendConfig from "backend-lib/src/config";
import { insertUserEvents } from "backend-lib/src/userEvents/clickhouse";
import { segmentIdentifyEvent } from "backend-lib/test/factories/segment";
import { v4 as uuid } from "uuid";

async function seedDemo() {
  const now = Date.now();
  const messageId1 = uuid();

  await insertUserEvents({
    workspaceId: backendConfig().defaultWorkspaceId,
    events: [
      {
        messageId: messageId1,
        messageRaw: segmentIdentifyEvent({
          messageId: messageId1,
          anonymousId: uuid(),
          userId: uuid(),
          receivedAt: new Date(now).toISOString(),
          sentAt: new Date(now - 1000).toISOString(),
          timestamp: new Date(now - 1000).toISOString(),
          // 5 minutes ago
          traits: {
            createdAt: new Date(now - 300000).toISOString(),
          },
        }),
      },
    ],
  });
}

seedDemo().catch((e) => {
  console.error(e);
  process.exit(1);
});
