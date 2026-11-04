"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

function PostHogUserIdentity() {
  const { data: session, status } = useSession();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    const user = session?.user;
    const userId = user?.id;

    if (status === "authenticated" && typeof userId === "string" && userId) {
      if (identifiedUserId.current && identifiedUserId.current !== userId) {
        posthog.reset();
      }

      if (identifiedUserId.current !== userId) {
        posthog.identify(userId, {
          ...(user.email ? { email: user.email } : {}),
          ...(user.name ? { name: user.name } : {}),
          ...(user.role ? { role: user.role } : {}),
        });
        identifiedUserId.current = userId;
      }
      return;
    }

    if (identifiedUserId.current) {
      posthog.reset();
      identifiedUserId.current = null;
    }
  }, [session?.user, status]);

  return null;
}

export default function SessionTimeoutWrapper() {
  useSessionTimeout();
  return <PostHogUserIdentity />;
}
