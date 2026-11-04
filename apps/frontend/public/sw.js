self.addEventListener("push", (event) => {
  let payload = { title: "만나", body: "새 알림이 도착했어요", linkPath: "/" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // 잘못된 페이로드여도 사용자가 볼 수 있는 기본 알림을 표시한다.
  }
  const path = typeof payload.linkPath === "string" && payload.linkPath.startsWith("/")
    && !payload.linkPath.startsWith("//") ? payload.linkPath : "/";
  event.waitUntil(self.registration.showNotification(payload.title || "만나", {
    body: payload.body || "새 알림이 도착했어요",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { linkPath: path },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.linkPath || "/";
  const target = new URL(path, self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        try {
          await client.navigate(target);
          return await client.focus();
        } catch {
          // 열린 창을 다시 쓸 수 없다면 새 창으로 이동한다.
        }
      }
    }
    return self.clients.openWindow(target);
  })());
});
