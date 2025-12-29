import { useState, useRef } from "react";
import { useCreateCheck, useChecks, useOperatorStats, useStationCustomers } from "@/hooks/use-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  QrCode,
  Droplets,
  History,
  Printer,
  Copy,
  Users,
  Loader2,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Check } from "@/types";
import { formatLiters } from "@/lib/format";

const checkSchema = z.object({
  amountLiters: z.coerce
    .number()
    .min(0.1, "Miqdor 0.1 dan kam bo'lmasligi kerak")
    .max(10000, "Miqdor 10000 dan oshmasligi kerak")
    .refine((val) => val > 0, "Miqdor musbat bo'lishi kerak"),
  customerName: z.string().min(1, "Mijoz ismi kiritilishi shart"),
  customerPhone: z.string().min(1, "Telefon raqam kiritilishi shart"),
  customerAddress: z.string().optional(),
});

export default function OperatorPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const createCheck = useCreateCheck();
  const { data: checks } = useChecks({ operatorId: user?.id });
  const { data: stats, isLoading: statsLoading } = useOperatorStats(user?.id || 0);
  const { data: customers, isLoading: customersLoading } = useStationCustomers(user?.stationId || 0);
  const [showQR, setShowQR] = useState(false);
  const [lastCheck, setLastCheck] = useState<Check | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof checkSchema>>({
    resolver: zodResolver(checkSchema),
    defaultValues: {
      amountLiters: 0,
      customerName: "",
      customerPhone: "+998",
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

  const handleCopyCode = () => {
    if (lastCheck?.code) {
      navigator.clipboard.writeText(lastCheck.code);
      toast({ title: "Nusxa olindi", description: "Kod clipboard'ga nusxalandi" });
    }
  };

  const handlePrint = () => {
    if (!printRef.current || !lastCheck) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
            <!DOCTYPE html><html><head><title>Chek - ${lastCheck.code}</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
                .receipt { border: 2px solid #000; padding: 20px; width: 300px; text-align: center; }
                .header { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                .qr-container { margin: 20px 0; }
                .qr-container img { width: 200px; height: 200px; }
                .code { font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 3px; margin: 15px 0; }
                .amount { font-size: 28px; font-weight: bold; color: #0066cc; }
                .customer { font-size: 14px; margin: 10px 0; text-align: left; padding: 10px; background: #f5f5f5; }
                .info { font-size: 12px; color: #666; margin-top: 15px; }
                .footer { margin-top: 20px; font-size: 11px; color: #999; }
            </style></head><body>
            <div class="receipt">
                <div class="header">AYoQSH</div>
                <div class="header">${lastCheck.station?.name || user?.station?.name || ""}</div>
                <div class="qr-container">${lastCheck.qrCode ? `<img src="${lastCheck.qrCode}" alt="QR Code" />` : ""}</div>
                <div class="code">${lastCheck.code}</div>
                <div class="amount">${lastCheck.amountLiters} LITR</div>
                <div class="customer">
                    <strong>Mijoz:</strong> ${lastCheck.customerName || "-"}<br/>
                    <strong>Tel:</strong> ${lastCheck.customerPhone || "-"}<br/>
                    ${lastCheck.customerAddress ? `<strong>Manzil:</strong> ${lastCheck.customerAddress}` : ""}
                </div>
                <div class="info">
                    Yaratilgan: ${format(new Date(lastCheck.createdAt), "dd.MM.yyyy HH:mm")}<br/>
                    Amal qilish: ${format(new Date(lastCheck.expiresAt), "dd.MM.yyyy")} gacha
                </div>
                <div class="footer">Telegram botda kodni kiriting<br/>@ayoqsh_bot</div>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
            </body></html>
        `);
    printWindow.document.close();
  };

  const myChecks = checks?.filter((c) => c.operatorId === user?.id) || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold">Operator paneli</h2>
        <p className="text-muted-foreground mt-2">
          {user?.station?.name || "Shaxobcha"} - Chek yaratish va statistika
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
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
        <Card>
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
        <Card>
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

      <Tabs defaultValue="check" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="check">
            <QrCode className="w-4 h-4 mr-2" />
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
          <Card className="border-primary/20 shadow-xl shadow-primary/5 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-blue-400" />
            <CardHeader>
              <CardTitle>Yangi chek yaratish</CardTitle>
              <CardDescription>
                Mijoz ma'lumotlarini kiriting va QR-kodli chek yarating.
              </CardDescription>
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
                  </div>
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
                            <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                            <Input
                              type="number"
                              placeholder="0.00"
                              min="0.1"
                              step="any"
                              className="pl-12 h-14 text-2xl font-bold"
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                field.onChange(value < 0 ? 0 : value);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg h-14 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                    disabled={createCheck.isPending || !user?.stationId}
                  >
                    {createCheck.isPending ? "Yaratilmoqda..." : "Chek yaratish"}
                    <QrCode className="ml-2 h-5 w-5" />
                  </Button>
                  {!user?.stationId && (
                    <p className="text-sm text-destructive text-center">
                      Sizga shaxobcha biriktirilmagan. Administrator bilan bog'laning.
                    </p>
                  )}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myChecks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Hali chek yaratilmagan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    myChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell className="font-mono font-bold">{check.code}</TableCell>
                        <TableCell>{check.customerName || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {check.customerPhone || "-"}
                        </TableCell>
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
                            {check.status === "used"
                              ? "Ishlatilgan"
                              : check.status === "pending"
                                ? "Kutilmoqda"
                                : check.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(check.createdAt), "dd.MM HH:mm")}
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
              <CardDescription>
                {user?.station?.name || "Shaxobcha"}da chek ishlatgan mijozlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : customers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                  Hali mijoz yo'q.
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
                    {customers?.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.fullName || "Noma'lum"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.phone || "-"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatLiters(customer.balanceLiters)} L
                        </TableCell>
                        <TableCell className="text-right">
                          {(customer as any)._count?.usedChecks || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Chek yaratildi!</DialogTitle>
            <DialogDescription className="text-center">
              Mijoz ushbu kodni Telegram botda kiritishi yoki QR kodni skanerlashi mumkin.
            </DialogDescription>
          </DialogHeader>
          <div ref={printRef} className="flex flex-col items-center py-6">
            <div className="w-52 h-52 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
              {lastCheck?.qrCode ? (
                <img src={lastCheck.qrCode} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-32 h-32 text-slate-400" />
              )}
            </div>
            <div className="text-center space-y-1 mt-4">
              <p className="text-sm text-muted-foreground">Chek kodi:</p>
              <p className="text-3xl font-bold font-mono tracking-wider">{lastCheck?.code}</p>
              <p className="text-xl font-bold text-primary mt-2">{lastCheck?.amountLiters} Litr</p>
              <div className="text-sm text-muted-foreground mt-2">
                <p>Mijoz: {lastCheck?.customerName}</p>
                <p>Tel: {lastCheck?.customerPhone}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={handleCopyCode}>
              <Copy className="w-4 h-4 mr-2" />
              Nusxa olish
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Chop etish
            </Button>
            <Button onClick={() => setShowQR(false)}>Tayyor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
