import { useState } from "react";
import { useChecks, useStations } from "@/hooks/use-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Receipt } from "lucide-react";
import { format } from "date-fns";

export default function ChecksPage() {
    const [stationFilter, setStationFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");

    const { data: stations } = useStations();
    const { data: checks, isLoading } = useChecks({
        stationId: stationFilter !== "all" ? parseInt(stationFilter) : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
    });

    const filteredChecks = checks?.filter(check =>
        check.code.toLowerCase().includes(search.toLowerCase()) ||
        check.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        check.customerPhone?.includes(search) ||
        check.operator?.fullName?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'used':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Ishlatilgan</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Kutilmoqda</Badge>;
            case 'expired':
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">Muddati o'tgan</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Bekor qilingan</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-display font-bold">Cheklar</h2>
                <p className="text-muted-foreground mt-1">Barcha QR-kodli cheklar ro'yxati.</p>
            </div>

            <div className="flex flex-wrap gap-4">
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Kod, mijoz yoki operator..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={stationFilter} onValueChange={setStationFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Shaxobcha" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Barcha shaxobchalar</SelectItem>
                        {stations?.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Holat" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Barchasi</SelectItem>
                        <SelectItem value="pending">Kutilmoqda</SelectItem>
                        <SelectItem value="used">Ishlatilgan</SelectItem>
                        <SelectItem value="expired">Muddati o'tgan</SelectItem>
                        <SelectItem value="cancelled">Bekor qilingan</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Cheklar ro'yxati
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kod</TableHead>
                                <TableHead>Miqdor</TableHead>
                                <TableHead>Shaxobcha</TableHead>
                                <TableHead>Operator</TableHead>
                                <TableHead>Mijoz</TableHead>
                                <TableHead>Holat</TableHead>
                                <TableHead>Yaratilgan</TableHead>
                                <TableHead>Amal qilish</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            Yuklanmoqda...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredChecks?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        Cheklar topilmadi.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredChecks?.map((check) => (
                                    <TableRow key={check.id}>
                                        <TableCell className="font-mono font-bold">{check.code}</TableCell>
                                        <TableCell className="font-bold">{check.amountLiters} L</TableCell>
                                        <TableCell>{check.station?.name || '-'}</TableCell>
                                        <TableCell>{check.operator?.fullName || check.operator?.username || '-'}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{check.customerName || '-'}</p>
                                                {check.customerPhone && (
                                                    <p className="text-xs text-muted-foreground">{check.customerPhone}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(check.status)}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(check.createdAt), 'dd.MM.yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(check.expiresAt), 'dd.MM.yyyy')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
