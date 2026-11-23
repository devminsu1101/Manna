import Image from "next/image";
import Link from "next/link";

import type { Sharing } from "../types";

const PREVIEW_LENGTH = 100;

/** 목록과 상세에서 같은 작성자·날짜·본문 레이아웃을 사용한다. */
export function SharingArticle({ sharing, profileHref, preview = false }: {
  sharing: Sharing;
  profileHref: string;
  preview?: boolean;
}) {
  const characters = Array.from(sharing.body.trim());
  const longer = preview && characters.length > PREVIEW_LENGTH;
  const body = (
    <>
      <p className="whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground">
        {preview ? characters.slice(0, PREVIEW_LENGTH).join("") : sharing.body}
      </p>
      {longer && (
        <span className="mt-1 inline-block text-sm text-foreground/50">… 자세히 보기</span>
      )}
    </>
  );

  return (
    <article className="min-w-0 py-5">
      <Link
        href={profileHref}
        aria-label={preview ? `${sharing.author.name}님의 나눔 보기` : `${sharing.author.name}님의 기도제목 보기`}
        className="mb-3 flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Image
          src={sharing.author.profileImageUrl ?? "/mascot/default.png"}
          alt=""
          width={36}
          height={36}
          className={`size-9 shrink-0 rounded-full ${sharing.author.profileImageUrl ? "object-cover" : "object-contain"}`}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{sharing.author.name}</p>
          <time className="text-xs text-foreground/50" dateTime={sharing.createdAt}>
            {sharing.createdAt.slice(0, 10)}
          </time>
        </div>
      </Link>
      {preview ? (
        <Link
          href={`/sharings/${sharing.id}`}
          className="block rounded-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          {body}
        </Link>
      ) : body}
    </article>
  );
}
