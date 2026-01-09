import { useAuth } from "@/hooks/use-auth";
import { useChecks, useConfirmCheck } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Copy, QrCode, Loader2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { Check } from "@/types";

export default function PendingChecksPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { data: checks, isLoading } = useChecks({ operatorId: user?.id || 0 });
    const confirmCheck = useConfirmCheck();
    const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);
    const [showQR, setShowQR] = useState(false);

    // Chop etilmagan cheklar - isPrinted: false
    const unprintedChecks = checks?.filter((c) => !c.isPrinted) || [];

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({ title: "Nusxalandi", description: "Kod nusxalandi" });
    };

    const handlePrint = (check: Check) => {
        const w = window.open("", "_blank");
        if (!w) return;

        const stationName = check.station?.name || user?.station?.name || "";
        const qrImg = check.qrCode
            ? `<img src="${check.qrCode}" style="width:200px;height:200px;object-fit:contain" alt="QR Code" />`
            : "";

        const html = `<!DOCTYPE html><html><head><title>Chek</title></head><body style="font-family:Arial;text-align:center;padding:20px"><div style="border:2px solid #000;padding:20px;width:300px;margin:auto"><h2>AYOQSH</h2><h3>${stationName}</h3>${qrImg}<p style="font-size:24px;font-weight:bold;font-family:monospace">${check.code}</p><p>Chek kodi</p><p style="font-size:20px;font-weight:bold;color:#0066cc">${check.amountLiters} LTR</p><div style="margin-top:10px;font-size:14px;color:#666"><p>Mijoz: ${check.customerName || "-"}</p><p>Tel: ${check.customerPhone || "-"}</p></div></div><script>window.print();window.close();</script></body></html>`;

        w.document.write(html);
        w.document.close();

        // Chop etilgan deb belgilash (backend'da)
        confirmCheck.mutate(check.id);
        toast({ title: "Chop etildi", description: "Chek chop etilgan deb belgilandi" });
    };

    const handleMarkAsPrinted = (check: Check) => {
        confirmCheck.mutate(check.id);
        toast({ title: "Belgilandi", description: "Chek chop etilgan deb belgilandi" });
    };

    const openQRDialog = (check: Check) => {
        setSelectedCheck(check);
        setShowQR(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-display font-bold flex items-center gap-3">
                    <Printer className="h-8 w-8 text-orange-500" />
                    Chop etilmagan cheklar
                </h2>
                <p className="text-muted-foreground mt-2">
                    Yaratilgan lekin hali chop etilmagan cheklar
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Chop etilmagan cheklar</CardTitle>
                    <CardDescription>
                        {unprintedChecks.length} ta chek chop etilmagan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : unprintedChecks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                            <p>Barcha cheklar chop etilgan!</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>QR</TableHead>
                                    <TableHead>Kod</TableHead>
                                    <TableHead>Mijoz</TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead>Miqdor</TableHead>
                                    <TableHead>Holat</TableHead>
                                    <TableHead>Sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {unprintedChecks.map((check) => (
                                    <TableRow key={check.id}>
                                        <TableCell>
                                            {check.qrCode ? (
                                                <img
                                                    src={check.qrCode}
                                                    alt="QR"
                                                    className="w-12 h-12 rounded border cursor-pointer hover:scale-110 transition-transform"
                                                    onClick={() => openQRDialog(check)}
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                                                    <QrCode className="h-6 w-6 text-slate-400" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-lg">{check.code}</TableCell>
                                        <TableCell>{check.customerName || "-"}</TableCell>
                                        <TableCell className="text-muted-foreground">{check.customerPhone || "-"}</TableCell>
                                        <TableCell className="font-bold text-primary">{check.amountLiters} L</TableCell>
                                        <TableCell>
                                            {check.status === "used" ? (
                                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                    Ishlatilgan
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                    Kutilmoqda
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(check.createdAt), "dd.MM.yyyy HH:mm")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="outline" onClick={() => handleCopyCode(check.code)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => openQRDialog(check)}>
                                                    <QrCode className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleMarkAsPrinted(check)} title="Chop etilgan deb belgilash">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                </Button>
                                                <Button size="sm" variant="default" onClick={() => handlePrint(check)}>
                                                    <Printer className="h-4 w-4 mr-1" />
                                                    Chop etish
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* QR Code Dialog */}
            <Dialog open={showQR} onOpenChange={setShowQR}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center">Chek ma'lumotlari</DialogTitle>
                        <DialogDescription className="text-center">
                            Mijoz ushbu kod bilan Telegram botda litr olishi mumkin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="w-52 h-52 border-2 border-slate-200 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                            {selectedCheck?.qrCode ? (
                                <img src={selectedCheck.qrCode} alt="QR Code" className="w-full h-full object-contain" />
                            ) : (
                                <QrCode className="w-32 h-32 text-slate-400" />
                            )}
                        </div>
                        <div className="text-center space-y-1 mt-4">
                            <p className="text-sm text-muted-foreground">Chek kodi:</p>
                            <p className="text-3xl font-bold font-mono tracking-wide">{selectedCheck?.code}</p>
                            <p className="text-xl font-bold text-primary mt-2">{selectedCheck?.amountLiters} LTR</p>
                            <div className="mt-2 text-sm text-muted-foreground">
                                <p>Mijoz: {selectedCheck?.customerName || "-"}</p>
                                <p>Tel: {selectedCheck?.customerPhone || "-"}</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2 sm:justify-center">
                        <Button variant="outline" onClick={() => selectedCheck && handleCopyCode(selectedCheck.code)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Nusxa
                        </Button>
                        <Button variant="outline" onClick={() => selectedCheck && handlePrint(selectedCheck)}>
                            <Printer className="w-4 h-4 mr-2" />
                            Chop etish
                        </Button>
                        <Button onClick={() => setShowQR(false)}>Yopish</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
