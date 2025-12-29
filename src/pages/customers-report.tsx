import { useState } from "react";
import { useCustomersReport, useTopCustomers, exportCustomersToExcel } from "@/hooks/use-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, TrendingDown, Trophy, Users, Medal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatLiters } from "@/lib/format";

export default function CustomersReportPage() {
    const [order, setOrder] = useState<"desc" | "asc">("desc");
    const { data: customers, isLoading } = useCustomersReport(order);
    const { data: top10 } = useTopCustomers("desc", 10);
    const { data: bottom10 } = useTopCustomers("asc", 10);
    const { toast } = useToast();
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportCustomersToExcel();
            toast({ title: "Muvaffaqiyat", description: "Excel fayl yuklab olindi" });
        } catch (error) {
            toast({ title: "Xatolik", description: "Excel yuklab olishda xatolik", variant: "destructive" });
        } finally {
            setExporting(false);
        }
    };

    const getMedalColor = (index: number) => {
        if (index === 0) return "text-yellow-500";
        if (index === 1) return "text-gray-400";
        if (index === 2) return "text-amber-600";
        return "text-muted-foreground";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-bold tracking-tight">Mijozlar hisoboti</h2>
                    <p className="text-muted-foreground mt-1">Barcha mijozlar statistikasi va TOP-10</p>
                </div>
                <Button onClick={handleExport} disabled={exporting}>
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? "Yuklanmoqda..." : "Excel'ga eksport"}
                </Button>
            </div>

            <Tabs defaultValue="top10" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="top10" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        TOP-10
                    </TabsTrigger>
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Barcha mijozlar
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="top10">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    Eng ko'p sotib olganlar
                                </CardTitle>
                                <CardDescription>TOP-10 mijozlar</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {top10?.map((customer, index) => (
                                        <div
                                            key={customer.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${index < 3 ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" : "bg-slate-50"}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${index < 3 ? "bg-white shadow-sm" : "bg-slate-200"}`}>
                                                    {index < 3 ? (
                                                        <Medal className={`h-5 w-5 ${getMedalColor(index)}`} />
                                                    ) : (
                                                        <span className="font-bold text-sm text-muted-foreground">{index + 1}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{customer.fullName || "Noma'lum"}</p>
                                                    <p className="text-xs text-muted-foreground">{customer.phone || "-"}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">{formatLiters(customer.balanceLiters)} L</p>
                                                <p className="text-xs text-muted-foreground">{customer._count?.usedChecks || 0} chek</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!top10 || top10.length === 0) && (
                                        <p className="text-center text-muted-foreground py-4">Mijozlar yo'q</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-orange-500" />
                                    Eng kam sotib olganlar
                                </CardTitle>
                                <CardDescription>Oxirgi 10 mijoz</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {bottom10?.map((customer, index) => (
                                        <div
                                            key={customer.id}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-orange-50/50 border-orange-100"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
                                                    <span className="font-bold text-sm text-orange-600">{index + 1}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{customer.fullName || "Noma'lum"}</p>
                                                    <p className="text-xs text-muted-foreground">{customer.phone || "-"}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-orange-600">{formatLiters(customer.balanceLiters)} L</p>
                                                <p className="text-xs text-muted-foreground">{customer._count?.usedChecks || 0} chek</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!bottom10 || bottom10.length === 0) && (
                                        <p className="text-center text-muted-foreground py-4">Mijozlar yo'q</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="all">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Barcha mijozlar</CardTitle>
                                    <CardDescription>Jami: {customers?.length || 0} ta mijoz</CardDescription>
                                </div>
                                <Select value={order} onValueChange={(v) => setOrder(v as "desc" | "asc")}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desc">
                                            <div className="flex items-center gap-2">
                                                <TrendingDown className="h-4 w-4" />
                                                Eng ko'p → Eng kam
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="asc">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4" />
                                                Eng kam → Eng ko'p
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">№</TableHead>
                                        <TableHead>F.I.O</TableHead>
                                        <TableHead>Telefon</TableHead>
                                        <TableHead className="text-right">Balans (L)</TableHead>
                                        <TableHead className="text-right">Cheklar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">Yuklanmoqda...</TableCell>
                                        </TableRow>
                                    ) : customers?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">Mijozlar yo'q</TableCell>
                                        </TableRow>
                                    ) : (
                                        customers?.map((customer, index) => (
                                            <TableRow key={customer.id}>
                                                <TableCell>
                                                    {index < 3 ? (
                                                        <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 justify-center">
                                                            {index + 1}
                                                        </Badge>
                                                    ) : (
                                                        index + 1
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{customer.fullName || "-"}</TableCell>
                                                <TableCell>{customer.phone || "-"}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatLiters(customer.balanceLiters)}</TableCell>
                                                <TableCell className="text-right">{customer._count?.usedChecks || 0}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
