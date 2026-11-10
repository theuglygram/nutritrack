import { APP_NAME } from "@nutritrack/core";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <p className="text-center text-xl font-bold tracking-tight">{APP_NAME}</p>
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-lg font-semibold">{title}</h1>
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer && <CardFooter className="flex-col gap-2 text-sm">{footer}</CardFooter>}
        </Card>
      </div>
    </main>
  );
}
