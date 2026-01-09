import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChecks, useCreateCheck, useCancelCheck, useConfirmCheck, useOperatorStats, useStationCustomers } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Users, Droplets, Search, Loader2, Printer, QrCode, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { formatLiters } from "@/lib/format";
import type { Check } from "@/types";

export default function OperatorPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const createCheck = useCreateCheck();
  const cancelCheck = useCancelCheck();
  const confirmCheck = useConfirmCheck();
  const { data: checks } = useChecks({ operatorId: user?.id || 0 });
  const { data: stats, isLoading: statsLoading } = useOperatorStats(user?.id || 0);
  const { data: customers, isLoading: customersLoading } = useStationCustomers(user?.stationId || 0);

  const [lastCheck, setLastCheck] = useState<Check | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [litrAmount, setLitrAmount] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const myChecks = checks?.filter((c) => c.operatorId === user?.id) || [];
  // Chop etilmagan cheklar - isPrinted: false
  const unprintedChecks = myChecks.filter((c) => !c.isPrinted);

  const filteredCustomers = customers?.filter(
    (c) =>
      !customerSearch ||
      c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
  );

  // Avtomatik print funksiyasi
  const autoPrint = useCallback(
    (check: Check) => {
      const qrImg = check.qrCode ? `<img src="${check.qrCode}" style="width:200px;height:200px;object-fit:contain" alt="QR Code" />` : "";

      const html = `<!DOCTYPE html><html><head><title>Chek</title><style>body{font-family:Arial;text-align:center;padding:20px;margin:0}.check{border:2px solid #000;padding:20px;width:280px;margin:auto}.title{font-size:32px;font-weight:bold;margin:0}.station{font-size:16px;color:#333;margin:5px 0 10px 0}.code{font-size:28px;font-weight:bold;font-family:monospace;letter-spacing:2px;margin:10px 0}.litr{font-size:32px;font-weight:bold;color:#0066cc;margin:10px 0}.label{font-size:14px;color:#666;margin:5px 0}.contact{font-size:11px;color:#666;margin-top:15px;border-top:1px dashed #ccc;padding-top:10px}</style></head><body><div class="check"><h1 class="title">NBS GAZ OIL</h1><p class="station">Avtomabillarga Yoqilg'i Quyish Shahobchasi</p>${qrImg}<p class="code">${check.code}</p><p class="label">Chek kodi</p><p class="litr">${check.amountLiters} L</p><p style="font-size:12px;color:#666">${format(new Date(), "dd.MM.yyyy HH:mm")}</p><p class="contact">Murojaat uchun: @nbs_gaz_oil ga yozing</p></div><script>window.onafterprint=function(){window.close();};window.print();</script></body></html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (w) {
        w.onload = () => URL.revokeObjectURL(url);
      }
    },
    []
  );

  // Chek yaratish - faqat litr bilan
  const handleCreateCheck = useCallback(() => {
    if (!user?.stationId) {
      toast({ title: "Xatolik", description: "Shaxobcha topilmadi", variant: "destructive" });
      return;
    }

    const amount = parseFloat(litrAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Xatolik", description: "Litr miqdorini kiriting", variant: "destructive" });
      inputRef.current?.focus();
      return;
    }

    createCheck.mutate(
      {
        amountLiters: amount,
        operatorId: user.id,
        stationId: user.stationId,
      },
      {
        onSuccess: (data) => {
          setLastCheck(data);
          setLitrAmount("");
          setShowQR(true); // QR dialog ochilsin
          inputRef.current?.focus();
          toast({ title: "Chek yaratildi!", description: `${amount} litr - ${data.code}` });
        },
        onError: () => {
          toast({ title: "Xatolik", description: "Chek yaratishda xatolik", variant: "destructive" });
        },
      }
    );
  }, [user, litrAmount, createCheck, autoPrint, toast]);

  // Chekni bekor qilish
  const handleCancelCheck = useCallback(() => {
    if (!lastCheck) return;

    cancelCheck.mutate(lastCheck.id, {
      onSuccess: () => {
        setShowQR(false);
        setLastCheck(null);
        toast({ title: "Bekor qilindi", description: "Chek bekor qilindi" });
        inputRef.current?.focus();
      },
      onError: () => {
        toast({ title: "Xatolik", description: "Chekni bekor qilishda xatolik", variant: "destructive" });
      },
    });
  }, [lastCheck, cancelCheck, toast]);

  // Enter tugmasi bosilganda
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !createCheck.isPending) {
      e.preventDefault();
      handleCreateCheck();
    }
  };

  // Sahifa yuklanganda inputga fokus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handlePrint = () => {
    if (!lastCheck) return;
    const checkToPrint = lastCheck;
    setShowQR(false);

    // Chekni tasdiqlash - ro'yxatdan yo'qoladi
    confirmCheck.mutate(checkToPrint.id);
    setLastCheck(null);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        autoPrint(checkToPrint);
        inputRef.current?.focus();
      });
    });
  };

  // Ro'yxatdan chop etish
  const handleReprintCheck = (check: Check) => {
    // Chekni tasdiqlash - ro'yxatdan yo'qoladi
    confirmCheck.mutate(check.id);
    autoPrint(check);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold">Chek yaratish</h2>
        <p className="text-muted-foreground mt-2">{user?.station?.name || "Shaxobcha"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="pb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bugun</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.today.checks || 0} chek</div>
                <p className="text-xs text-muted-foreground">{formatLiters(stats?.today.liters)} litr</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="pb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bu oy</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.month.checks || 0} chek</div>
                <p className="text-xs text-muted-foreground">{formatLiters(stats?.month.liters)} litr</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="pb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jami</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total.checks || 0} chek</div>
                <p className="text-xs text-muted-foreground">{formatLiters(stats?.total.liters)} litr</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Oxirgi yaratilgan chek */}
      {lastCheck && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <QrCode className="h-4 w-4 text-green-600" />
              Oxirgi chek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {lastCheck.qrCode && (
                  <img src={lastCheck.qrCode} alt="QR" className="w-16 h-16 rounded border" />
                )}
                <div>
                  <p className="font-mono font-bold text-lg">{lastCheck.code}</p>
                  <p className="text-sm text-muted-foreground">{lastCheck.amountLiters} L</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" />
                  Qayta chop
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowQR(true)}>
                  <QrCode className="h-4 w-4 mr-1" />
                  Ko'rish
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="check" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="check">
            <Plus className="w-4 h-4 mr-2" />
            Chek yaratish
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Chop etilmagan
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Mijozlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="check">
          <Card className="border-primary/30 shadow-xl">
            <div className="h-2 bg-gradient-to-r from-primary to-blue-400" />
            <CardContent className="pt-8 pb-8">
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center">
                  <Droplets className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h3 className="text-xl font-bold">Litr kiriting</h3>
                  <p className="text-sm text-muted-foreground">Enter tugmasini bosing</p>
                </div>

                <div className="relative">
                  <Input
                    ref={inputRef}
                    type="number"
                    placeholder="0"
                    min="0.1"
                    step="0.1"
                    className="h-20 text-4xl font-bold text-center pr-16"
                    value={litrAmount}
                    onChange={(e) => setLitrAmount(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={createCheck.isPending}
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                    L
                  </span>
                </div>

                <Button
                  size="lg"
                  className="w-full h-16 text-xl bg-primary hover:bg-primary/90 shadow-lg"
                  onClick={handleCreateCheck}
                  disabled={createCheck.isPending || !user?.stationId}
                >
                  {createCheck.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      Yaratilmoqda...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-6 w-6" />
                      CHEK YARATISH
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Chop etilmagan cheklar</CardTitle>
              <CardDescription>Kutilayotgan cheklar - hali ishlatilmagan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>Miqdor</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unprintedChecks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Chop etilmagan chek yo'q.
                      </TableCell>
                    </TableRow>
                  ) : (
                    unprintedChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell className="font-mono font-bold">{check.code}</TableCell>
                        <TableCell className="font-bold text-lg">{check.amountLiters} L</TableCell>
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
                        <TableCell className="text-muted-foreground">{format(new Date(check.createdAt), "dd.MM HH:mm")}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleReprintCheck(check)}>
                            <Printer className="h-4 w-4 mr-1" />
                            Chop
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Shaxobcha mijozlari
              </CardTitle>
              <CardDescription>{user?.station?.name || "Shaxobcha"} a chek olgan mijozlar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Mijoz ismi yoki telefon raqami..."
                    className="pl-10"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
              </div>

              {customersLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredCustomers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                  {customerSearch ? "Mijoz topilmadi" : "Hali mijoz yo'q."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mijoz</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead className="text-right">Balans</TableHead>
                      <TableHead className="text-right">Cheklar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers?.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.fullName || "Noma'lum"}</TableCell>
                        <TableCell className="text-muted-foreground">{customer.phone || "-"}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{formatLiters(customer.balanceLiters)}</TableCell>
                        <TableCell className="text-right">{(customer as any)._count?.usedChecks || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Chek</DialogTitle>
          </DialogHeader>
          <div ref={printRef} className="flex flex-col items-center justify-center py-6">
            <div className="w-52 h-52 border-2 border-slate-200 rounded-lg bg-white flex items-center justify-center overflow-hidden">
              {lastCheck?.qrCode ? (
                <img src={lastCheck.qrCode} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-32 h-32 text-slate-400" />
              )}
            </div>
            <div className="text-center space-y-1 mt-4">
              <p className="text-3xl font-bold font-mono tracking-wide">{lastCheck?.code}</p>
              <p className="text-sm text-muted-foreground">Chek kodi</p>
              <p className="text-2xl font-bold text-primary mt-2">{lastCheck?.amountLiters} L</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Chop etish
            </Button>
            <Button variant="destructive" onClick={handleCancelCheck} disabled={cancelCheck.isPending}>
              <X className="w-4 h-4 mr-2" />
              Bekor qilish
            </Button>
            <Button onClick={() => setShowQR(false)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
