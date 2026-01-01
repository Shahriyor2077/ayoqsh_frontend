import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { tokenStorage } from "@/types";
import {
  LayoutDashboard,
  Users,
  Receipt,
  LogOut,
  Menu,
  Droplets,
  Building2,
  MessageSquare,
  QrCode,
  History,
  FileBarChart,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-background">{children}</div>;

  const isModerator = user.role === "moderator";
  const isOperator = user.role === "operator";

  const getRoleName = (role: string) => {
    switch (role) {
      case "moderator": return "Moderator";
      case "operator": return "Operator";
      case "customer": return "Mijoz";
      default: return role;
    }
  };

  const navigation = [
    ...(isModerator ? [
      { name: "Boshqaruv paneli", href: "/", icon: LayoutDashboard },
      { name: "Foydalanuvchilar", href: "/users", icon: Users },
      { name: "Shaxobchalar", href: "/stations", icon: Building2 },
      { name: "Cheklar", href: "/checks", icon: Receipt },
      { name: "Mijozlar hisoboti", href: "/customers-report", icon: FileBarChart },
      { name: "Xabarlar", href: "/messages", icon: MessageSquare },
    ] : []),
    ...(isOperator ? [
      { name: "Chek yaratish", href: "/", icon: QrCode },
      { name: "Chop etilmagan", href: "/pending-checks", icon: Printer },
      { name: "Tarix", href: "/history", icon: History },
    ] : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-primary p-2 rounded-lg">
          <Droplets className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-none">AYoQSH</h1>
          <p className="text-xs text-slate-400 mt-1">Boshqaruv tizimi</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200
                  ${isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }
                `}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <Avatar className="w-8 h-8 bg-slate-800 border border-slate-700">
            <AvatarFallback className="text-xs text-white bg-primary">
              {user.username?.substring(0, 2).toUpperCase() || user.fullName?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.fullName || user.username}</p>
            <p className="text-xs text-slate-500">{getRoleName(user.role)}</p>
          </div>
        </div>
        <Button
          variant="destructive"
          className="w-full justify-start gap-3 pl-4"
          onClick={() => setLogoutDialogOpen(true)}
        >
          <LogOut className="w-4 h-4" />
          Chiqish
        </Button>
      </div>
    </div>
  );

  const handleLogout = () => {
    const redirectUrl = isModerator ? "/moderator" : "/operator";
    setLogoutDialogOpen(false);
    // Tokenni tozalash va darhol redirect qilish
    tokenStorage.remove();
    localStorage.removeItem("ayoqsh_user");
    window.location.href = redirectUrl;
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 shrink-0">
        <SidebarContent />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden h-16 border-b flex items-center justify-between px-4 bg-background z-20">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Droplets className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold">AYoQSH</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8 page-enter">{children}</div>
        </main>
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tizimdan chiqish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham tizimdan chiqmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Yo'q</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleLogout}
            >
              Ha, chiqish
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
