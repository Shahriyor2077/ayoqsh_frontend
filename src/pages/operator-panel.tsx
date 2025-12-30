import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChecks, useCreateCheck, useOperatorStats, useStationCustomers } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, History, Users, Droplets, Search, MapPin, Phone, User, Loader2, Copy, Printer, RotateCcw, QrCode } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { formatLiters } from "@/lib/format";
import type { Check } from "@/types";

const checkSchema = z.object({
  amountLiters: z.coerce.number().min(0.1).max(10000).refine((val) => val > 0),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerAddress: z.string().optional(),
});

export default function OperatorPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const createCheck = useCreateCheck();
  const { data: checks } = useChecks({ operatorId: user?.id || 0 });
  const { data: stats, isLoading: statsLoading } = useOperatorStats(user?.id || 0);
  const { data: customers, isLoading: customersLoading } = useStationCustomers(user?.stationId || 0);

  const [lastCheck, setLastCheck] = useState<Check | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [quickCustomer, setQuickCustomer] = useState<{ name: string; phone: string } | null>(null);
  const [quickAmount, setQuickAmount] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const myChecks = checks?.filter((c) => c.operatorId === user?.id) || [];

  const filteredCustomers = customers?.filter(
    (c) =>
      !customerSearch ||
      c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
  );

  const form = useForm<z.infer<typeof checkSchema>>({
    resolver: zodResolver(checkSchema),
    defaultValues: {
      amountLiters: 0,
      customerName: "",
      customerPhone: "",
      customerAddress: "",
    },
  });

  const onSubmit = (values: z.infer<typeof checkSchema>) => {
    if (!user?.stationId) return;

    createCheck.mutate(
      {
        amountLiters: values.amountLiters,
        operatorId: user.id,
        stationId: user.stationId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerAddress: values.customerAddress,
      },
      {
        onSuccess: (data) => {
          setLastCheck(data);
          setShowQR(true);
          form.reset();
        },
      }
    );
  };

  const handleQuickAdd = () => {
    if (!user?.stationId || !quickCustomer) {
      toast({ title: "Xatolik", description: "Mijozni tanlang", variant: "destructive" });
      return;
    }

    const amount = parseFloat(quickAmount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Xatolik", description: "Miqdorni kiriting", variant: "destructive" });
      return;
    }

    createCheck.mutate(
      {
        amountLiters: amount,
        operatorId: user.id,
        stationId: user.stationId,
        customerName: quickCustomer.name,
        customerPhone: quickCustomer.phone,
        customerAddress: "",
      },
      {
        onSuccess: (data) => {
          setLastCheck(data);
          setShowQuickAdd(false);
          setShowQR(true);
          setQuickAmount("");
          setQuickCustomer(null);
        },
      }
    );
  };

  const openQuickAdd = (check: Check) => {
    setQuickCustomer({
      name: check.customerName || "",
      phone: check.customerPhone || "",
    });
    setQuickAmount("");
    setShowQuickAdd(true);
  };

  const handleCopyCode = () => {
    if (lastCheck?.code) {
      navigator.clipboard.writeText(lastCheck.code);
      toast({ title: "Nusxalandi", description: "Kod nusxalandi" });
    }
  };

  const handlePrint = () => {
    if (!lastCheck) return;
    const w = window.open("", "_blank");
    if (!w) return;

    const stationName = lastCheck.station?.name || user?.station?.name || "";
    const qrImg = lastCheck.qrCode ? `<img src="${lastCheck.qrCode}" style="width:200px;height:200px;object-fit:contain" alt="QR Code" />` : "";

    const html = `<!DOCTYPE html><html><head><title>Chek</title></head><body style="font-family:Arial;text-align:center;padding:20px"><div style="border:2px solid #000;padding:20px;width:300px;margin:auto"><h2>AYOQSH</h2><h3>${stationName}</h3>${qrImg}<p class="text-3xl font-bold font-mono tracking-wide">${lastCheck.code}</p><p class="text-sm text-muted-foreground">Chek kodi:</p><p class="text-xl font-bold text-primary mt-2">${lastCheck.amountLiters} LTR</p><div class="mt-2 text-sm text-muted-foreground"><p>Mijoz: ${lastCheck.customerName || "-"}</p><p>Tel: ${lastCheck.customerPhone || "-"}</p></div></div><script>window.print();window.close();</script></body></html>`;

    w.document.write(html);
    w.document.close();
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
              Oxirgi yaratilgan chek
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
                  <p className="text-sm text-muted-foreground">
                    {lastCheck.customerName} • {lastCheck.amountLiters} L
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4 mr-1" />
                  Nusxa
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" />
                  Chop etish
                </Button>
                <Button size="sm" variant="default" onClick={() => setShowQR(true)}>
                  <QrCode className="h-4 w-4 mr-1" />
                  QR ko'rish
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
            Tarix
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Mijozlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="check">
          <Card className="border-primary/20 shadow-primary/5 shadow-lg">
            <div className="h-2 bg-gradient-to-r from-primary to-blue-400" />
            <CardHeader>
              <CardTitle>Yangi chek yaratish</CardTitle>
              <CardDescription>Mijoz malumotlarini kiriting va QR-kodli chek yarating.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mijoz ismi</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Ism Familiya" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon raqam</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="+998901234567" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manzil (ixtiyoriy)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Toshkent, Chilonzor tumani" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amountLiters"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Litr miqdori</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                              <Input
                                type="number"
                                placeholder="0.00"
                                min="0.1"
                                step="0.1"
                                className="pl-12 h-12 text-xl font-bold"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) < 0 ? 0 : parseFloat(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                    disabled={createCheck.isPending || !user?.stationId}
                  >
                    {createCheck.isPending ? "Yaratilmoqda..." : "Chek yaratish"}
                    <QrCode className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Cheklar tarixi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Miqdor</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myChecks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Hali chek yaratilmagan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    myChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell className="font-mono font-bold">{check.code}</TableCell>
                        <TableCell>{check.customerName || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{check.customerPhone || "-"}</TableCell>
                        <TableCell className="font-bold">{check.amountLiters} L</TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${check.status === "used"
                              ? "bg-green-100 text-green-700"
                              : check.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                              }`}
                          >
                            {check.status === "used" ? "Ishlatilgan" : check.status === "pending" ? "Kutilmoqda" : check.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{format(new Date(check.createdAt), "dd.MM HH:mm")}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openQuickAdd(check)}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Qayta
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
            <DialogTitle className="text-center">Chek yaratildi!</DialogTitle>
            <DialogDescription className="text-center">
              Mijoz ushbu kod bilan Telegram botda litr olishi mumkin.
            </DialogDescription>
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
              <p className="text-sm text-muted-foreground">Chek kodi:</p>
              <p className="text-3xl font-bold font-mono tracking-wide">{lastCheck?.code}</p>
              <p className="text-xl font-bold text-primary mt-2">{lastCheck?.amountLiters} LTR</p>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Mijoz: {lastCheck?.customerName || "-"}</p>
                <p>Tel: {lastCheck?.customerPhone || "-"}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={handleCopyCode}>
              <Copy className="w-4 h-4 mr-2" />
              Nusxa
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Chop etish
            </Button>
            <Button onClick={() => setShowQR(false)}>Tayyor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Qayta chek yaratish</DialogTitle>
            <DialogDescription>Yangi chek yarating.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-medium">{quickCustomer?.name}</p>
              <p className="text-sm text-muted-foreground">{quickCustomer?.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Litr miqdori</label>
              <div className="relative mt-1">
                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input
                  type="number"
                  placeholder="0.00"
                  min="0.1"
                  step="0.1"
                  className="pl-12 h-12 text-xl font-bold"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickAdd(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleQuickAdd} disabled={createCheck.isPending}>
              {createCheck.isPending ? "Yaratilmoqda..." : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
