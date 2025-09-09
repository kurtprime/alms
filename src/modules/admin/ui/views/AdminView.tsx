import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function AdminView() {
  const router = useRouter();
  return (
    <div className="h-full m-4 border bg-muted  rounded-2xl flex flex-col items-center justify-center gap-4">
      <Button
        onClick={() => {
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => router.push("/sign-in"),
            },
          });
        }}
      >
        page
      </Button>
    </div>
  );
}
