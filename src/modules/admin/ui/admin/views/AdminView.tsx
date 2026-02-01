"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function AdminView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <div>
      <Button
        onClick={() => {
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/sign-in");
                queryClient.clear();
              },
            },
          });
        }}
      >
        page
      </Button>
    </div>
  );
}
