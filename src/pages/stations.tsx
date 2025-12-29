import React, { useState } from "react";
import { useStations, useCreateStation, useUpdateStation, useDeleteStation } from "@/hooks/use-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Loader2, MapPin, Phone, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Station } from "@/types";

const stationSchema = z.object({
    name: z.string().min(1, "Nom kiritilishi shart"),
    address: z.string().optional(),
    phone: z.string().optional(),
});

export default function StationsPage() {
    const { data: stations, isLoading } = useStations();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editStation, setEditStation] = useState<Station | null>(null);
    const [deleteStation, setDeleteStation] = useState<Station | null>(null);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold">Shaxobchalar</h2>
                    <p className="text-muted-foreground mt-1">AYoQSH filiallarini boshqarish.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Shaxobcha qo'shish
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array(3)
                        .fill(0)
                        .map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="pb-2">
                                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                                </CardContent>
                            </Card>
                        ))
                ) : (
                    stations?.map((station) => (
                        <Card key={station.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        {station.name}
                                    </CardTitle>
                                    <Badge variant={station.isActive ? "default" : "secondary"}>
                                        {station.isActive ? "Faol" : "Nofaol"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {station.address && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {station.address}
                                    </p>
                                )}
                                {station.phone && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {station.phone}
                                    </p>
                                )}
                                <div className="flex gap-4 pt-2 border-t mt-3">
                                    <div>
                                        <p className="text-2xl font-bold">{station._count?.operators || 0}</p>
                                        <p className="text-xs text-muted-foreground">Operatorlar</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{station._count?.checks || 0}</p>
                                        <p className="text-xs text-muted-foreground">Cheklar</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setEditStation(station)}
                                    >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Tahrirlash
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setDeleteStation(station)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {!isLoading && stations?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">Hali shaxobcha qo'shilmagan.</div>
            )}

            <StationDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

            <StationDialog
                open={!!editStation}
                onOpenChange={(open) => !open && setEditStation(null)}
                station={editStation}
            />

            <DeleteStationDialog
                station={deleteStation}
                onClose={() => setDeleteStation(null)}
            />
        </div>
    );
}

function StationDialog({
    open,
    onOpenChange,
    station,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    station?: Station | null;
}) {
    const createStation = useCreateStation();
    const updateStation = useUpdateStation();
    const isEdit = !!station;

    const form = useForm<z.infer<typeof stationSchema>>({
        resolver: zodResolver(stationSchema),
        defaultValues: {
            name: station?.name || "",
            address: station?.address || "",
            phone: station?.phone || "",
        },
    });

    // Reset form when station changes
    React.useEffect(() => {
        if (station) {
            form.reset({
                name: station.name,
                address: station.address || "",
                phone: station.phone || "",
            });
        } else {
            form.reset({ name: "", address: "", phone: "" });
        }
    }, [station, form]);

    const onSubmit = (values: z.infer<typeof stationSchema>) => {
        if (isEdit && station) {
            updateStation.mutate(
                { id: station.id, data: values },
                {
                    onSuccess: () => {
                        onOpenChange(false);
                        form.reset();
                    },
                }
            );
        } else {
            createStation.mutate(values, {
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
            });
        }
    };

    const isPending = createStation.isPending || updateStation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Shaxobchani tahrirlash" : "Yangi shaxobcha"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Shaxobcha ma'lumotlarini yangilang." : "Yangi AYoQSH filialini qo'shing."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nomi</FormLabel>
                                    <FormControl>
                                        <Input placeholder="AYoQSH #1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manzil</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Toshkent, Chilonzor tumani" {...field} />
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
                                    <FormLabel>Telefon</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+998901234567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Bekor qilish
                            </Button>
                            <Button type="submit" disabled={isPending}>
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

function DeleteStationDialog({
    station,
    onClose,
}: {
    station: Station | null;
    onClose: () => void;
}) {
    const deleteStation = useDeleteStation();

    const handleDelete = () => {
        if (station) {
            deleteStation.mutate(station.id, {
                onSuccess: onClose,
            });
        }
    };

    return (
        <AlertDialog open={!!station} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Shaxobchani o'chirish</AlertDialogTitle>
                    <AlertDialogDescription>
                        <span className="font-semibold">{station?.name}</span> shaxobchasini o'chirmoqchimisiz?
                        Bu amalni qaytarib bo'lmaydi.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteStation.isPending}
                    >
                        {deleteStation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        O'chirish
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
