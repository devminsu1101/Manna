/** `GET /api/v1/notifications`의 한 줄(D-3627). `createdAt`은 서버가 `+09:00`으로 준다. */
export type AppNotification = {
  id: number;
  type: "join_request" | "join_approved" | "new_sharing" | "partners_started" | "prayed_for_you";
  body: string;
  linkPath: string | null;
  read: boolean;
  createdAt: string;
};
