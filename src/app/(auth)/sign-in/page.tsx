"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaSquareFacebook } from "react-icons/fa6";
import { authClient } from "@/lib/auth-client";
import { FcGoogle } from "react-icons/fc";

export default function CardDemo() {
  const login = async (provider: "facebook" | "google") => {
    authClient.signIn.social({
      provider: provider,
      callbackURL: "/",
    });
  };

  return (
    <Card className="max-w-150">
      <CardHeader>
        <CardTitle className="text-center mb-5">
          Login to your account
        </CardTitle>
        <CardDescription className="text-center">
          Ark Learning Management System
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-row items-center justify-center">
        <Button
          onClick={() => login("facebook")}
          variant="outline"
          className="w-39 text-ellipsis m-4 flex items-center gap-2"
        >
          <FaSquareFacebook size={4} />
          Facebook
        </Button>
        <Button
          onClick={() => login("google")}
          variant="outline"
          className="w-39 text-ellipsis m-4 flex items-center gap-2"
        >
          <FcGoogle size={4} />
          Google
        </Button>
      </CardContent>
    </Card>
  );
}
