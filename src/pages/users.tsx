import { useState, useEffect } from "react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useStations } from "@/hooks/use-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Loader2, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { User, Station } from "@/types";

const userFormSchema = z.object({
  fullName: z.string().min(1, "Ism kiritilishi shart"),
  username: z.string().min(1, "Login kiritilishi shart"),
  password: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["moderator", "operator"]),
  stationId: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
});

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const { data: stations } = useStations();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const filteredUsers = users?.filter((u) => {
    const matchesSearch =
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleName = (role: string) => {
    switch (role) {
      case "moderator":
        return "Moderator";
      case "operator":
        return "Operator";
      case "customer":
        return "Mijoz";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold">Foydalanuvchilar</h2>
          <p className="text-muted-foreground mt-1">
            Moderatorlar, operatorlar va mijozlarni boshqarish.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg shadow-primary/20">
          <UserPlus className="w-4 h-4 mr-2" />
          Qo'shish
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="operator">Operator</SelectItem>
            <SelectItem value="customer">Mijoz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Barcha foydalanuvchilar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foydalanuvchi</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Shaxobcha</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead className="w-24">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        Yuklanmoqda...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Foydalanuvchilar topilmadi.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.fullName || "Noma'lum"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.username
                              ? `@${user.username}`
                              : user.phone || user.telegramId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "moderator"
                              ? "default"
                              : user.role === "operator"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {getRoleName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === "customer"
                          ? (user.lastStation?.name || "-")
                          : (user.station?.name || "-")
                        }
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                          className={
                            user.isActive ? "bg-green-100 text-green-700" : ""
                          }
                        >
                          {user.isActive ? "Faol" : "Nofaol"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.createdAt), "dd.MM.yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditUser(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        stations={stations || []}
      />

      <UserDialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        stations={stations || []}
        user={editUser}
      />

      <DeleteUserDialog user={deleteUser} onClose={() => setDeleteUser(null)} />
    </div>
  );
}

function UserDialog({
  open,
  onOpenChange,
  stations,
  user,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  stations: Station[];
  user?: User | null;
}) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isEdit = !!user;

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      phone: "+998",
      role: "operator",
      stationId: null,
      isActive: true,
    },
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        username: user.username || "",
        password: "",
        phone: user.phone || "+998",
        role: user.role as "moderator" | "operator",
        stationId: user.stationId,
        isActive: user.isActive,
      });
    } else {
      form.reset({
        fullName: "",
        username: "",
        password: "",
        phone: "+998",
        role: "operator",
        stationId: null,
        isActive: true,
      });
    }
  }, [user, form]);

  const selectedRole = form.watch("role");

  const onSubmit = (values: z.infer<typeof userFormSchema>) => {
    // Remove empty password for edit
    const data: any = { ...values };
    if (isEdit && !data.password) {
      delete data.password;
    }
    // Convert null to undefined for stationId
    if (data.stationId === null) {
      delete data.stationId;
    }

    if (isEdit && user) {
      updateUser.mutate(
        { id: user.id, data },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createUser.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Foydalanuvchi ma'lumotlarini yangilang."
              : "Tizimga yangi foydalanuvchi qo'shing."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To'liq ism</FormLabel>
                  <FormControl>
                    <Input placeholder="Ism Familiya" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Login</FormLabel>
                  <FormControl>
                    <Input placeholder="login" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Parol {isEdit && "(bo'sh qoldiring o'zgartirmaslik uchun)"}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon (ixtiyoriy)</FormLabel>
                  <FormControl>
                    <Input placeholder="+998901234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Rolni tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedRole === "operator" && (
              <FormField
                control={form.control}
                name="stationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shaxobcha</FormLabel>
                    {stations.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>Avval shaxobcha qo'shing</span>
                      </div>
                    ) : (
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Shaxobchani tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {stations.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holat</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "true")}
                      value={field.value ? "true" : "false"}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="true">Faol</SelectItem>
                        <SelectItem value="false">Nofaol</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={
                  isPending ||
                  (!isEdit && selectedRole === "operator" && stations.length === 0)
                }
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Saqlash" : "Yaratish"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const deleteUser = useDeleteUser();

  const handleDelete = () => {
    if (user) {
      deleteUser.mutate(user.id, {
        onSuccess: onClose,
      });
    }
  };

  return (
    <AlertDialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-semibold">{user?.fullName || user?.username}</span>{" "}
            foydalanuvchisini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            O'chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
