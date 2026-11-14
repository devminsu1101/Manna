"use client";

import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTALL_GUIDE_OPEN } from "./install-guide";

export function InstallGuideButton() {
  return <Button variant="outline" size="block" onClick={() => window.dispatchEvent(new Event(INSTALL_GUIDE_OPEN))}>
    <Smartphone className="size-5" /> 홈 화면에 만나 추가하는 방법
  </Button>;
}
