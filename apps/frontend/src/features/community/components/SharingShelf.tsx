"use client";

import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { ChevronDown, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { composeHref } from "@/features/compose/href";
import { SharingArticle } from "@/features/sharing/components/SharingArticle";
import { sharingHref, type Sharing } from "@/features/sharing/types";

/** 제목 줄에만 배경을 두고, 본문은 화면 폭을 활용하는 블로그형 나눔 목록. */
export function SharingShelf({
  communityId,
  sharings,
}: {
  communityId: number;
  sharings: Sharing[];
}) {
  const [authorId, setAuthorId] = useState("");
  const authors = Array.from(new Map(sharings.map(({ author }) => [String(author.userId), author])).values());
  const selected = authors.find((author) => String(author.userId) === authorId);
  const visible = selected ? sharings.filter((sharing) => sharing.author.userId === selected.userId) : sharings;

  return (
    <section aria-label="나눔 자료실">
      <div className="flex items-center gap-2 rounded-2xl bg-surface-warm px-4 py-2">
        <Image
          src="/mascot/hi.png"
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 object-contain"
        />
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <h2 className="truncate text-lg font-bold">
            {selected ? selected.name : "나눔 자료실"}
          </h2>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon" className="size-11" aria-label="나눔을 올린 사람 선택">
                <ChevronDown className="size-5" aria-hidden="true" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                sideOffset={4}
                className="z-50 max-h-[min(20rem,var(--radix-dropdown-menu-content-available-height))] min-w-40 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md"
              >
                <DropdownMenu.RadioGroup value={selected ? authorId : ""} onValueChange={setAuthorId}>
                  {[{ userId: "", name: "전체 나눔" }, ...authors].map((author) => (
                    <DropdownMenu.RadioItem
                      key={author.userId}
                      value={String(author.userId)}
                      className="flex min-h-11 cursor-pointer items-center rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted data-[state=checked]:bg-muted data-[state=checked]:font-bold"
                    >
                      <span className="truncate">{author.name}</span>
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        <Button asChild variant="ghost" size="icon" className="size-11" aria-label="나눔 쓰기">
          <Link href={composeHref({ kind: "sharing", communityId })}>
            <Plus className="size-5" />
          </Link>
        </Button>
      </div>

      {sharings.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-foreground/50">
          아직 올라온 나눔이 없어요
        </p>
      ) : (
        <div className="mx-4 divide-y divide-border/60">
          {visible.map((sharing) => (
            <SharingArticle key={sharing.id} sharing={sharing} profileHref={sharingHref(sharing)} preview />
          ))}
        </div>
      )}
    </section>
  );
}
