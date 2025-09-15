"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Newspaper, Phone, LayoutDashboard, User } from "lucide-react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/lessons", label: "Lessons", icon: <BookOpen /> },
  { href: "/news", label: "News", icon: <Newspaper /> },
  { href: "/contact", label: "Contact", icon: <Phone /> },
  { href: "/dashboard/student", label: "Dashboard", icon: <LayoutDashboard /> },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="font-bold">PoliSor Lite</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-primary",
                  pathname.startsWith(item.href) && item.href !== "/" ? "text-primary" : pathname === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Link href="/auth">
              <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
                <User className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
